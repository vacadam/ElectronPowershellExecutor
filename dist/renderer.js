// WHEN DOM IS LOADED
document.addEventListener("DOMContentLoaded", () => {

	// Show app version to user
	const appVersionDiv = document.getElementById('appVersion');
	appVersionDiv.innerHTML = window.appVersion.appVersion();

    // Load and render buttons for each command and dispatch event when done
    const AllButtonsLoaded = new CustomEvent("AllButtonsLoaded");
    window.electronAPI.getCommands().then((commandsFile) => {
        window.rendAPI.createButtonsForCommands(commandsFile);
	}).then(() => {
        document.dispatchEvent(AllButtonsLoaded);
    });

    // Write welcome message
    window.rendAPI.writeNewOutput('Welcome! ♥');

    // Check if app is elevated //TODO ipc handle
    window.electronAPI.checkAdminRights();
    window.electronAPI.onAdminStatus((event, isAdmin) => {
		const blockElement = document.getElementById("admin-rights-missing");
		if (isAdmin === true) {
			blockElement.classList.add("hidden");
		}
	});

    // Show app info window
    const appInfo = document.getElementById("appInfo");
	appInfo.addEventListener("click", () => {
		const appInfoWindow = document.getElementById("appInfoWindow");
		if (appInfoWindow.classList.contains("hidden")) {
			appInfoWindow.classList.remove("hidden");
		} else {
			appInfoWindow.classList.add("hidden");
		}
	});
	const closeAppInfoWindow = document.getElementById("closeAppInfoWindow");
	closeAppInfoWindow.addEventListener("click", () => {
		appInfoWindow.classList.add("hidden");
	});

    // Get settings
	window.electronAPI.getSettingsStates();

    // Toggle dark/light mode
	const darkModeButton = document.getElementById("appTheme");
	darkModeButton.addEventListener("click", () => {
		window.electronAPI.toggleDarkMode();
	});
	window.electronAPI.onDarkModeStateChange((event, state) => {
		const htmlTag = document.documentElement;
		const lightThemeSvg = document.getElementById("lightTheme");
		const darkThemeSvg = document.getElementById("darkTheme");
		if (state) {
			lightThemeSvg.classList.add("hidden");
			darkThemeSvg.classList.remove("hidden");
			htmlTag.classList.add("dark");
		} else {
			lightThemeSvg.classList.remove("hidden");
			darkThemeSvg.classList.add("hidden");
			htmlTag.classList.remove("dark");
		}
	});

    // Close the application
	const closeAppButtons = document.querySelectorAll("div.closeApp");
	closeAppButtons.forEach((closeButton) => {
		closeButton.addEventListener("click", () => {
			window.electronAPI.closeApp();
		});
	});

    // Minimize the application
	const minimizeButtons = document.querySelectorAll("div.minimizeWindow");
	minimizeButtons.forEach((minButton) => {
		minButton.addEventListener("click", () => {
			window.electronAPI.minimizeWindow();
		});
	});

});


// WHEN ALL BUTTONS ARE LOADED
document.addEventListener("AllButtonsLoaded", () => {

    // Show confirmation overlay
    const stepButtons = document.querySelectorAll("div.step-button");
	stepButtons.forEach((button) => {
		button.addEventListener("click", () => {
			window.rendAPI.setConfirmationOverlay(button);
		});
	});

    // Add tooltips for elements
    document.querySelectorAll(".has-tooltip").forEach((element) => {
        window.rendAPI.addTooltipListener(element);
	});

    // Load and toggle favorites
    window.electronAPI.getFavorites().then((favorites) => {
        window.rendAPI.loadMyFavorites(favorites, window.electronAPI);
	});
	const favoriteButtons = document.querySelectorAll(".favorite-button");
	favoriteButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const buttonEl = button.parentElement;
			window.electronAPI.toggleFavorite(buttonEl.id).then((favorites) => {
                window.rendAPI.updateToggledButton(favorites, buttonEl.id);
			});
		});
	});

    // Start executing command
    const buttons = document.querySelectorAll("div.command-button");
	buttons.forEach((button) => {
		button.addEventListener("click", () => {
			const commandId = button.dataset.command;
			if (commandId) {
                commandInProgress(true);
				window.electronAPI.runCommand(commandId);
			} else {
				console.error("No command found!");
			}
		});
	});

    // Handle Read-Host
    document.getElementById('submitReadHost').parentElement.addEventListener('click', () => sendReadHostMessage());
    window.electronAPI.onRequestReadHost(() => {
        document.getElementById('readHostWindow').classList.remove('hidden');
        document.getElementById('readHost').focus();
    });
    document.getElementById('readHost').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            document.getElementById('submitReadHost').parentElement.click();
        }
    });
    function sendReadHostMessage() {
        const message = document.getElementById('readHost');
        window.electronAPI.submitReadHost(message.value);

        message.value = '';
        document.getElementById('readHostWindow').classList.add('hidden');
    }

    // Update UI when command finishes/starts
    window.electronAPI.onCommandFinished(() => {
        commandInProgress(false);
    });
	window.electronAPI.onCommandStarted(() => {
        commandInProgress(true);
    });
    function commandInProgress(inProgress) {
        const loader = document.getElementById("command-in-progress");
        if (inProgress) {
            loader.classList.remove("hidden");
        } else {
            loader.classList.add("hidden");
        }
    }

});