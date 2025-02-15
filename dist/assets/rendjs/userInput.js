const { ipcRenderer } = require("electron");

module.exports = { onInputRequest }

// this is so bad ... #shame

function onInputRequest(inputs, commandName) {
    const inputFieldsDiv = document.getElementById('inputFields');
    setUserInputFields(inputs, inputFieldsDiv);
    document.getElementById('inputTitle').innerHTML = commandName;
    const inputWindow = document.getElementById('inputWindow');
    inputWindow.classList.remove('hidden');

    document.getElementById('submitUserInput').addEventListener('click', () => handleUserInputSubmit(inputWindow, inputFieldsDiv));
    document.getElementById('cancelUserInput').addEventListener('click', () => handleCancel(inputWindow, inputFieldsDiv));
}

function handleUserInputSubmit(inputWindow, inputFieldsDiv) {
    const formData = {};
    let allFieldsValid = true;

    inputFieldsDiv.querySelectorAll(".input-field").forEach(input => {
        const isValid = validateInput(input);
        if (!isValid) {
            allFieldsValid = false;
        } else if (isValid !== true) {
            formData['input' + input.id] = isValid;
        }
    });
    inputFieldsDiv.querySelectorAll(".input-checkbox").forEach(input => {
        formData['input' + input.id] = input.checked;
    });
    inputFieldsDiv.querySelectorAll(".input-chooseDir").forEach(input => {
        const inputChild = input.children[1];
        const isValid = validateDir(inputChild);
        if (!isValid) {
            allFieldsValid = false;
        } else {
            formData['input' + inputChild.id] = inputChild.innerHTML;
        }
    });

    if (!allFieldsValid) return;
    sendDataAndReset(formData, inputWindow, inputFieldsDiv);
}

function handleCancel(inputWindow, inputFieldsDiv) {
    const formData = { stopExecution: true };
    sendDataAndReset(formData, inputWindow, inputFieldsDiv);
}

function sendDataAndReset(formData, inputWindow, inputFieldsDiv) {
    ipcRenderer.send("user-input-collected", formData);
    inputWindow.classList.add('hidden');
    inputFieldsDiv.innerHTML = '';
    document.getElementById('inputTitle').innerHTML = '';
    document.getElementById('submitUserInput').removeEventListener('click', handleUserInputSubmit);
    document.getElementById('cancelUserInput').removeEventListener('click', handleCancel);
    document.querySelectorAll('.input-chooseDir').forEach(chooseDirInput => {
        chooseDirInput.removeEventListener('click', requestFolderDialog);
    });
}

function validateDir(input) {
    const value = input.innerHTML;
    const inputValidationDiv = document.getElementById(input.id + 'InputValidation');
    if (['C:', 'D:', 'E:'].some(prefix => value.startsWith(prefix))) {
        inputValidationDiv.innerHTML = '';
        const parent = inputValidationDiv.parentElement;
        parent.querySelector('.input-chooseDir').classList.remove('border-red-700', 'dark:border-red-500');
        return true
    } else {
        inputValidationDiv.innerHTML = 'Folder must be inside C:, D: or E: drive.';
        const parent = inputValidationDiv.parentElement;
        parent.querySelector('.input-chooseDir').classList.add('border-red-700', 'dark:border-red-500');
        return false
    }
}

function validateInput(input) {
    const isRequired = input.hasAttribute('required');
    const value = input.value.trim();
    const validationPatterns = {
        alpha: /^[a-zA-Z]*$/,
        alphaWithSpaces: /^[a-zA-Z\s]*$/,
        numeric: /^[0-9]*$/,
        alphanumeric: /^[a-zA-Z0-9]*$/,
        alphanumericWithSpaces: /^[a-zA-Z0-9\s]*$/,
        none: /.*/,
    };
    const validationRule = input.getAttribute('data-validation')
    const inputValidationDiv = document.getElementById(input.id + 'InputValidation');

    if (isRequired && !value) {
        input.classList.add('border-red-700', 'dark:border-red-500');
        inputValidationDiv.innerHTML = 'Field is required.';
        return false; // Required field is empty
    }
    if (!validationPatterns[validationRule].test(value)) {
        input.classList.add('border-red-700', 'dark:border-red-500');
        inputValidationDiv.innerHTML = 'Incorrect input, allowed characters: ' + validationRule;
        return false;
    } else {
        input.classList.remove('border-red-700', 'dark:border-red-500');
        inputValidationDiv.innerHTML = '';
        return value || !isRequired;
    }
}

function setUserInputFields(inputs, inputFieldsDiv) {
    inputs.forEach(input => {
        const inputGroup = document.createElement('div');
        inputGroup.setAttribute('class', 'input-group');

        const inputLabel = document.createElement('label');
        inputLabel.textContent = input.labelName;
        inputLabel.setAttribute('for', input.name);
        inputLabel.classList.add('font-semibold');

        let inputField;
        if (['text', 'password'].includes(input.type)) {
            inputField = document.createElement('input');
            Object.assign(inputField, {
                id: input.name,
                type: input.type,
                spellcheck: false,
                value: input.default ?? '',
                placeholder: input.default ?? '',
                className: 'input-field',
                required: input.required !== undefined ? input.required : true,
            });
            inputField.setAttribute("data-validation", input.validation || "none");
        } else if (input.type === 'checkbox') {
            inputField = document.createElement('input');
            Object.assign(inputField, {
                id: input.name,
                type: input.type,
                checked: input.checked,
                className: 'input-checkbox',
            });
        } else if (input.type === 'chooseDir') {
            const folderSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>`;
            const chooseDirText = folderSvg + `<span id="${input.name}" class="w-64 truncate">C:\\Users\\` + process.env.USERNAME + "\\Downloads</span>"
            inputField = document.createElement('div');
            Object.assign(inputField, {
                className: 'input-chooseDir',
                innerHTML: chooseDirText,
            });
        }

        inputGroup.appendChild(inputLabel);
        inputGroup.appendChild(inputField);

        const inputDescription = document.createElement('div');
        inputDescription.classList.add('text-xs', 'basis-1/2', 'text-gray-500');
        inputDescription.innerHTML = input.description || '';
        inputGroup.appendChild(inputDescription);

        const inputValidation = document.createElement('div');
        inputValidation.id = input.name + 'InputValidation';
        inputValidation.classList.add('text-xs', 'basis-1/2', 'text-red-700', 'dark:text-red-500', 'text-end');
        inputGroup.appendChild(inputValidation);

        inputFieldsDiv.appendChild(inputGroup);
    });
    document.querySelectorAll('.input-chooseDir').forEach(chooseDirInput => {
        chooseDirInput.addEventListener('click', () => requestFolderDialog(chooseDirInput));
    });

}

function requestFolderDialog(chooseDirInput) {
    ipcRenderer.invoke("request-folder-dialog", chooseDirInput.children[1].id).then((pickedFolder) => {
        if (!pickedFolder) { return }
        chooseDirInput.children[1].innerHTML = pickedFolder;
        validateDir(chooseDirInput.children[1]);
    });
}