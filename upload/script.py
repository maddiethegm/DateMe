import os
import csv
import json
import requests
from cryptography.fernet import Fernet

# Define config file path
config_file = 'config.py'

# Step 1: Check for existing config file; create if not found
if not os.path.exists(config_file):
    print("Configuration file 'config.py' not found. Creating a new one...")
    
    # Prompt the user for configuration values
    api_url = input("Enter API URL (e.g., https://your-api-endpoint.com/api/upload): ")
    client_id = input("Enter your CLIENT_ID: ")
    client_secret = input("Enter your CLIENT_SECRET: ")
    encryption_key = input("Enter your ENCRYPTION_KEY (32-byte key, e.g. 'your-32-byte-key-here'): ")
    csv_file_path = input("Enter the path to your CSV file (e.g., reviews.csv): ")

    # Write the config file
    with open(config_file, 'w') as f:
        f.write(f"API_URL = \"{api_url}\"\n")
        f.write(f"CLIENT_ID = \"{client_id}\"\n")
        f.write(f"CLIENT_SECRET = \"{client_secret}\"\n")
        f.write(f"ENCRYPTION_KEY = b\"{encryption_key}\"\n")
        f.write(f"CSV_FILE_PATH = \"{csv_file_path}\"\n")

    print("✅ Configuration file 'config.py' has been created.")
else:
    print("✅ Found existing configuration file: config.py.")

# Step 2: Load configuration from config.py
from config import API_URL, CLIENT_ID, CLIENT_SECRET, ENCRYPTION_KEY, CSV_FILE_PATH

# Initialize Fernet for encryption (ENCRYPTION_KEY must be bytes)
if isinstance(ENCRYPTION_KEY, str):
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode()

fernet = Fernet(ENCRYPTION_KEY)

def get_access_token():
    """Obtain an access token from the API using client credentials."""
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    response = requests.post("https://your-oauth-endpoint.com/token", data=payload)
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Failed to get access token: {response.text}")

def encrypt_data(data):
    """Encrypt the payload using Fernet."""
    encrypted = fernet.encrypt(json.dumps(data).encode())
    return encrypted.decode()

def upload_reviews():
    # Step 1: Read CSV file
    try:
        with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            reviews = []
            for row in csv_reader:
                # Map CSV fields to the schema we defined
                review = {
                    "userId": row.get("User ID", ""),
                    "displayName": row.get("User display name", "Anonymous user"),
                    "timestamp": row.get("Timestamp", ""),
                    "name": row.get("Name", "Maddie"),
                    "date": row.get("When was the date?", ""),
                    "location": row.get("Where was the date?", ""),
                    "planningRating": int(row.get("How would you rate Maddie's planning and communication leading up to the date?", 0)),
                    "planningComments": row.get("Other comments about interactions leading up to your date", ""),
                    "paymentResponsibility": row.get("Who paid for activities while you were out?", ""),
                    "smallTalkRating": int(row.get("How was the small talk?", 0)),
                    "safetyRating": int(row.get("How safe did you feel on the date?", 0)),
                    "connectionRating": int(row.get("How connected did you feel with Maddie?", 0)),
                    "overallRating": int(row.get("How would you rate your date overall?", 0)),
                    "dateComments": row.get("Comments about your date", ""),
                    "postDateRating": int(row.get("How would you rate the post-date interactions overall?", 0)),
                    "postDateComments": row.get("Comments about your post-date interactions", ""),
                    "adviceForOthers": row.get("Advice for others considering a date with Maddie", ""),
                    "adviceForMaddie": row.get("Advice for Maddie", "")
                }
                reviews.append(review)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    # Step 2: Encrypt the data
    encrypted_data = encrypt_data(reviews)

    # Step 3: Get access token (if using OAuth)
    try:
        access_token = get_access_token()
    except Exception as e:
        print(f"Authentication failed: {e}")
        return

    # Step 4: Send encrypted payload to API
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        API_URL,
        data=encrypted_data,
        headers=headers
    )

    if response.status_code == 200:
        print("✅ Successfully uploaded reviews")
    else:
        print(f"❌ Upload failed: {response.text}")

if __name__ == "__main__":
    upload_reviews()
