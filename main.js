const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const log = require('electron-log');
const {autoUpdater} = require('electron-updater');
const path = require('path');
const url = require('url');
const fs = require('fs');

var setupWindow = null;
var err;

app.commandLine.appendSwitch("disable-http-cache");

log.transports.file.file = require('os').homedir() + '/SmashSWG-Launcher-log.txt';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
//log.info('App starting...');

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1024,
		height: 610,
		useContentSize: true,
		center: true,
		resizable: false,
		fullscreen: false,
		fullscreenable: false,
		maximizable: false,
		minWidth: 1024,
		minHeight: 610,
		maxWidth: 1024,
		maxHeight: 610,
		transparent: true,
		show: false,
		autoHideMenuBar: true,
		frame: false,
		webPreferences: { 
			disableBlinkFeatures: "Auxclick",
			nodeIntegration: true,
			enableRemoteModule: true,
			webviewTag: true
		},
    		icon: path.join(__dirname, 'img/logo_icon.ico')
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

app.on('ready', () => setTimeout(createWindow, 100)); // Linux / MacOS transparancy fix
app.on('window-all-closed', () => app.quit());

ipcMain.on('open-directory-dialog', async (event, response) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.filePaths[0] != undefined) {
	  event.sender.send(response, result.filePaths[0]);
  }
  log.info('Selected Directory Path', result.filePaths[0]);
});

autoUpdater.on('update-downloaded', (info) => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow.webContents.send('download-progress', progress);
});

autoUpdater.on('update-available', info => {
  mainWindow.webContents.send('downloading-update', 'Downloading Update ' + info.version);
});

app.on('ready', function()  {
  if (!require('electron-is-dev'))
    autoUpdater.checkForUpdates();
});