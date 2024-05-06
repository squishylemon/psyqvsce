const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const axios = require('axios');
const AdmZip = require('adm-zip');

let disposable;

function locatePsyqFolder() {
	vscode.window.showOpenDialog({
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: 'Locate "psyq" Folder'
	}).then(uris => {
		if (uris && uris.length > 0) {
			const selectedFolder = uris[0].fsPath;
			const folderName = path.basename(selectedFolder);

			if (folderName.toLowerCase() === 'psyq') {
				
				const extensionPath = __dirname;
				const targetFolder = path.join(extensionPath, 'psyq');
				
				// Copy the "psyq" folder to the extension's directory
				fs.copyFile(selectedFolder, targetFolder, (err) => {
					if (err) {
						vscode.window.showErrorMessage(`Error copying "psyq" folder: ${err.message}`);
					} else {
						vscode.window.showInformationMessage(`"psyq" folder located successfully at: ${selectedFolder} and copied to extension directory.`);
					}
				});
			} else {
				vscode.window.showErrorMessage('The selected folder is not named "psyq". Please select a folder named "psyq".', 'Ok', 'Cancel').then(selection => {
					if (selection === 'Ok') {
						locatePsyqFolder();
					} else {
						quitExtension();
					}
				});
			}
		}
	});
}

function quitExtension() {
	disposable.dispose();
}

function downloadAndExtractPsyqAlt() {
    const extensionPath = __dirname;
    const zipFilePath = path.join(extensionPath, 'psyq.zip');
    

    const psyqDownloadUrl = 'https://archive.org/download/psyq-sdk/PSYQ_SDK.zip';

    // Download the psyq.zip file with progress tracking
    axios({
        url: psyqDownloadUrl,
        method: 'GET',
        responseType: 'stream',
        onDownloadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            vscode.window.setStatusBarMessage(`Downloading psyq.zip: ${percentCompleted}%`, 1000);
        }
    }).then(response => {
        // Save the downloaded zip file
        response.data.pipe(fs.createWriteStream(zipFilePath)).on('close', () => {
            // Extract the contents of psyq.zip
            const zip = new AdmZip(zipFilePath);
            zip.extractAllTo(extensionPath, /*overwrite*/ true);

            // Notify the user
            vscode.window.showInformationMessage(`"psyq.zip" downloaded and extracted successfully.`);
        });
    }).catch(error => {
        vscode.window.showErrorMessage(`Failed to download "psyq.zip": ${error.message}`, "Try Again", "Cancel")
            .then(choice => {
                switch (choice) {
                    case "Try Again":
                        downloadAndExtractPsyq();
                        break;
                    case "Cancel":
                        quitExtension();
                        break;
                    default:
                        break;
                }
            });
    });
}


function downloadAndExtractPsyq() {
    const extensionPath = __dirname;
    const zipFilePath = path.join(extensionPath, 'psyq.zip');
    

    const psyqDownloadUrl = 'https://archive.org/download/psyq-sdk/PSYQ_SDK.zip';

    // Download the psyq.zip file with progress tracking
    axios({
        url: psyqDownloadUrl,
        method: 'GET',
        responseType: 'stream',
        onDownloadProgress: progressEvent => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            vscode.window.setStatusBarMessage(`Downloading psyq.zip: ${percentCompleted}%`, 1000);
        }
    }).then(response => {
        // Save the downloaded zip file
        response.data.pipe(fs.createWriteStream(zipFilePath)).on('close', () => {
            // Extract the contents of psyq.zip
            const zip = new AdmZip(zipFilePath);
            zip.extractAllTo(extensionPath, /*overwrite*/ true);

            // Notify the user
            vscode.window.showInformationMessage(`"psyq.zip" downloaded and extracted successfully.`);
        });
    }).catch(error => {
        vscode.window.showErrorMessage(`Failed to download "psyq.zip": ${error.message}`, "Try Again", "Alternate URL", "Cancel")
            .then(choice => {
                switch (choice) {
                    case "Try Again":
                        downloadAndExtractPsyq();
                        break;
                    case "Alternate URL":
                        downloadAndExtractPsyqAlt();
                        break;
                    case "Cancel":
                        quitExtension();
                        break;
                    default:
                        break;
                }
            });
    });
}


function checkPsyqFolder() {
	// Get the extension directory
	const extensionPath = __dirname;
	const psyqFolderPath = path.join(extensionPath, 'psyq');

	// Check if the "psyq" folder exists
	if (!fs.existsSync(psyqFolderPath)) {
		// Prompt the user to download and install the "psyq" folder as an error message
		vscode.window.showErrorMessage('The "psyq" folder was not found. Would you like to download and install it?', 'Yes', 'No', 'Locate').then(selection => {
			if (selection === 'Yes') {
				downloadAndExtractPsyq();
			}
			if (selection === 'Locate') {
				// Prompt the user to locate the "psyq" folder
				locatePsyqFolder();
			}
			if (selection === 'No') {
				// Disable the extension by unregistering the command
				quitExtension();
			}
		});
	}
}

function activate(context) {
	checkPsyqFolder();
	console.log('Congratulations, your extension "psyqvsce" is now active!');

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('psyqvsce.emulatorPath')) {
			// React to changes in emulatorPath setting
		}
		if (event.affectsConfiguration('psyqvsce.autoCompile')) {
			// React to changes in autoCompile setting
		}
	});

	disposable = vscode.commands.registerCommand('psyqvsce.psyqHelp', function () {
		let description = "Welcome to PSYQVSCE! This extension enhances your VS Code experience with a variety of features that aid in your PS1 game development. Below are the features of this extension:";

		let features = [
			{ name: "Run and Compiling", description: "This feature allows VS Code to run the emulator of your choice and auto-boot the compiled C code for your game." },
			{ name: "AutoC", description: "This feature allows VS Code to automatically compile and run your C code as it's edited." },
			{ name: "Quick Tools", description: "A helpful feature to quickly launch all the PS1 development tools, such as timtool, vagedit, etc." },
			{ name: "Quick Docs", description: "Another useful feature that can quickly open any of the documentation PDFs." }
		];

		const panel = vscode.window.createWebviewPanel(
			'psyqvsceHelp',
			'PSYQVSCE Help',
			vscode.ViewColumn.One,
			{}
		);

		panel.webview.html = getWebviewContent(description, features);
	});

	function getWebviewContent(description, features) {
		return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PSYQVSCE Help</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        font-size: 24px;
                    }
                    p {
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <h1>PSYQVSCE Extension</h1>
                <p>${description}</p>
                <h2>Features:</h2>
                <ul>
                    ${features.map(feature => `<li><strong>${feature.name}</strong>: ${feature.description}</li>`).join('')}
                </ul>
            </body>
            </html>
        `;
	}

	context.subscriptions.push(disposable);
}


function deactivate() { }

module.exports = {
	activate,
	deactivate
};