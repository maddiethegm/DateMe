# 🚀 DateME Reviews Platform - Production Deployment Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER SERVER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Frontend (Nginx + React Static)             ││
│  │              Port: 3000                                  ││
│  │              Image: nginx:alpine                         ││
│  │                                                           ││
│  │  ┌──────────────────────────────┐                       ││
│  │  │      React Build Files        │                       ││
│  │  │      /usr/share/nginx/html    │                       ││
│  │  └──────────────────────────────┘                       ││
│  └─────────────────────────────────────────────────────────┘│
│                        ⬇️ HTTP                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Backend API (Express.js)                    ││
│  │              Port: 3001                                  ││
│  │              Image: node:18-alpine (custom build)        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Persistent Data Store                       ││
│  │                                                           ││
│  │    /app/data/reviews.json       ← Public & Admin reviews   ││
│  │    /app/data/admin.json         ← Site settings & auth     ││
│  │    /app/data/submissions.json   ← Submission tracking      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Required Directory Structure

Before deployment, ensure this structure exists on your server:

```bash
/opt/dateme/
├── source/                        # Application source code (Git clone location)
│   ├── api/                       # Backend Express.js files
│   │   ├── server.js             # Main entry point
│   │   ├── routes/               # API route handlers
│   │   │   ├── admin.js          # Admin management routes
│   │   │   ├── submit.js         # Public submission routes
│   │   │   └── upload.js         # CSV upload (optional)
│   │   ├── middleware/           # Authentication & utilities
│   │   │   └── auth.js
│   │   ├── config.js             # Configuration loader
│   │   └── package.json          # Backend dependencies
│   │
│   └── frontend/                  # Frontend React build
│       ├── src/                  # React source (build step)
│       └── public/               # Static assets
│
├── api/                         # Persistent JSON data stores
│   ├── reviews.json
│   ├── admin.json
│   └── submissions.json
│
└── static-frontend/              # Location for deployed React build files
```

## 📦 Deployment Process

### Step 1: Clone and Set Up Source Code

```bash
# SSH into your production server
ssh user@your-server-ip

# Create directory structure
mkdir -p /opt/dateme/{source/data/static-frontend}

# Clone your application source code to development location
cd /opt/dateme/source

# (Optional) Pull latest changes from Git repository if using version control
# git pull origin main
```

### Step 2: Configure Environment Variables

Create or update `.env` file in the backend directory:

```bash
# Create .env for Backend API (Location: /opt/dateme/source/api/.env)
cat > /opt/dateme/source/api/.env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=${RANDOM_GENERATE_SECURE_TOKEN_HERE}  # Replace with secure value
BCRYPT_ROUNDS=10
ENABLE_ENCRYPTION=false
encryptionKey=your-encryption-key-here
EOF

# ⚠️ Important: Generate a strong JWT_SECRET in production:
# node -e "require('crypto').randomBytes(64).toString('hex')"
```

### Step 3: Configure Admin Credentials

Create the admin configuration file with initial admin user:

```bash
# Location: /opt/dateme/data/admin.json
cat > /opt/dateme/data/admin.json << 'EOF'
{
    "siteConfig": {
        "title": "Maddie's Reviews",
        "description": "Share your honest feedback and reviews!",
        "logoUrl": "",
        "themeColor": "#ec4899",
        "primaryFont": "Segoe UI"
    },
    "accessControl": {
        "enabled": true,
        "admins": [
            {
                "id": "admin_001",
                "username": "admin",
                "displayName": "Super Admin",
                "passwordHash": "HASH_HERE",  # Replace with actual hash
                "status": "active",
                "role": "admin"
            }
        ]
    },
    "featureFlags": {
        "allowDirectSubmission": false,
        "enableDarkModeDefault": true,
        "showStatsPublicly": true
    },
    "systemSettings": {
        "lastModified": new Date().toISOString(),
        "modifiedBy": null
    }
}
EOF

# ⚠️ Generate bcrypt hash for your admin password:
# node -e "require('bcrypt').hash('admin123', 10).then(console.log)"
```

### Step 4: Build and Populate Data Files

Build the backend image and create initial data files:

```bash
cd /opt/dateme/source

# Create empty JSON data files (backend will auto-populate on first run)
touch /opt/dateme/data/reviews.json
touch /opt/dateme/data/submissions.json

# Build Docker images
docker-compose build --no-cache backend-api frontend

# Start the stack
docker-compose up -d
```

### Step 5: Populate Reviews Data (Optional)

The backend will auto-create empty `reviews.json` on startup, but you can pre-populate data manually if needed:

