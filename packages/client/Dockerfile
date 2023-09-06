# Use an official Node.js runtime as the base image
FROM node:18-bullseye-slim AS builder

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the container
COPY package.json yarn.lock ./
# Copy the entire project directory into the container
COPY . .

# Copy the .env file into the container
COPY ./packages/client/.env ./app/packages/client/.env

RUN ls -l
# Install project dependencies using Yarn
RUN yarn workspace @revertdotdev/revert-ui install
# Build the React app
RUN yarn workspace @revertdotdev/revert-ui build

# Expose the port the app will run on
EXPOSE 3000

# Define the command to start the app
CMD ["yarn", "start"]
