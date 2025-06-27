// Development script to run Electron with hot reload
const { spawn } = require('child_process');
const path = require('path');

// Start the web server
console.log('Starting web server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for server to start, then launch Electron
setTimeout(() => {
  console.log('Starting Electron...');
  const electronProcess = spawn('electron', [path.join(__dirname, 'electron', 'main.js')], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', () => {
    serverProcess.kill();
    process.exit();
  });
}, 3000);

process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit();
});