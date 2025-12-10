# Stage 1: Build stage to install dependencies
FROM node:alpine3.18 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json file to the working directory
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install --legacy-peer-deps

# Stage 2: Final stage to copy necessary files
FROM node:alpine3.18

# Set the working directory inside the container
WORKDIR /app

# Copy the dependencies from the build stage
COPY --from=build /app/node_modules /app/node_modules

# Copy the rest of the application files to the working directory
COPY . .

# Expose the port that the app runs on
EXPOSE 3000

# Set the command to run your application
CMD ["node", "app.js"]
