#!/bin/bash

set -e

echo "Running Prisma migrations..."
pnpm prisma:migrate:deploy

echo "Starting application..."
exec "$@" 