
const fs = require('fs');
const path = require('path');

// Define the log file path, typically in the user's home directory
const logFilePath = path.join(require('os').homedir(), 'SmashSWG-Launcher.log');

// Function to log messages to the file
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    // Append the log message to the log file
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

module.exports = log;
