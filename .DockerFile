FROM node:16

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Build the application
RUN npm run build

# Set the correct Python executable in PATH
RUN ln -s /usr/bin/python3 /usr/bin/python

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