```bash
# Example: Add a sample review to reviews.json
cat > /opt/dateme/data/reviews.json << 'EOF'
[
    {
        "id": "abc123...",
        "timestamp": "2026-05-23T15:05:08-04:00",
        "displayName": "Anonymous user",
        "location": "Example Location",
        "date": "2026-05-23",
        "paymentResponsibility": "Maddie paid for activities",
        "overallExperience": 5,
        "wouldSeeAgain": "yes",
        "overallRating": 5,
        "planningRating": 5,
        "smallTalkRating": 5,
        "safetyRating": 5,
        "connectionRating": 5,
        "dateComments": "Great experience!",
        "postDateComments": "Felt comfortable throughout",
        "adviceForOthers": "Be yourself and have fun",
        "adviceForMaddie": "Keep being authentic",
        "hidden": false,
        "featured": false,
        "adminComment": "",
        "status": "public_submission",
        "createdAt": "2026-05-23T15:05:08Z",
        "updatedAt": "2026-05-23T15:05:08Z"
    }
]
EOF
```

## 📝 Customization Guide for New Instances

If you want to customize or deploy your own instance, edit these files:

### Environment Variables (.env)
| Variable | Purpose | Production Recommendation |
|----------|---------|---------------------------|
| `NODE_ENV` | Runtime environment | Set to `production` |
| `PORT` | Server port (optional) | Default 3001 |
| `JWT_SECRET` | Token signing secret | **Generate unique strong value** |
| `BCRYPT_ROUNDS` | Password hash complexity | Recommended: 10-12 |
| `ENABLE_ENCRYPTION` | Legacy encryption flag | Set to `false` unless needed |

### Admin Configuration (admin.json)
| Field | Purpose | Customization Options |
|-------|---------|----------------------|
| `siteConfig.title` | Site title | Change to your brand name |
| `siteConfig.themeColor` | Primary color | Update to match branding |
| `accessControl.admins.*.username` | Admin username | Set secure credentials |
| `accessControl.admins.*.passwordHash` | Hashed password | Use bcrypt hash generator |

### Frontend Static Files (static-frontend/)
After running `npm run build` locally, copy the output to:
```bash
cp -r frontend/build/* /opt/dateme/static-frontend/
```

### Docker Compose Override
To customize container behavior without modifying source code, use `-e` flags or environment variables in Portainer stack settings.

## 🔐 Security Checklist for Production Deployment

- [ ] **Generate Unique JWT_SECRET**: Use a random string (min 32 characters)
- [ ] **Secure Admin Credentials**: Never use default password; generate bcrypt hash
- [ ] **HTTPS Configuration**: Configure SSL certificates on your reverse proxy layer
- [ ] **Rate Limiting**: Consider adding rate limiting middleware to prevent brute force attacks
- [ ] **Input Sanitization**: Ensure all text fields are sanitized (prevent XSS)
- [ ] **Environment Variables**: Never commit `.env` files to version control
- [ ] **CORS Configuration**: Restrict `Access-Control-Allow-Origin` to your domain(s) in production

## 🔍 Troubleshooting Commands

### Check Container Logs
```bash
# View backend logs
docker-compose logs -f backend-api

# View frontend logs
docker-compose logs -f frontend
```

### Test API Endpoints Directly
```bash
# Test admin login (should return JWT token)
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"adminuser","password":"your_hash"}'

# Get public reviews
curl http://localhost:3001/api/reviews

# Get admin settings
curl http://localhost:3001/api/admin/settings
```

### Restart Services
```bash
# Full restart with new configuration
docker-compose down
docker-compose up -d --build

# Or specific service
docker-compose restart backend-api
docker-compose restart frontend
```

### Reset Data Files (Use with Caution)
```bash
# Backup existing data first
tar -czf data-backup-$(date +%Y%m%d-%H%M%S).tar.gz /opt/dateme/data/

# Create fresh empty data files
> /opt/dateme/data/reviews.json
> /opt/dateme/data/admin.json
> > /opt/dateme/data/submissions.json  # Create as empty file
```

## 📊 Performance Considerations

- **Static Files**: Pre-computed build files improve load times significantly
- **Data Persistence**: JSON files are stored in `/opt/dateme/data/` (named volumes)
- **Container Resource Limits**: Consider setting memory/CPU limits in Portainer for production workloads

## 🆘 Support and Getting Help

If you encounter issues during deployment:

1. Check container logs: `docker-compose logs -f backend-api frontend`
2. Verify data files exist: `ls -l /opt/dateme/data/`
3. Test API connectivity: `curl http://localhost:3001/api/admin/settings`
4. Review environment variables: Ensure no spaces in values, proper quotes

## 📝 License & Credits

This platform is the DateME Reviews application, built for "Maddie's Reviews" brand identity.