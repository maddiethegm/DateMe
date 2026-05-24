# DateMe/frontend/Dockerfile - Static Build Only
FROM node:24-alpine AS build-stage

WORKDIR /app/src

# Copy package files for dependency caching
COPY package*.json ./

RUN npm install

# Copy all source code
COPY src/ ./src/
COPY public/ ./public/

# Build React app for production
ENV CI=true
ENV REACT_APP_API_URL=http://localhost:3001
RUN npm run build --if-present

# Final stage: Use lighter Nginx or Node.js static server
# Option 1: Lightweight Nginx (recommended)
FROM nginx:alpine

# Copy built files to Nginx serving directory
COPY --from=build-stage /app/src/build /usr/share/nginx/html

# Optional: Custom Nginx config for this container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
