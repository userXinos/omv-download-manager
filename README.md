# NAS Download Manager (for OpenMediaVault)
An open source browser extension for adding/managing download tasks to your OpenMediaVault.

#
> [Fork](https://github.com/seansfkelley/nas-download-manager) of the Synology addon developed by [Sean Kelley](https://github.com/seansfkelley)
>
> [![Donate](https://img.shields.io/badge/Donate%20$2-PayPal-brightgreen.svg)](https://paypal.me/downloadmanager/2)
#

## Having an Issue?

If you're here because of an issue with the extension, please check the [FAQ](./FAQ.md) first. If you can't find an answer there, feel free to [open an issue](https://github.com/userXinos/omv-download-manager/issues)!

## About

NAS Download Manager allows you to add and manage your download tasks on your OpenMediaVault right from your browser. It requires a OpenMediaVault 6 with Downloader plugin from OMV-Extras.

If you don't have OMV-Extras installed, use this [installation guide](https://forum.openmediavault.org/index.php?thread/5549-omv-extras-org-plugin). Then, in the OMV web interface, install the Downloader plugin via System -> Plugins.

### Features

- Clear all completed tasks with one click.
- Choose destination folder for new download tasks.
- View, filter and sort all the current download tasks in the extension popup.
- Add/start/remove download tasks in the extension popup.
- System notifications for completed download tasks.

### Officially Supported Browsers

- Firefox ([view listing]())
- Chrome ([view listing]())

### Browsers Reported to Work

These browsers are not officially supported and the extension is untested with them, but there are ways to install it.

- Edge (see [how to install from Chrome Web Store](https://support.microsoft.com/en-us/help/4538971/microsoft-edge-add-or-remove-extensions) and use the Chrome link above)
- Opera (using the [Install Chrome Extensions](https://addons.opera.com/en/extensions/details/install-chrome-extensions/) extension to install from the Chrome link above)

### Unsupported Browsers

There are currently no plans to support the following browsers.

- Safari

## Privacy

NAS Download Manager needs your login credentials to communicate with your NAS. It doesn't collect, store or transmit any other information. [Read more.](./PRIVACY.md)

## Development

Please note that development is not actively supported on Windows. Some of the below commands may fail and require manually invoking an analogous Windows command instead.

### Prerequisites

Dependencies are managed with [Yarn](https://github.com/yarnpkg/yarn). Install it if you don't already have it.

### Actively Developing the Extension

These instructions describe how to build and automatically re-build the assets for the extension for quick iteration during active development. For building, optimizing and packaging the extension for distribution, see the next section.

Please note that while the build tasks will auto-recompile, the browser may not pick up changes automatically. In particular, changes to code running in the extension's background generally requires you to explicitly refresh the extension (for which there is usually a button in the debugging interface). Changes to language support may require you to remove the development extension entirely and re-add it.

1. Install dependencies.

    ```
    yarn
    ```

2. Start a build to watch files and auto-recompile code on change.

    ```
    yarn watch
    ```

3. In your browser, navigate to the extension debugging page and open `manifest.json`.

   **Firefox**: `about:debugging` > This Firefox > Load Temporary Add-on...

   **Chrome**: `about:extensions` > Enable "Developer mode" > Load unpacked

### Packing the Extension for Distribution

1. Install dependencies.

    ```
    yarn
    ```

2. Build and optimize all assets.

    ```
    yarn build
    ```

3. Zip all assets into a file suitable for distribution.

    ```
    yarn zip
    ```

4. _(Optional)_ Zip all source code into a file suitable for distribution.

    ```
    yarn zip-sources
    ```

### Translating the Extension

I need help localizing NAS Download Manager! Read in detail about [how to localize WebExtensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization), or skip to the sections below for short summaries.

#### Adding a New Language

In order to add the new language, base your translation file off the English messages file.

1. Copy `_locales/en/messages.json` into a new file at `_locales/<your language code>/messages.json`.
2. Edit the `message` field in each item with your translation.
3. In `src/common/moment.ts`, add a new import line like `import "moment/locale/<your language code>";`.
4. Load (or reload) the extension to test it out. You may need to remove the extension entirely and then re-add it for changes to be reflected.
5. Open a pull request!

There are automated checks to ensure that you're only defining translated strings that the extension actually uses.

#### Editing an Existing Language

If you're adding more strings for an incomplete translation, you can use `./scripts/diff-messages <your language code>` to get a list of all the entries you need to add to the `messages.json` in a format that is easily copy-pasted:

```
$ ./scripts/diff-messages ru
"Badge_shows": {
  "message": "Badge shows",
  "description": "Prefix text for badge-display-type dropdown."
},
```
