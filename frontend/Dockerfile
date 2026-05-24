# DateMe/frontend/Dockerfile - Static File Server Only (Optimized)
FROM nginx:alpine

# Set Nginx config to serve React Router correctly (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# Entrypoint ensures Nginx starts immediately
CMD ["nginx", "-g", "daemon off;"]
