const path = require("path");
const compileInnoSetup = require("innosetup-compiler");

const scriptPath = path.resolve(__dirname, "installSetup.iss");

console.log('Starting to compile the installer ...')

compileInnoSetup(scriptPath, {
    gui: false,
    verbose: false
}, function(error) {
    if (error) {
        console.error("Error during compile of installer file:", error);
    } else {
        console.log("Installer compiled successfully.");
    }
});