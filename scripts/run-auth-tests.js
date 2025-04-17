/**
 * Script to run auth middleware tests with proper server management
 */
const { spawn, execSync } = require('child_process');
const path = require('path');

// Kill any existing server processes
console.log('Checking for existing server processes...');
try {
    if (process.platform === 'win32') {
        execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
    } else {
        execSync('pkill -f "node.*src/server.ts" || true');
    }
} catch (error) {
    // Ignore errors when no processes found
}

console.log('Starting server...');
// Start the server process
const server = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
});

let serverReady = false;
let timeout;

// Track server output for health check
server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[SERVER]: ${output.trim()}`);

    // Check for server ready signal
    if (output.includes('Server is running on port')) {
        serverReady = true;
        clearTimeout(timeout);
        runTests();
    }
});

server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR]: ${data.toString()}`);
});

// Set timeout to prevent hanging if server doesn't start
timeout = setTimeout(() => {
    if (!serverReady) {
        console.error('Server startup timed out after 15 seconds');
        cleanup(1);
    }
}, 15000);

// Function to run tests
function runTests() {
    console.log('\nRunning auth middleware tests...');

    const testProcess = spawn('npx', ['ts-node', '-P', 'scripts/tsconfig.json', 'scripts/test/auth-middleware.ts'], {
        stdio: 'inherit',
        shell: true
    });

    testProcess.on('close', (code) => {
        console.log(`\nTests completed with exit code: ${code}`);
        cleanup(code);
    });
}

// Function to clean up server process
function cleanup(exitCode) {
    console.log('\nShutting down server...');
    if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/PID', server.pid], { stdio: 'ignore' });
    } else {
        server.kill('SIGTERM');
    }

    // Give the server a moment to shut down gracefully
    setTimeout(() => {
        process.exit(exitCode);
    }, 1000);
}

// Handle script interruption
process.on('SIGINT', () => {
    console.log('Test interrupted');
    cleanup(1);
}); 