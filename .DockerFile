# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the project files
COPY . .

# Build the app
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
