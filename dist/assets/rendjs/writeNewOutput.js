const { ipcRenderer } = require("electron");
const { escape } = require("he");

module.exports = { print }

function escapeXml(xml) {
    var div = document.createElement('div');
    if (xml) {
        div.innerText = xml;
        div.textContent = xml;
    }
    return div.innerHTML;
}

function print(newOutput, xml) {
	if (newOutput === null || newOutput.trim() === "") {
		return;
	}
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

	const newOutputDiv = document.createElement("div");
	let output;
	if (xml) {
		output = escapeXml(newOutput);
	} else {
		output = newOutput;
	}
	newOutputDiv.innerHTML = '<span class="text-gray-500  text-xs">' + hours + ":" + minutes + ":" + seconds + ": </span>" + output;

	const outputContainer = document.getElementById("output");
    if (outputContainer.children.length >= 100) {
        outputContainer.removeChild(outputContainer.lastChild);
    }

	outputContainer.insertBefore(newOutputDiv, outputContainer.firstChild);

	ipcRenderer.send("log-message", { level: "info", message: "[PRINT]: " + output });

	outputContainer.scrollTop = 0;
	outputContainer.scrollLeft = 0; //should not be neccessary
}