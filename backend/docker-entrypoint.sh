#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Waiting for database to be ready and applying migrations..."
# Loop until prisma migrate deploy succeeds (handles waiting for postgres to start up)
until npx prisma migrate deploy; do
  echo "Database is not ready yet. Retrying migrations in 3 seconds..."
  sleep 3
done

echo "Database migrations applied successfully!"

# Start the application server
echo "Starting Express Server..."
exec node src/server.js
