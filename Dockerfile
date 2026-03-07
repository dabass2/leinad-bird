# Stage 1: Builder
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if using npm ci)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
# The build command depends on your project setup, often 'npm run build' which uses Vite and Nitro
RUN npm run build

# Stage 2: Production server
FROM node:24-alpine AS production

# Set working directory
WORKDIR /app

# Copy only necessary files from the builder stage
# Adjust the source path based on your build output directory (commonly ./.output or ./dist)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Assuming the build output is in ./.output
COPY --from=builder /app/.output ./.output

# Expose the port your app runs on (default is often 3000)
EXPOSE 3000

USER node

# Command to run the application
# Adjust the file path if your server entry point is different (e.g., dist/server.js)
CMD ["node", ".output/server/index.mjs"]
