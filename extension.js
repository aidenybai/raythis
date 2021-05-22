const fs = require('fs');
const path = require('path');

const open = require('open');
const vscode = require('vscode');
const prettier = require('prettier');

const filetypes = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'filetypes.json'), 'utf-8'));

/**
 * Generates modified Base64 Encoded String
 * @param {String} str - The string to be encoded.
 * @returns {String} Base64 Encoded String
 */
const generateEncodedCode = (str) => Buffer.from(str).toString('base64');

/**
 * Generate a URL from using the script-commands
 * by Raycast as a reference.
 * @param {Object} [options]
		Query parameters to be used to
		construct the completed request.
	* @param {('candy'|'breeze'|'midnight'|'sunset')} [options.colors]
		The color scheme you want the
		uploaded code to have.
	* @param {(
		'true'|
		'false'
	)} [options.background]
		Will determine whether the background
		of the image is opaque or translucent.
	* @param {(
		'true'|
		'false'
	)} [options.darkMode]
		Will determine whether the background
		behind the text is light or dark.
	* @param {(
		'16'|
		'32'|
		'64'|
		'128'
	)} [options.padding]
		Determines the size of the padding
		around the content of the uploaded text.
	* @param {String} [options.title]
		The title of the code snippet.
	* @param {String} [options.language]
		The language the code is in
	* @param {String} code
		The snippet of code.
	* @returns {String} Returns the URL of the snippet.
*/
const generateRayUrl = (code, options = {}) => {
  const objParams = { ...options, code: generateEncodedCode(code), language: getLanguageName() },
    parameters = Object.keys(objParams)
      .map((key) => `${key}=${encodeURIComponent(objParams[key])}`)
      .join('&');

  return 'https://ray.so/?' + parameters;
};

function getLanguageName() {
  const tabFilePath = vscode.window.activeTextEditor.document.fileName;
  const segments = tabFilePath.split('.');
  if (!segments.length) return;
  const extension = segments[segments.length - 1].toLowerCase();
  const [language] = filetypes.filter(({ extensions }) => extensions.includes(extension));
  return language ? language.value : 'auto';
}

function activate(context) {
  const publishSelectedSnippet = vscode.commands.registerCommand(
    'ray-this.publishSelectedSnippet',
    () => {
      const { activeTextEditor, showErrorMessage, showInformationMessage } = vscode.window;

      // * If there is no active text editor,
      // * return an error message.
      if (!activeTextEditor)
        return showErrorMessage(
          `You need to have an open editor to upload a code snippet to Ray.so.
				Please select a file and make a text selection to upload a snippet.`
        );

      const selectedContent = activeTextEditor.document.getText(activeTextEditor.selection);

      // * If there is no selected content,
      // * return an error message.
      if (!selectedContent)
        return showErrorMessage(
          `You have to have text selected to upload a snippet to Ray.so.
				Please select the text you would like to be included in your snippet.`
        );

      // * Generate URL & open in default browser,
      // * then send success message.
      const filePath = (activeTextEditor.document.fileName || '\\ ').split('\\') || '';
      let content = '';

      try {
        content = prettier.format(selectedContent, {
          arrowParens: 'always',
          bracketSpacing: true,
          htmlWhitespaceSensitivity: 'css',
          insertPragma: false,
          printWidth: 100,
          proseWrap: 'preserve',
          quoteProps: 'as-needed',
          requirePragma: false,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
          useTabs: false,
          endOfLine: 'lf',
          parser: 'babel',
        });
      } catch(_err) {
        content = selectedContent.trim();
      }

      const url = generateRayUrl(content, {
        title: (filePath || ['Untitled'])[filePath.length - 1] || 'Untitled',
        colors: 'candy',
        padding: '32',
      });

      showInformationMessage(`[Screenshot url](${url})`);

      open(url);
    }
  );

  context.subscriptions.push(publishSelectedSnippet);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
