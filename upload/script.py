import os
import csv
import json
import requests
from cryptography.fernet import Fernet

# Check if config.py exists; if not, prompt the user to create it
config_file = 'config.py'

if not os.path.exists(config_file):
    print("Configuration file 'config.py' not found. Creating a new one...")
    
    # Prompt the user for configuration values
    api_url = input("Enter API URL (e.g., https://your-api-endpoint.com/api/upload): ")
    client_id = input("Enter your CLIENT_ID: ")
    client_secret = input("Enter your CLIENT_SECRET: ")

    # Write the config file
    with open(config_file, 'w') as f:
        f.write(f"API_URL = \"{api_url}\"\n")
        f.write(f"CLIENT_ID = \"{client_id}\"\n")
        f.write(f"CLIENT_SECRET = \"{client_secret}\"\n")
        f.write("ENABLE_ENCRYPTION = False\n")
        f.write(f"CSV_FILE_PATH = \"C:/Users/maddiethegm/Documents/Date Review (responses).csv\"\n")

    print("✅ Configuration file 'config.py' has been created.")
else:
    print("✅ Found existing configuration file: config.py.")

# Load configuration from config.py
from config import API_URL, CLIENT_ID, CLIENT_SECRET, ENABLE_ENCRYPTION, CSV_FILE_PATH

# Skip encryption if it's disabled
if not ENABLE_ENCRYPTION:
    print("⚠️ Encryption is disabled. Skipping encryption step.")
else:
    # Initialize Fernet for encryption (ENCRYPTION_KEY must be bytes)
    ENCRYPTION_KEY = b"32-byte-long-key-here-please-use-a-real-one"  # You can add this in config.py if needed
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
    csv_file_path = CSV_FILE_PATH
    reviews = []
    
    try:
        with open(csv_file_path, mode='r', encoding='utf-8') as csvfile:
            csv_reader = csv.DictReader(csvfile)
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

    # Step 2: Encrypt the data if encryption is enabled
    if not ENABLE_ENCRYPTION:
        print("⚠️ Encryption is disabled. Sending raw JSON.")
        payload = json.dumps(reviews)
    else:
        encrypted_data = encrypt_data(reviews)
        payload = encrypted_data

    # Step 3: Send data to API using basic auth (Client ID + Secret)
    headers = {
        "Authorization": f"Basic {CLIENT_ID}:{CLIENT_SECRET}",
        "Content-Type": "application/json"
    }
    payload = {"data": json.dumps(reviews)}

    response = requests.post(
        API_URL,
        data=json.dumps(payload),
        headers=headers
    )

    if response.status_code == 200:
        print("✅ Successfully uploaded reviews")
    else:
        print(f"❌ Upload failed: {response.text}")

if __name__ == "__main__":
    upload_reviews()
