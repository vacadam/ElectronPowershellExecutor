const fs = require("fs");
const { dialog, app, ipcMain } = require('electron');
const path = require("path");
const log = require("electron-log");
const { spawn, execSync } = require("child_process");
const { encode } = require("he");
const crypto = require('crypto');
const packageJson = require('../package.json');

module.exports = {
    loadCommands,
    loadSettings,
    saveSettings,
    logYALV,
    requestUserInput,
    spawnPowershell,
    executeCommand
};


function loadCommands() {
    try {
        const commandsFilePath = (path.join(__dirname, "commands.json"));
        const commands = JSON.parse(fs.readFileSync(commandsFilePath, "utf8"));
        logYALV('File commands.json was loaded successfully.');
        return commands;
    } catch {
        logYALV('error', 'Command file could not be loaded.');
        dialog.showErrorBox('Error while loading commands', 'The commands file could not be loaded. The application will now quit.');
        app.exit(1);
    }
};

function logYALV(levelOrMessage, message = null) {
    if (message === null) {
        message = levelOrMessage;
        levelOrMessage = "info";
    }
    const escapedMessage = encode(message);
    const timestamp = Date.now();
    const formattedMessage = `<log4j:event logger="Application.EPE" timestamp="${timestamp}" level="${levelOrMessage}" thread="1"><log4j:message>${escapedMessage}</log4j:message></log4j:event>`;
    log[levelOrMessage](formattedMessage);
}

let powershellVersion =  isPwshAvailable() ? "pwsh.exe" : "powershell.exe";

function isPwshAvailable() {
    try {
        execSync("where pwsh.exe", { stdio: "ignore" });
        return true;
    } catch (error) {
        return false;
    }
}

function saveSettings(settings) {
    const settingsFilePath = path.join(app.getPath("userData"), "settings.json");
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    logYALV("Settings file updated.");
};

function loadSettings() {
    const settingsFilePath = path.join(app.getPath("userData"), "settings.json");
    try {
        const settings = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"));
        logYALV("File settings.json loaded successfully.");
        return settings;
    } catch {
        logYALV("warn", "Unable to load settings.json file. Return defaults.");
        return {
            isDarkMode: true,
        };
    }
};

function requestUserInput(inputs, commandName, mainWindow) {
    return new Promise((resolve) => {
        ipcMain.once("user-input-collected", (event, formData) => {
            logYALV('User input provided.');
            resolve(formData);
        });
        logYALV('Requesting user input.');
        mainWindow.webContents.send("request-user-input", inputs, commandName);
    });
};

async function spawnPowershell(script, mainWindow, commandName) {
    logYALV('spawnPowershell ('+powershellVersion+') trigerred for command: ' + script.path);
    const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, "scripts", script.path)
    : path.join(__dirname, "scripts", script.path);

    if (!fs.existsSync(scriptPath)) {
        mainWindow.webContents.send("write-output", "<span class='error-output'>Provided script path refers to a non-existing script file.<br>"+scriptPath)+"</span>";
        logYALV('Command execution failed, no such script file exists: ' + scriptPath);
        return { stop: true };
    }

    if (script.inputs && script.inputs.length > 0) {
        const userInputs = await requestUserInput(script.inputs, commandName, mainWindow);
        if (userInputs.stopExecution) {
            return { 
                stop: true,
                message: 'command was stopped during input request.'
            }
        }
        const { inputs, ...filteredCommand } = script;
        script = filteredCommand;
        Object.assign(script, userInputs);
    }

    if (app.isPackaged) {
        const scriptFileNotAltered = await checkScriptAlter(scriptPath, script.path);
        if (scriptFileNotAltered !== true) {
            return { 
                stop: true,
                message: 'script file ' + script.path + ' has been altered. You little digital rascal!'
            }
        }
    }

    script.chain = { ...chainData };
    const commandDataJson = JSON.stringify(script).replace(/"/g, '\\"');
    const powershell = spawn(powershellVersion, [
            "-ExecutionPolicy", "Bypass",
            "-File", `"${scriptPath}"`,
            "-jsondata", `"${commandDataJson}"`,
        ], { shell: true }
    );

    powershell.stdout.on("data", (data) => {
        handlePowershellOutput(data, mainWindow, false);      
    });

    ipcMain.on("submit-read-host", (event, message) => {
        logYALV('Read-Host input provided: ' + message);
        powershell.stdin.write(message + "\r\n");
    });

    powershell.stderr.on("data", (data) => {
        handlePowershellOutput(data, mainWindow, true); 
    });
    await new Promise((resolve, reject) => {
        powershell.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                mainWindow.webContents.send("write-output", `<span class="error-output">Script failed with exit code ${code}</span>`);
                logYALV("error", `Script failed with exit code ${code}`);
                resolve();
            }
        });
    });
    return { 
        stop: false
    }
}

