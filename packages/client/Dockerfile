# Use an official Node.js runtime as the base image
FROM node:14-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the container
COPY package.json yarn.lock ./
# Copy the entire project directory into the container
COPY . .

# Copy the .env file into the container
COPY ./packages/client/.env ./app/packages/client/.env

# Install project dependencies using Yarn
RUN yarn install --check-cache
# Build the React app
RUN yarn workspace @revertdotdev/revert-ui build

# Bundle static assets with nginx
FROM nginx:1.21.0-alpine as production
ENV NODE_ENV production
# Copy built assets from builder
COPY --from=builder /app/packages/client/build /usr/share/nginx/html
# Add your nginx.conf
COPY ./packages/client/nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 3000
# Start nginx
CMD ["nginx", "-g", "daemon off;"]
