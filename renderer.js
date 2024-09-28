const ipc = require('electron').ipcRenderer;
const shell = require('electron').shell;
const remote = require('electron').remote;
const log = require('electron-log');
const fs = require('fs');
const childProcess  = require('child_process');
const server = require('./server');
const package = require('./package');
const install = require('./install');
const path = require('path');

const playBtn = document.getElementById('play');
const websiteBtn = document.getElementById('web');
const discordBtn = document.getElementById('disc');
const profcalcBtn = document.getElementById('profcalc');
const rightContent = document.getElementById('rightcontent');
const rightSettings = document.getElementById('rightsettings');
const folderBox = document.getElementById('folder');
const browseBtn = document.getElementById('browse');
const installBtn = document.getElementById('install');
const updateBtn = document.getElementById('update');
const cancelBtn = document.getElementById('cancel');
const modListBox = document.getElementById('modlist');
const progressBox = document.getElementById('progressbox');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progresstext');
const minBtn = document.getElementById('minimize');
const closeBtn = document.getElementById('close');
const screenSizeSel = document.getElementById('screenSize');
const vsyncCheckbox = document.getElementById('vsync');
const windowedCheckbox = document.getElementById('windowed');
const borderlessCheckbox = document.getElementById('borderless');
const ramSel = document.getElementById('ram');
const fpsSel = document.getElementById('fps');
const zoomSel = document.getElementById('zoom');
const versionDiv = document.getElementById('version');
versionDiv.innerHTML = package.version;

// List of common screen resolutions
const screenResolutions = [
	{ width: 1024, height: 768, experimental: false },
	{ width: 1280, height: 800, experimental: false },
	{ width: 1366, height: 768, experimental: false },
	{ width: 1440, height: 900, experimental: false },
	{ width: 1600, height: 900, experimental: false },
	{ width: 1680, height: 1050, experimental: false },
	{ width: 1920, height: 1080, experimental: false },
	{ width: 1920, height: 1200, experimental: false },
	{ width: 2560, height: 1080, experimental: false },
	{ width: 2560, height: 1440, experimental: false },
	{ width: 3440, height: 1440, experimental: false },
	{ width: 5120, height: 1440, experimental: true },
];

const configFile = require('os').homedir() + '/SmashWarsGalaxies-Launcher.json';
var config = { folder: '' };
if (fs.existsSync(configFile))
	config = JSON.parse(fs.readFileSync(configFile));
folderBox.value = config.folder;
vsyncCheckbox.checked = config.vsync === 1;
windowedCheckbox.checked = config.windowed === 1;
borderlessCheckbox.checked = config.borderless === 1;
fpsSel.value = config.fps;
ramSel.value = config.ram;
zoomSel.value = config.zoom;
populateScreenSizeOptions();
setSelectedScreenSize();
var needSave = false;
if (!config.mods) {
	config.mods = [];
	needSave = true;
}
if (!config.vsync) {
	config.vsync = 0;
	needSave = true;
}
vsyncCheckbox.addEventListener('change', () => {
	config.vsync = vsyncCheckbox.checked ? 1 : 0;
	saveConfig();
});
if (!config.windowed) {
	config.windowed = 1;
	needSave = true;
}
windowedCheckbox.addEventListener('change', () => {
	config.windowed = windowedCheckbox.checked ? 1 : 0;
	saveConfig();
});
if (!config.borderless) {
	config.borderless = 1;
	needSave = true;
}
borderlessCheckbox.addEventListener('change', () => {
	config.borderless = borderlessCheckbox.checked ? 1 : 0;
	config.constrainMouse = borderlessCheckbox.checked ? true : false;
	saveConfig();
});
if (!config.fps) {
	config.fps = 30;
	needSave = true;
}
fpsSel.value = config.fps;
if (!config.ram) {
	config.ram = 750;
	needSave = true;
}
ramSel.value = config.ram;
if (!config.zoom) {
	config.zoom = 1;
	needSave = true;
}
zoomSel.value = config.zoom;
if (needSave) saveConfig();

