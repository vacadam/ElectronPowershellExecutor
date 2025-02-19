# Electron PowerShell Executor - EPE

This is an ElectronJS application designed to run PowerShell scripts directly from the app using Node.js child processes. The app captures the script output in real-time and displays it in the interface, providing a seamless way to execute and monitor PowerShell commands.

### How it works

- The application reads script definitions from a commands.json file, which contains details such as:
    - Script name & description
    - Script file path
    - And others - all described later
- Multiple scripts can be defined for each button/command
- Based on this configuration, the app dynamically renders buttons in the UI for executing PowerShell scripts.
- Clicking a button runs the corresponding PowerShell script in a separate child process, and the output is displayed live in the app.

#### PowerShell Version Detection
- At startup, the app checks for the availability of pwsh.exe.
- If found, it uses pwsh.exe to execute scripts; otherwise, it falls back to powershell.exe (Windows PowerShell).
- Some scripts may require pwsh.exe. This requirement can be specified in commands.json to prevent execution if only powershell.exe is available.

#### Additional Features
- Favorite Scripts – Users can mark frequently used scripts as favorites, which are pinned to the top for quick access.
    - Sorting & Customization – Favorite scripts can be reordered to match user preferences.
- Dark/Light mode is available
- Logging is available
    - logs are in log4j format (my preference), but this can be changed (app is using electron-log npm package)



https://github.com/user-attachments/assets/1e55e994-e2b2-4e4b-aed5-4e5f01ca0fd3



## Structure of *commands.json* and examples

### Very basic example
```json
{
    "id":"start-notepad",
    "options":{
        "name":"Start Notepad",
        "menu-position":"apps"
    },
    "scripts":[
        {
            "path":"startNotepad.ps1",
        }
    ]
}
```

- id - unique identifier of the command
- options/name - name of the rendered button
- options/menu-position - identifier of menu category
- scripts/path - path to the script file located in scr/scripts folder

### Optional propeties of <u>*options*</u>
**hidden** - set to true if the button should not be rendered for a user
```json
"hidden": true,
```

**description** - used for tooltip
```json
"description":"Starts the installed Notepad application"
```

**type** - set to *step-button* if additional confirmation window should be shown to the user (should be used for ireversible scripts in case of miss-clicks)
```json
"type": "step-button"
```

**confirmation** - can be used together with previous attribute to show user a more detailed message in the confirmation window. Default message is shown instead if the confirmation attribute is omitted.
```json
"confirmation": "Following command will destroy something..."
```

### Optional properties of <u>*scripts*</u>

Property **scripts** have only three reserved properties - path, requirement("pwsh" if required) and inputs(described below). Any other defined properties are passed to the powershell script as data (described in next section).

## Providing data to script
Currently there are four ways of providing data to scripts:
- Static/predefined data
- Dynamic input handling before the script runs
- Dynamic input handling during script execution (Read-Host)
- Output as an input for chained script

### Static/predefined data
As mentioned earlier, these are the attributes from the json file defined for each script.
```json
"scripts":[
    {
        "path": "sayHelloWorld.ps1",
        "hello": "Hello",
        "world": "World"
    }
]
```

### Dynamic input handling before the script runs
If the PowerShell script expects dynamic input from user, property **inputs** can be used to pause the script's execution before the PowerShell is spawned and prompt the user for the required data. Once the user provides the data, execution will start.
```json
{
    "id":"query-list-users",
    "options":{
        "name":"List users",
        "description":"List all active users.",
        "menu-position":"queries"
    },
    "scripts":[
        {
            "path":"sqlQuery.ps1",
            "query":"listUsers",
            "inputs":[
                {
                    "name":"rows",
                    "labelName":"Number of results",
                    "type":"text",
                    "default":"5",
                    "validation":"numeric"
                }
            ]
        }
    ]
}
```

Currently only four types of input fields are allowed - text, password, checkbox and chooseDir(folder picker).
```json
{
    "name": "username", 
    "labelName": "Write your name", 
    "type": "text"
},
{
    "name": "userpassword", 
    "labelName": "Write your password", 
    "type": "password"
},
{
    "name": "mustBeTrue", 
    "labelName": "Do you like PowerShell?", 
    "type": "checkbox",
    "checked": true
},
{
    "name": "folder", 
    "labelName": "Choose a folder", 
    "type": "chooseDir"
}
```
Every type of field allows property *description* to be defined, which should contain helper text that will be shown below the input label.
```json
{
    "name":"downloadDir",
    "labelName":"Download directory",
    "type":"chooseDir",
    "description":"Choose a folder where the installer will be downloaded."
}
```

