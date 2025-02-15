const fs = require("fs");
const path = require("path");
const crypto = require('crypto');
const packageJson = require('../package.json');


generateAndSaveHashes();
generatePackageVersionJsonFile();

async function generatePackageVersionJsonFile() {
    try {
        const FilePath = path.join(__dirname, "scripts", "versionInfo.json");
        const data = {}
        data["version"] = packageJson.version;
        await fs.promises.writeFile(FilePath, JSON.stringify(data, null, 2), "utf8");
        console.log("VersionInfo file generated.");
    } catch (error) {
        console.error('Error in generating and saving versionInfo.json file:', error);
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
        console.error(`Error generating hash for ${scriptPath}:`, error);
        throw error;
    }
}

async function writeHashToJson(hashes) {
    try {
        const hashesFilePath = path.join(__dirname, "scriptHash.json");
        await fs.promises.writeFile(hashesFilePath, JSON.stringify(hashes, null, 2), "utf8");

        console.log("Hashes saved to scriptHash.json");
    } catch (error) {
        console.error("Error saving hashes to JSON:", error);
        throw error;
    }
}

async function getPs1FilesRecursive(directory) {
    const files = await fs.promises.readdir(directory);
    let ps1Files = [];
    
    for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.isDirectory()) {
            const subfolderFiles = await getPs1FilesRecursive(filePath);
            ps1Files = ps1Files.concat(subfolderFiles);
        } else if (file.endsWith('.ps1')) {
            ps1Files.push(filePath);
        }
    }
    
    return ps1Files;
}

async function generateAndSaveHashes() {
    try {
        const scriptsFolder = path.join(__dirname, 'scripts');
        const ps1Files = await getPs1FilesRecursive(scriptsFolder);

        const hashes = {};
        
        for (const filePath of ps1Files) {
            const relativeFilePath = path.relative(scriptsFolder, filePath);
            const key = relativeFilePath.replace(path.sep, '/');
            const hash = await generateHashFromScript(filePath);
            hashes[key] = hash;
        }

        await writeHashToJson(hashes);
    } catch (error) {
        console.error('Error in generating and saving hashes:', error);
    }
}
