const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const log = require("electron-log");
const functions = require('./functions.js');

log.transports.file.format = "{text}";
log.transports.file.resolvePathFn = () =>
	path.join(app.getPath("userData"), "logs/EPElog.log");
log.transports.file.maxSize = 5 * 1024 * 1024;


let commandsFile = functions.loadCommands();
let settings = functions.loadSettings();
let resizable = true;
if (app.isPackaged) {
	resizable = false;
}
let mainWindow;


function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 548,
		frame: false,
		resizable: resizable,
		transparent: true,
		alwaysOnTop: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegrationInWorker: true,
		},
	});

	mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));

	mainWindow.setHasShadow(false);

	functions.logYALV("Main window created and loaded.");
}

const favoritesFilePath = path.join(app.getPath("userData"), "favorites.json");
if (!fs.existsSync(favoritesFilePath)) {
	fs.writeFileSync(favoritesFilePath, JSON.stringify([]));
    functions.logYALV('File favorites.json was not found. Created new empty file.')
}

app.whenReady().then(() => {
	createWindow();
});

if (app.isPackaged) {
	const menu = Menu.buildFromTemplate([]);
	Menu.setApplicationMenu(menu);
}

ipcMain.on("check-admin-rights", () => {
	exec("NET SESSION", function (err, so, se) {
		const isAdmin = se.length === 0 ? true : false;
		functions.logYALV("Application started as admin? " + isAdmin);
		mainWindow.webContents.send("admin-status", isAdmin);
	});
});

ipcMain.handle("get-commands", async () => {
	functions.logYALV('Commands requested by renderer.');
	return commandsFile || { commands: [] };
});

ipcMain.handle("request-folder-dialog", async (event, chooseDirInput) => {
	const folder = await dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory'],
	});
	return folder.canceled ? null : folder.filePaths[0];
});

app.on("window-all-closed", () => {
    functions.logYALV("Main window closed.");
    app.quit();
});

ipcMain.on("get-settings-states", () => {
	functions.logYALV('Send settings states to renderer process.');
	mainWindow.webContents.send("dark-mode-state", settings.isDarkMode);
});

ipcMain.on("toggle-dark-mode", () => {
	settings.isDarkMode = !settings.isDarkMode;
	functions.saveSettings(settings);
	functions.logYALV("Toggled light/dark mode.");
	mainWindow.webContents.send("dark-mode-state", settings.isDarkMode);
});

ipcMain.on("close-app", () => {
	functions.logYALV("Closing the app.");
	app.quit();
});

ipcMain.on("minimize-window", () => {
	functions.logYALV("Minimizing the app.");
	mainWindow.minimize();
});

ipcMain.handle("toggle-favorite", (event, buttonId) => {
	let favorites = [];
	try {
		favorites = JSON.parse(fs.readFileSync(favoritesFilePath, "utf-8"));
	} catch (error) {
		functions.logYALV("error", "Could not parse favorites file.");
	}
	if (favorites.includes(buttonId)) {
		favorites = favorites.filter((id) => id !== buttonId);
		functions.logYALV("Button " + buttonId + " removed from the favorite buttons.");
	} else {
		favorites.push(buttonId);
		functions.logYALV("Button " + buttonId + " added to the favorite buttons.");
	}
    try {
        fs.writeFileSync(favoritesFilePath, JSON.stringify(favorites));
        functions.logYALV("File favorites.json updated.");
    } catch (error) {
        functions.logYALV("error", "Could not save favorites file.");
    }
	return favorites;
});

ipcMain.handle("get-favorites", () => {
	functions.logYALV('Favorites file requested by renderer.')
	try {
		const favorites = JSON.parse(fs.readFileSync(favoritesFilePath, "utf-8"));
		functions.logYALV('Returning favorites file to renderer.')
		return favorites;
	} catch (error) {
		functions.logYALV("error", "Could not parse favorites file, returning an empty array.");
		return [];
	}
});

ipcMain.on("update-favorites-order", (event, newOrder) => {
	try {
        if (!Array.isArray(newOrder)) {
			throw new Error("Invalid favorites order format. Expected an array.");
		}
		fs.writeFileSync(favoritesFilePath, JSON.stringify(newOrder));
		functions.logYALV("info", "Favorites order updated: " + JSON.stringify(newOrder));
	} catch (error) {
		functions.logYALV("error", "Failed to update favorites order: " + error.message);
        event.sender.send("write-output", "<span class='error-output'>Favorites order could not be saved.</span>")
	}
});

ipcMain.on("log-message", (event, { level, message }) => {
	if (log[level]) {
		functions.logYALV(level, message);
	} else {
		functions.logYALV(message);
	}
});

ipcMain.on("run-command", async (event, commandId) => {
	handleRunCommand(commandId);
});

async function handleRunCommand(commandId) {
	functions.logYALV("Triggered run-command in main process - " + commandId);
	const command = commandsFile.commands.find((cmd) => cmd.id === commandId);
    if (!command || !command.scripts || command.scripts.length === 0) {
        mainWindow.webContents.send("write-output", "<span class='error-output'>Command not found!</span>");
		mainWindow.webContents.send("command-finished");
		functions.logYALV("warn", "Could not find a command in commands file. Command ID: " + commandId);
        return;
    }
	if (command.options.name) {
		mainWindow.webContents.send("write-output", "Command <u>" + command.options.name + "</u> started.");
	}
    functions.executeCommand(command, mainWindow);
}