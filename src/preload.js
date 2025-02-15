const { contextBridge, ipcRenderer } = require("electron");
const createButtonsForCommands = require('../dist/assets/rendjs/createButtonsForCommands.js');
const writeNewOutput = require('../dist/assets/rendjs/writeNewOutput.js');
const favoriteButtons = require('../dist/assets/rendjs/favoriteButtons.js');
const tooltip = require('../dist/assets/rendjs/tooltip.js');
const confirmationOverlay = require('../dist/assets/rendjs/confirmationOverlay.js');
const userInput = require("../dist/assets/rendjs/userInput.js");
const packageJson = require('../package.json');

ipcRenderer.on("request-user-input", (event, inputs, commandName) => { userInput.onInputRequest(inputs, commandName) });
ipcRenderer.on("write-output", (event, output, xml) => { writeNewOutput.print(output, xml) });

contextBridge.exposeInMainWorld("electronAPI", {
    closeApp: () => ipcRenderer.send("close-app"), 
	minimizeWindow: () => ipcRenderer.send("minimize-window"),
    log: (level, message) => ipcRenderer.send("log-message", { level, message }),
    getSettingsStates: () => ipcRenderer.send("get-settings-states"),
    toggleDarkMode: () => ipcRenderer.send("toggle-dark-mode"),
	checkAdminRights: () => ipcRenderer.send("check-admin-rights"),
    runCommand: (command) => ipcRenderer.send("run-command", command),
    submitReadHost: (message) => ipcRenderer.send("submit-read-host", message),

    toggleFavorite: (buttonId) => ipcRenderer.invoke("toggle-favorite", buttonId),
    getFavorites: () => ipcRenderer.invoke("get-favorites"),
    getCommands: () => ipcRenderer.invoke("get-commands"),

    onCommandFinished: (callback) => ipcRenderer.on("command-finished", callback),
    onCommandStarted: (callback) => ipcRenderer.on("command-started", callback),
    onAdminStatus: (callback) => ipcRenderer.on("admin-status", callback),
    onDarkModeStateChange: (callback) => ipcRenderer.on("dark-mode-state", callback),
    onRequestReadHost: (callback) => ipcRenderer.on("request-read-host", callback),
});

contextBridge.exposeInMainWorld("rendAPI", {
    createButtonsForCommands: (commandsFile) => createButtonsForCommands.create(commandsFile),
    writeNewOutput: (newOutput) => writeNewOutput.print(newOutput),
    loadMyFavorites: (favorites) => favoriteButtons.loadMyFavorites(favorites),
    updateToggledButton: (favorites, buttonId) => favoriteButtons.updateToggledButton(favorites, buttonId),
    addTooltipListener: (element) => tooltip.addListeners(element),
    setConfirmationOverlay: (button) => confirmationOverlay.set(button),
});

contextBridge.exposeInMainWorld('appVersion', {
    appVersion: () => packageJson.version
})