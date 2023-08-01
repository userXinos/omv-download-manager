# FAQ

If none of the below questions apply to you, feel free to [open an issue](https://github.com/userXinos/omv-download-manager/issues/new/choose)!

## How do I fix a connection failure?

There are many ways NAS Download Manager's connection to your NAS can fail that are out of its control. NAS Download Manager does its best to guess what might be wrong and tell you (such as when it says "likely cause: wrong protocol"), but sometimes, for security reasons, browsers don't tell it enough to make a good guess.

You can login again through NAS Download Manager's settings. This will replace the existing login session with a new one, which may work around transient issues you are having.

## What is an "invalid certificate"?

Certificates are how servers prove to browsers they are who they claim. Browsers will, by default, prevent you from accessing sites with invalid certificates unless you explicitly tell them to ignore the issue. Self-signed certificates, commonly used with OpenMediaVault NASes, are generally considered invalid until you manually tell the browser to accept them.

NAS Download Manager is subject to the same security restrictions as regular browser tabs. However, unlike a browser tab, it is unable to show you the page where you can override the browser's protections/tell it to accept a self-signed certificate. To fix this issue, visit the OMV page in a browser tab using the __same hostname/port you use for NAS Download Manager__, which should prompt you to override protections/accept the certificate.

## Why can't I use HTTP (not HTTPS) to connect to the NAS?

As of 2021-12-01, Firefox changed their [add-on policies](https://extensionworkshop.com/documentation/publish/add-on-policies/#development-practices) to disallow non-encrypted traffic from extensions:

> Add-ons must use encryption when transporting data remotely.

In version 0.12.0, originally NAS Download Manager removed the HTTP option to comply with this requirement.

It is recommended that you set up HTTPS access, though note you may need to [configure your certificates](#what-is-an-invalid-certificate) to allow NAS Download Manager to log in properly.

## Why can't I start a download from (a site)? _or_ How do I start a download with (a site)?

Not all sites offer downloads in a way that is compatible with a Synology NAS setup. Examples include:

- sites requiring authentication to download, which the NAS cannot perform
- sites triggering downloads using JavaScript rather than a link with a URL
- sites that whitelist IPs for download using the IP of your browser rather than the IP of the NAS (when using the NAS remotely)

NAS Download Manager does a best-effort to handle some of these cases some of the time. Unfortunately, some cases are outright impossible, such as JavaScript-triggered downloads.

As a potential workaround, you can initiate the download in your browser, cancel it, then copy the URL from the browser's download list into NAS Download Manager. This may not work in all cases, such as if the problem is the inability of the NAS to authenticate with the site.

## Are my username and password stored securely?

Sort of. Your credentials are stored in a place where only NAS Download Manager is able to access them, but unencrypted. Browsers don't yet support encrypted storage for extensions. [Issue #85](https://github.com/seansfkelley/nas-download-manager/issues/85) tracks using that storage if and when it exists.

Your credentials are only ever transmitted to the host you specify in the settings. As of version 0.12.0 (originally NAS DM), only HTTPS is permitted, so your credentials are transmitted encrypted. You can also uncheck the "Remember Password" checkbox during login to prevent the extension storing your password in the abovementioned extension-only storage.

NAS Download Manager collects and stores only information you provide, and only enough to perform its job. [Read more.](./PRIVACY.md)