For inputs text and password, properties *default* (used for both default value and input placeholder), *required* (default true) and *validation* can be defined. Validation accepts values - alpha, alphaWithSpaces, numeric, alphanumeric, alphanumericWithSpaces and none(default).
```json
{
    "name":"language",
    "labelName":"Language",
    "type":"text",
    "default":"en",
    "validation":"alpha",
    "required":true
}
```

Input checkbox allows property *checked* to be either true or false.
```json
{
    "name":"delete",
    "labelName":"Delete file",
    "type":"checkbox",
    "checked":false
}
```
### Access the data in PowerShell script

Both static and dynamic data are passed to PowerShell under the *-jsondata* argument within the spawn method. The value is provided as a JSON string.
```js
const powershell = spawn(powershellVersion, [
        "-ExecutionPolicy", "Bypass",
        "-File", `"${scriptPath}"`,
        "-jsondata", `"${commandDataJson}"`, // e.g. -jsondata {\"application\":\"Notepad\"}
    ], 
    { shell: true }
);
```

Given that we have command like this:
```json
{
    "id":"say-hello-world",
    "options":{
        "name":"Say Hello World",
        "menu-position":"example"
    },
    "scripts":[
        {
            "path": "sayHelloWorld.ps1",
            "static": "Hello",
            "inputs": [
                {
                "name": "dynamic",
                "labelName": "Who do you want to greet?",
                "type": "text",
                "default": "World"
                },
            ]
        }
    ]
}

```

Then, in our example.ps1 script, we can access the parameters like this:

```powershell
# Define jsondata in param block
param (
    [string]$jsondata
)
# Convert JSON formatted string to PowerShell custom object
$data = $jsondata | ConvertFrom-Json

# Use the data
Write-Host $data.static + ' ' + $data.inputdynamic
```
Output:
> Hello World

As shown in the example, all "static" properties can be accessed using the property name, while inputs can be accessed by prefixing "input" to the name of the input.

### Dynamic input handling during script execution (Read-Host)
For scripts that require conditional input (input that isn't needed every time the script runs), we can use PowerShell's Read-Host command. However, due to how Read-Host works, some modifications are required to ensure proper integration with the Electron application.

#### The issue
If we use Read-Host normally:
```powershell
$input = Read-Host "What's your name"
```
The script will become stuck because PowerShell does not provide any stdout output for this operation. As a result, the Electron application does not detect that input is required, causing the process to hang indefinitely.

#### Solution:
To signal that user input is required, we must use Write-Host before Read-Host:
```powershell
Write-Host '[INPUT] Would you like me to show you system information? (yes/no)'
$sysInfo = Read-Host
```
By prefixing the message with [INPUT], the Electron application can:
- Display the message "Would you like me to show you system information? (yes/no)" to the user.
- Trigger an input prompt, allowing the user to provide a response.

#### Important Notes
- Using the -Prompt parameter with Read-Host is not only unnecessary but entirely ignored, as the Electron application does not receive this parameter.
- The [INPUT] prefix acts as a signal for the app to recognize that user input is required.
- [BUG] Using Read-Host parameters -MaskInput or -AsSecureString will break this functionality

This approach ensures seamless real-time interaction between the Electron application and PowerShell scripts, allowing dynamic input handling without causing scripts to hang.

### Output as an input for chained script

It is possible to chain multiple scripts within a single command, and it is also possible to use output from the script as an input for all subsequent chained scripts.
```json
{
    "id":"restart-multiple-services",
    "options":{
        "name":"Restart Services",
        "menu-position":"services"
    },
    "scripts":[
        {
            "path":"restartServices.ps1",
            "service":"Service1"
        },
        {
            "path":"restartServices.ps1",
            "service":"Service2"
        },
        {
            "path":"restartServices.ps1",
            "service":"Service3"
        }
    ]
}
```

To provide the output as an input, it is neccessary to output the data as JSON.
```powershell
# 1st chained script
$object = @{"foo" = "bar"} | ConvertTo-Json
Write-host $object
```
When this is done, we can access this data in all subsequent scripts from -jsondata parameter where it is stored in *chain* object.
```powershell
# 2nd chained script
param (
    [string]$jsondata
)
$data = $jsondata | ConvertFrom-Json

$data.chain.foo #bar
```


## Deploy process

Change version value in both package.json and installSetup.iss files

```
"version": "1.0.0"
```

```
#define AppVersion "1.0.0"
```

Build the application and compile installer

```js
// all-in-one script
npm run deploy

// OR one by one
npm prune
npm run prod // minify tailwind css
npm run hash // generates new hash values for script files
npm run build // builds the application w/ electron-builder
npm run compile // compiles the installer with InnoSetup node wrapper
```

**IMPORTANT** If you will use InnoSetup node wrapper, do not forget to adjust application GUID in installSetup.iss file.
```
AppId={{5D1C408B-3C70-495C-B607-69AAD80A8691}
```
