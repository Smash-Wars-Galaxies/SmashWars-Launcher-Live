const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const childProcess = require('child_process');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Configure the log rotation using electron-log's built-in features
//log.transports.file.resolvePath = () => path.join(os.homedir(), 'SmashSWG-Launcher.log');
log.transports.file.file = require('os').homedir() + '/SmashSWG-Launcher-log.txt';
log.transports.file.maxSize = 20 * 1024; // 20KB log file size limit
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
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
	log.info('Creating main window');
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
			nodeIntegration: true,
			contextIsolation: false
		}
	});
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));

	mainWindow.once('ready-to-show', () => {
		log.info('Main window ready to show');
		mainWindow.show();
	});

	mainWindow.once('closed', () => {
		log.info('Main window closed');
		mainWindow = null;
	});
}

app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.on('open-directory-dialog', function (event, response) {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}, function (files) {
		if (files) {
			log.info(`Selected directory: ${files[0]}`);
			event.sender.send(response, files[0])
		} else {
			log.info('No directory selected');
		}
	});
});

ipcMain.on('open-profcalc', function () {
	let profCalcExePath = path.join(process.resourcesPath, 'profcalc', 'KSWGProfCalcEditor.exe');

	try {
		const child = childProcess.spawn(profCalcExePath, {
			cwd: path.dirname(profCalcExePath),
			detached: true,
			stdio: 'ignore'
		});
		child.unref();
		log.info('ProfCalc process spawned successfully');
	} catch (error) {
		log.error('Error spawning ProfCalc process:', error);
	}
});

ipcMain.on('close-launcher', () => {
	log.info('Closing launcher');
	app.quit();
});

autoUpdater.on('update-downloaded', (info) => {
	log.info('Update downloaded', info);
	autoUpdater.quitAndInstall(true, true);
});

autoUpdater.on('download-progress', (progress) => {
	log.info('Download progress', progress);
	mainWindow.webContents.send('download-progress', progress);
})

autoUpdater.on('update-available', info => {
	log.info('Update available', info);
	mainWindow.webContents.send('downloading-update', 'Downloading version ' + info.version);
})

app.on('ready', function () {
	log.info('App is ready');
	autoUpdater.checkForUpdates();
});

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
	log.error('Uncaught Exception:', error);
});