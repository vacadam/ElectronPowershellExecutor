const Sortable = require("sortablejs");
const writeNewOutput = require('./writeNewOutput.js');
const tooltip = require("./tooltip.js");
const confirmationOverlay = require('./confirmationOverlay.js');
const { ipcRenderer } = require("electron");

module.exports = {
    loadMyFavorites,
    updateToggledButton,
    sortFavorites,
}

function loadMyFavorites(favorites) {
    const favoritesContainer = document.getElementById("favorites");
    favorites.forEach((favoriteId) => {
        const button = document.getElementById(favoriteId);

        if (button) {
            const favoriteButtonDiv = button.querySelector(".favorite-button");
            if (favoriteButtonDiv) {
                favoriteButtonDiv.classList.add("text-orange-300");
            }
            cloneButton(button, favoritesContainer);
        }
    });
    insertStarSvg();
    sortFavorites();
}

function cloneButton(button, favoritesContainer) {
	const clonedButton = button.children[0].cloneNode(true);
	clonedButton.classList.add("rounded-sm");

	const clonedButtonParent = document.createElement("div");
	const clonedButtonSortHandle = document.createElement("div");
	clonedButtonParent.classList.add("flex", "flex-row", "w-full", "space-x-0.5", "fav-child");
	clonedButtonSortHandle.innerHTML =
		'<div class="flex sort-handle items-center text-gray-300 h-7 w-1.5 bg-gray-500 hover:bg-epe-active cursor-grab rounded-sm hover:w-8 group duration-150"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="invisible m-auto upAndDown duration-150 drop-shadow-svg size-5 group-hover:visible"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg></div>';
	clonedButtonParent.appendChild(clonedButtonSortHandle);
	clonedButtonParent.appendChild(clonedButton);

	favoritesContainer.appendChild(clonedButtonParent);

	if (clonedButton.classList.contains("command-button")) {
		addListenersToClonedButton(clonedButton);
	} else if (clonedButton.classList.contains("step-button")) {
		addListenersToClonedStepButton(clonedButton);
	}

	if (clonedButton.classList.contains("has-tooltip")) {
        tooltip.addListeners(clonedButton);
	}
}

function addListenersToClonedButton(button) {
	button.addEventListener("click", () => {
		const commandId = button.dataset.command;
		if (commandId) {
            ipcRenderer.send("run-command", commandId);
			document.getElementById("command-in-progress").classList.remove("hidden");
		} else {
			console.error("No command found!");
		}
	});
}

function addListenersToClonedStepButton(button) {
	button.addEventListener("click", () => {
		confirmationOverlay.set(button);
	});
}

function updateToggledButton(favorites, buttonId) {
    const originalButton = document.getElementById(buttonId);
    const originalFavoriteButton = originalButton.querySelector(".favorite-button");
    if (originalFavoriteButton) {
		const buttonName = originalButton.children[0].children[0].innerHTML;
        updateFavoriteButtonStyle(originalFavoriteButton, favorites.includes(buttonId), buttonName);
    }
    updateFavoritesContainer(favorites);
}

function updateFavoriteButtonStyle(favoriteButtonDiv, isFavorite, buttonName) {
	if (isFavorite) {
		favoriteButtonDiv.classList.add("text-orange-300");
		writeNewOutput.print("Button <u>" + buttonName + "</u> added to the favorites.");
	} else {
		favoriteButtonDiv.classList.remove("text-orange-300");
		writeNewOutput.print("Button <u>" + buttonName + "</u> removed from the favorites.");
	}
}

function updateFavoritesContainer(favorites) {
	const favoritesContainer = document.getElementById("favorites");
	favoritesContainer.innerHTML = "";
	favorites.forEach((favoriteId) => {
		const button = document.getElementById(favoriteId);
		if (button) {
			cloneButton(button, favoritesContainer);
		}
	});
}

function sortFavorites() {
    const favoritesContainer = document.getElementById("favorites");
	const sortable = new Sortable(favoritesContainer, {
		animation: 200,
		handle: ".sort-handle",
		swapThreshold: 0.35,
		ghostClass: "sortghost",
		chosenClass: "sortghost",
		onStart: (event) => {
			document.querySelectorAll("div.command-button, div.step-button").forEach((button) => {
				button.classList.add("sorting");
				if (button.children.length > 0) {
					button.children[0].classList.add("sortingSibling");
				}
			});
            document.querySelectorAll("div.sort-handle").forEach((button) => {
                button.classList.add("hidden");
                button.classList.remove("flex");
                button.parentElement.parentElement.classList.remove('space-x-0.5');
            });
            
		},
		onEnd: (event) => {
			document.querySelectorAll("div.command-button, div.step-button").forEach((button) => {
				button.classList.remove("sorting");
				if (button.children.length > 0) {
					button.children[0].classList.remove("sortingSibling");
				}
			});
            document.querySelectorAll("div.sort-handle").forEach((button) => {
                button.classList.remove("hidden");
                button.classList.add("flex");
                button.parentElement.parentElement.classList.add('space-x-0.5');
            });
			const newOrder = Array.from(favoritesContainer.children)
				.map((child) => {
					const button = child.querySelector(
						".command-button, .step-button"
					);
					if (!button) { return null; }
                    if (button.classList.contains("command-button")) {
                        return button.dataset.command;
                    } else if (button.classList.contains("step-button")) {
                        return button.dataset.confirmation;
                    }
                    return null;
				})
				.filter(Boolean);
            ipcRenderer.send("update-favorites-order", newOrder)
		},
	});
}

function insertStarSvg() {
	document.querySelectorAll("div.favorite-button").forEach((button) => {
		button.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="mx-auto duration-150 group-hover:text-orange-300 size-3 group-hover:size-5"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>';
	});
}