minBtn.addEventListener('click', event => remote.getCurrentWindow().minimize());
closeBtn.addEventListener('click', event => remote.getCurrentWindow().close());

playBtn.addEventListener('click', event => {
	if (playBtn.disabled)
		return;
	play();
});

profcalcBtn.addEventListener('click', function (event) {
    ipc.send('open-profcalc');
});

function play() {
	fs.writeFileSync(path.join(config.folder, "swgemu_login.cfg"), `[ClientGame]\r\nloginServerAddress0=${server.address}\r\nloginServerPort0=${server.port}\r\nfreeChaseCameraMaximumZoom=${config.zoom}\r\nskipIntro=1`);
	fs.writeFileSync(path.join(config.folder, "smash.cfg"), `[SwgClient]\r\nallowMultipleInstances=false\r\n\r\n[ClientGraphics]\r\nscreenWidth=${config.screenWidth}\r\nscreenHeight=${config.screenHeight}\r\n\r\nwindowed=${config.windowed}\r\nborderlessWindow=${config.borderless}\r\nconstrainMouseCursorToWindow=${config.constrainMouse}\r\n\r\n[ClientUserInterface]\r\ndebugExamine=0\r\n\r\n[Direct3d9]\r\nallowTearing=${config.vsync}\r\nfullscreenRefreshRate=${config.fps}`);
	var env = Object.create(require('process').env);
	env.SWGCLIENT_MEMORY_SIZE_MB = config.ram;
	try {
		const child = childProcess.spawn("SWGEmu.exe", { cwd: config.folder, env: env, detached: true, stdio: 'ignore' });
		child.unref();

		// Check if the child process was spawned successfully
		if (!child.killed && child.pid) {
			// Send the 'close-launcher' event to the main process
			ipc.send('close-launcher');
		} else {
			log.error('Failed to launch the client.');
		}
	} catch (error) {
		log.error('Error launching the client:', error);
	}
}

function showSettingsPanel() {
	rightContent.style.display = 'none';
	rightSettings.style.display = 'block';
	settings.className = "button active";
}

settings.addEventListener('click', event => {
	showSettingsPanel();
});

websiteBtn.addEventListener('click', event => shell.openExternal("https://harvester.hellafast.io/"));
discordBtn.addEventListener('click', event => shell.openExternal("https://discord.gg/smashley"));

browseBtn.addEventListener('click', function (event) {
	ipc.send('open-directory-dialog', 'selected-directory');
});

folderBox.addEventListener('keyup', event => {
	config.folder = event.target.value;
	saveConfig();
});

ipc.on('selected-directory', function (event, path) {
	folderBox.value = path;
	config.folder = path;
	saveConfig();
});

screenSizeSel.addEventListener('change', event => {
	const [width, height] = event.target.value.split('x');
	config.screenWidth = parseInt(width);
	config.screenHeight = parseInt(height);
	saveConfig();
});

fpsSel.addEventListener('change', event => {
	config.fps = event.target.value;
	saveConfig();
});
ramSel.addEventListener('change', event => {
	config.ram = event.target.value;
	saveConfig();
});
zoomSel.addEventListener('change', event => {
	config.zoom = event.target.value;
	saveConfig();
});

installBtn.addEventListener('click', function (event) {
	if (installBtn.disabled = false) return;
	installBtn.disabled = true;
	ipc.send('open-directory-dialog', 'install-selected');
});

cancelBtn.addEventListener('click', function (event) {
	install.cancel();
	enableAll();
	progressBox.style.display = 'none';
})

ipc.on('install-selected', function (event, path) {
	disableAll();
	resetProgress();
	install.install(path, config.folder, config.mods, true);
});

ipc.on('downloading-update', function (event, text) {
	versionDiv.innerHTML = text;
	disableAll();
});

ipc.on('download-progress', function (event, info) {
	install.progress(info.transferred, info.total);
})

var lastCompleted = 0;
var lastTime = new Date();
var rate = 0;
var units = " B/s";

