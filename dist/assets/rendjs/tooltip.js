module.exports = {
    addListeners,
}

function addListeners(element) {
    //let debounceTimeout;
	element.addEventListener("mouseenter", (event) => {
		//clearTimeout(debounceTimeout);
		const tooltipArea = document.getElementById("tooltip-area");
		//debounceTimeout = setTimeout(() => {
			tooltipArea.textContent = event.target.dataset.tooltip;
			document.getElementById("tooltip-icon").classList.remove("hidden");
		//}, 100);
	});

	element.addEventListener("mouseleave", () => {
		const tooltipArea = document.getElementById("tooltip-area");
		tooltipArea.textContent = "";
		document.getElementById("tooltip-icon").classList.add("hidden");
	});
}
