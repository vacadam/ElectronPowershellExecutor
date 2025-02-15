module.exports = { create }

async function create(commandsFile) {
    await createMenuItem(commandsFile.menu);
    commandsFile.commands.forEach((command) => {
        if (command.hidden) return;
        const newButton = createButton(command);
        const menuPosition = document.getElementById(command.options["menu-id"]);
        menuPosition.appendChild(newButton);
    });
}

async function createMenuItem(menuItems) {
    const buttonsArea = document.getElementById('buttons');
    menuItems.forEach((menu) => {
        const newMenuItem = `<div class="flex flex-col self-start w-full"><div id="${menu['menu-id']}-click" class="menu-category"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3 duration-300 text-epe"><path fill-rule="evenodd" d="M12.78 7.595a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06l2.72-2.72-2.72-2.72a.75.75 0 0 1 1.06-1.06l3.25 3.25Zm-8.25-3.25 3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06l2.72-2.72-2.72-2.72a.75.75 0 0 1 1.06-1.06Z" clip-rule="evenodd" /></svg><span>${menu.name}</span></div><div id="${menu['menu-id']}" class="menu-items"></div></div>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newMenuItem;
        if (menu.parent) {
            const parent = document.getElementById(menu.parent);
            parent.appendChild(tempDiv.firstElementChild);
        } else {
            buttonsArea.appendChild(tempDiv.firstElementChild);
        }
        
        const menuItem = document.getElementById(menu['menu-id']+'-click');
        menuItem.addEventListener('click', () => {
            menuItem.children[0].classList.toggle('rotate-90');
            const showMenuItems = document.getElementById(menu['menu-id']);
            let parent = showMenuItems.parentElement.closest('.menu-items');

            if (showMenuItems.style.maxHeight && showMenuItems.style.maxHeight !== '0px') {
                showMenuItems.style.maxHeight = showMenuItems.scrollHeight + 'px';
                showMenuItems.style.maxHeight = '0px';
            } else {
                showMenuItems.style.maxHeight = showMenuItems.scrollHeight + 'px';
                while (parent) {
                    parent.style.maxHeight = parent.scrollHeight + showMenuItems.scrollHeight + 'px';
                    parent = parent.parentElement.closest('.menu-items');
                }
            }
        })
        

    });
}

function createButton(command) {
    let buttonDataAttr = "";
    let buttonClass = command.options.type ?? 'command-button';
    let buttonTooltip = '';

    if (command.options.type === "step-button") {
        const confirmationMessage = command.options.confirmation ?? '';
        buttonDataAttr = `data-confirmation="${command.id}" data-message="${confirmationMessage}"`;
    } else {
        buttonDataAttr = `data-command="${command.id}"`;
    }

    if (command.options.description) {
        buttonClass += " has-tooltip";
        buttonTooltip = `data-tooltip="${command.options.description}"`;
    }

    const newElement = document.createElement("div");
    Object.assign(newElement, {
        id: command.id,
        className: "flex flex-row w-full"
    });
    newElement.innerHTML = `<div ${buttonDataAttr} ${buttonTooltip} class="${buttonClass} group"><span class="button-span">${command.options.name}</span></div><div data-tooltip="Favorite the button to make it appear on top of the menu." class="favorite-button has-tooltip group"></div>`;

    return newElement
}