function resetProgress() {
	lastCompleted = 0;
	lastTime = new Date();
	rate = 0;
}

install.progress = function (completed, total) {
	var time = new Date();
	var elapsed = (time - lastTime) / 1000;
	if (elapsed >= 1) {
		var bytes = completed - lastCompleted;
		units = " B/s";
		rate = bytes / elapsed;
		if (rate > 1024) {
			rate = rate / 1024;
			units = " KB/s";
		}
		if (rate > 1024) {
			rate = rate / 1024;
			units = " MB/s";
		}
		lastCompleted = completed;
		lastTime = time;
	}
	if (progressBox.style.display == 'none') progressBox.style.display = 'block';
	progressText.innerHTML = Math.trunc(completed * 100 / total) + '% (' + rate.toPrecision(3) + units + ')';
	progressBar.style.width = (completed * 100 / total) + '%';
	if (completed == total) {
		enableAll();
		progressBox.style.display = 'none';
	}
}

install.modList = function (mods) {
	modListBox.innerHTML = "";
	for (var mod of mods) {
		var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
		checkbox.value = mod;
		checkbox.id = mod.replace(/[^a-zA-Z]/g, "");
		checkbox.checked = config.mods.includes(mod);
		checkbox.onchange = modListChanged;
		checkbox.disabled = true;
		var label = document.createElement('label');
		label.htmlFor = checkbox.id;
		label.appendChild(document.createTextNode(mod));
		var li = document.createElement('li');
		li.appendChild(checkbox);
		li.appendChild(label);
		modListBox.appendChild(li);
	}
}

function modListChanged() {
	config.mods = [];
	for (var child of modListBox.children) {
		if (child.children[0].checked) config.mods.push(child.children[0].value);
	}
	saveConfig();
	disableAll();
	resetProgress();
	install.install(config.folder, config.folder, config.mods);
}

updateBtn.addEventListener('click', function (event) {
	if (updateBtn.disabled) return;
	disableAll();
	resetProgress();
	install.install(config.folder, config.folder, config.mods, false);
});

if (fs.existsSync(path.join(config.folder, 'bottom.tre'))) {
	disableAll();
	resetProgress();
	install.install(config.folder, config.folder, config.mods, false);
} else {
	playBtn.disabled = true;
	updateBtn.disabled = true;
	install.getManifest(config.mods, true, config.folder, true);
	settings.click();
}

function disableAll() {
	folderBox.disabled = true;
	updateBtn.disabled = true;
	installBtn.disabled = true;
	playBtn.disabled = true;
	browseBtn.disabled = true;
	screenSizeSel.disabled = true;
	ramSel.disabled = true;
	fpsSel.disabled = true;
	zoomSel.disabled = true;
	vsyncCheckbox.disabled = true;
	for (var child of modListBox.children) {
		child.children[0].disabled = true;
	}
}

function enableAll() {
	folderBox.disabled = false;
	updateBtn.disabled = false;
	installBtn.disabled = false;
	playBtn.disabled = false;
	browseBtn.disabled = false;
	ramSel.disabled = false;
	screenSizeSel.disabled = false;
	fpsSel.disabled = false;
	zoomSel.disabled = false;
	vsyncCheckbox.disabled = false;
	for (var child of modListBox.children) {
		child.children[0].disabled = false;
	}
}

function saveConfig() {
	fs.writeFileSync(configFile, JSON.stringify(config));
}

function populateScreenSizeOptions() {
	screenSizeSel.innerHTML = ''; // Clear existing options

	for (const res of screenResolutions) {
		const option = document.createElement('option');
		option.value = `${res.width}x${res.height}`;
		option.text = `${res.width} x ${res.height}${res.experimental ? ' (Experimental, can cause crashes)' : ''}`;
		screenSizeSel.add(option);
	}
}

function setSelectedScreenSize() {
	const selectedSize = `${config.screenWidth}x${config.screenHeight}`;
	screenSizeSel.value = selectedSize;
}

showSettingsPanel();