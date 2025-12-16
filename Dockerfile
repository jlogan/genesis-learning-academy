# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose ports for Vite and API server
EXPOSE 8080 3001

# Start the development server (default)
# For API server, override with: node server.js
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

