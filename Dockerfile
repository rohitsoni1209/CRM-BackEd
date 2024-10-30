# Use Node.js version 20.11.0 as the base image
FROM node:20.11.0

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files
# COPY package*.json ./
COPY . .

# Install dependencies
RUN npm install

# Copy the rest of the application code

# Expose port 1711 to the outside world
EXPOSE 1711

# Command to run the application
CMD ["npm", "run", "start"]

