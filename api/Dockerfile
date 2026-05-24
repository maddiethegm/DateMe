# DateMe/api/Dockerfile
FROM node:24-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY server.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/

# Create directories for JSON data storage (will be mounted from host or volume)
RUN mkdir -p /app/data

# Expose API port
EXPOSE 3001

# Set environment variables (can also use .env file)
ENV NODE_ENV=production
ENV PORT=3001
ENV JWT_SECRET=${JWT_SECRET:-change-this-in-production}

# Start the server
CMD ["node", "server.js"]
