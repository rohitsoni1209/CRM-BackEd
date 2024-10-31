# Use Node.js version 20.11.0-alpine as the base image
FROM node:20.11.0-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose port 1711 to the outside world
EXPOSE 1711

# Command to run the application
CMD ["npm", "run", "start"]
