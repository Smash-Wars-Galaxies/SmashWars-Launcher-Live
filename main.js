const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const url = require('url');

// Configure the log rotation using electron-log's built-in features
log.transports.file.resolvePath = () => path.join(require('os').homedir(), 'SmashSWG-Launcher.log');
log.transports.file.maxSize = 20 * 1024; // 20KB log file size limit
log.transports.file.archiveLog = (oldLog) => {
    log.info(`Archiving log: ${oldLog}`);
};

// Set the log level for console and file transports
log.transports.console.level = 'info';
log.transports.file.level = 'info';

// Set the logger for autoUpdater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.info('App starting...');

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1024,
		minWidth: 1024,
		height: 600,
		minHeight: 600,
		resizable: false,
		show: false,
		autoHideMenuBar: true,
		frame: false,
		icon: path.join(__dirname, 'img/logo_icon.ico'),
		webPreferences: {
			nodeIntegration: true
		}
	});
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));
	//if (require('electron-is-dev')) mainWindow.webContents.openDevTools();
	mainWindow.once('ready-to-show', () => mainWindow.show());
	mainWindow.once('closed', () => mainWindow = null);
}

app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.on('open-directory-dialog', function (event, response) {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}, function (files) {
		if (files) event.sender.send(response, files[0])
	});
});

ipcMain.on('close-launcher', () => {
	app.quit();
});

autoUpdater.on('update-downloaded', (info) => {
	autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
	mainWindow.webContents.send('download-progress', progress);
})

autoUpdater.on('update-available', info => {
	mainWindow.webContents.send('downloading-update', 'Downloading version ' + info.version);
})

app.on('ready', function () {
	autoUpdater.checkForUpdates();
});