let chainData = {};
async function executeCommand(command, mainWindow) {
    let scriptsIndex = 0;
    let requirementNotMet = false;
    while (scriptsIndex < command.scripts.length) {
        const script = command.scripts[scriptsIndex];

        if(script.requirement) { 
            requirementNotMet = checkRequirement(script.requirement);
        }

        let result = {};
        if (typeof script === 'object') {
            if (!requirementNotMet) {
                result = await spawnPowershell(script, mainWindow, command.options.name);
            } else {
                mainWindow.webContents.send("write-output", '<span class="error-output">Script skipped - '+ requirementNotMet +'</span>');
            }
        } else {
            logYALV('warn', 'Script skipped - defined script is not an object.');
            mainWindow.webContents.send("write-output", '<span class="error-output">Script skipped - defined script is not an object.</span>');
        }
        if (result.stop === true) {
            if (result.message) {
                logYALV('warn', 'Execution stopped - ' + result.message);
                mainWindow.webContents.send("write-output", '<span class="error-output">Execution stopped - ' + result.message + "</span>");
            }
            scriptsIndex = command.scripts.length;
        }
        scriptsIndex++;
    }
    chainData = {};
    mainWindow.webContents.send("command-finished");

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
}

function checkRequirement(requirement) {
    switch(requirement) {
        case "pwsh":
            return powershellVersion == 'powershell.exe' ? 'this script requires PowerShell version 7 or higher.' : false;
            break;
    }
}

async function checkScriptAlter(scriptPath, script) {
    try {
        const currentScriptHash = await generateHashFromScript(scriptPath);
        const savedHash = await getHashFromJson(script);
        if (currentScriptHash === savedHash) {
            return true
        } else {
            return false
        }
    } catch (error) {
        logYALV('error', 'Error during tamper check:', error);
        return false;
    }
}

async function generateHashFromScript(scriptPath) {
    try {
        const fileContent = await fs.promises.readFile(scriptPath, "utf8");
        const hash = crypto.createHash('sha256');
        hash.update(fileContent + packageJson.version);
        const generatedHashHexString = hash.digest('hex');
        return generatedHashHexString;
    } catch (error) {
        logYALV('error', 'Error while generating hash from script file: ' + error);
        return error;
    }
}

async function getHashFromJson(script) {
    try {
        const hashesFilePath = path.join(__dirname, "scriptHash.json");
        const hashes = JSON.parse(await fs.promises.readFile(hashesFilePath, "utf8"));
        const savedHashHexString = hashes[script];        
        return savedHashHexString ?? 'undefined';
    } catch (error) {
        logYALV('error', 'Error while getting hash from scriptHash.json file:' + error);
        return error;
    }
}

function handlePowershellOutput(data, mainWindow, error) {
    let output = data.toString().trim().replace(/\x1B\[[0-9;]*[mK]/g, "");
    const prefix = {
        error: "[ERROR]",
        xml: "[XML]",
        input: "[INPUT]",
    };

    if (error || output.startsWith(prefix.error)) {
        if (output.startsWith(prefix.error)) {
            output = output.slice(prefix.error.length).trim();
            logYALV('warn', output);
        } else {
            logYALV("error", output);
            output = `Error: ${output}`;
        }
        mainWindow.webContents.send("write-output", `<span class="error-output">${output}</span>`);
        return;
    }

    const tryParseJson = (str) => {
        try {
            return { success: true, data: JSON.parse(str) };
        } catch (e) {
            return { success: false };
        }
    };

    if (output.startsWith(prefix.xml)) {
        output = output.slice(prefix.xml.length).trim();
        mainWindow.webContents.send("write-output", output, true);
        logYALV(output);
        return;
    } else if(output.startsWith(prefix.input)) {
        output = output.slice(prefix.input.length).trim();
        mainWindow.webContents.send("write-output", output);
        mainWindow.webContents.send("request-read-host");
        logYALV('Read-Host Input request received.');
        return;
    }

    const parsedJson = tryParseJson(output);
    if (parsedJson.success) {
        Object.assign(chainData, parsedJson.data);
    } else {
        mainWindow.webContents.send("write-output", output);
    }
}