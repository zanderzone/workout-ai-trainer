# Auth Middleware Testing

This directory contains scripts for testing the application's authentication middleware.

## Auth Middleware Test Runner

The `run-auth-tests.js` script provides a reliable way to run auth middleware tests by:

1. Starting the Express server in a controlled environment
2. Waiting for the server to be fully initialized
3. Running the auth middleware tests
4. Cleanly shutting down the server after tests complete

### How it works

The script uses Node.js `child_process` to:

- Start the server with `npm run dev`
- Monitor server output for the "Server is running on port" message
- Run the auth middleware tests when the server is ready
- Clean up server processes after tests complete

### Usage

Run the script with:

```bash
npm run test:auth-middleware
```

### Troubleshooting

If you encounter test hanging issues:

1. Make sure no other Node.js server processes are running on port 3000
2. Check that your MongoDB connection is working
3. Verify that the `.env` file contains the required environment variables

### Alternative Testing Methods

We previously used:

1. The `start-server-and-test` package, which sometimes hung (preserved in `test:auth-middleware:old` script)
2. A bash script `run-auth-tests.sh` which also works but has less cross-platform compatibility

The current Node.js implementation provides the most reliable and cross-platform solution for running these tests. 