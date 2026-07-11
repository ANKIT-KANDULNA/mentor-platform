FROM node:20-alpine

WORKDIR /usr/src/app

# Install system dependencies (openssl is required by Prisma client)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install to avoid issues if lockfile is out of sync)
RUN npm install

# Copy prisma schema to generate client
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose backend port
EXPOSE 5000

# Make the entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Use entrypoint script to run migrations and start server
ENTRYPOINT ["./docker-entrypoint.sh"]
