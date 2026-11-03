# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY web-studio/package.json web-studio/package-lock.json* ./
RUN npm install

# Copy source code and build production bundle
COPY web-studio/ ./
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy reverse-proxy Nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
