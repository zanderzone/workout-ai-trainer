#!/bin/bash

# Kill any existing server processes
echo "Killing any existing node processes..."
pkill -f "node.*src/server.ts" || true

# Start the server in the background
echo "Starting server..."
npm run dev &
server_pid=$!

# Wait for server to start
echo "Waiting for server to start (10 seconds)..."
sleep 10

# Run the tests
echo "Running auth middleware tests..."
npx ts-node -P scripts/tsconfig.json scripts/test/auth-middleware.ts
test_exit_code=$?

# Kill the server
echo "Shutting down server..."
kill $server_pid

# Exit with the test exit code
echo "Test exit code: $test_exit_code"
exit $test_exit_code 