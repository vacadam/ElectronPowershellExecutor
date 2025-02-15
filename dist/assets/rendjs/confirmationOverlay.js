module.exports = { set }

function set(button) {
	// dont even ask ...
	button.children[0].classList.remove(
		"group-hover:translate-x-1",
		"duration-150"
	);

	const confirmationDiv = document.getElementById("confirmationWindowOverlay");
	confirmationDiv.classList.remove("hidden");

	let confirmationMessage = document.getElementById("confirmationWindowMessage");
	let confirmationButton = document.getElementById("confirmConfirmationWindowButton");
	const cancelConfirmationButton = document.getElementById("cancelConfirmationWindowButton");

	confirmationButton.dataset.command = button.dataset.confirmation;
	if (button.dataset.message) {
		confirmationMessage.innerHTML = button.dataset.message;
	} else {
		confirmationMessage.innerHTML =
			"You are about to execute a command that requires confirmation.";
	}
	confirmationButton.innerHTML = button.innerHTML;
	confirmationButton.children[0].classList.add(
		"mx-auto",
		"group-hover:transform-none"
	);

    function handleConfirmation(action) {
        confirmationDiv.classList.add('hidden');
        confirmationButton.removeEventListener('click', handleConfirmation);
        cancelConfirmationButton.removeEventListener('click', handleConfirmation);
        confirmationMessage.innerHTML = '';
        confirmationButton.innerHTML = '';
        confirmationButton.dataset.command = '';
    }

	confirmationButton.addEventListener("click", () => handleConfirmation());
	cancelConfirmationButton.addEventListener("click", () => handleConfirmation('cancel'));

	setTimeout(() => {
		// THIS SHIT IS REALLY NEEDED, FUCKING JAVASCRIPT
		button.children[0].classList.add(
			"group-hover:translate-x-1",
			"duration-150"
		);
	}, 200);
}