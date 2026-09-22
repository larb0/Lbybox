# Connection screen and installed PWA update

Upload ALL files inside larbybox-app to the same GitHub Pages location as the existing app, including connection.js and sw.js. Keep the manifest location, start URL and scope unchanged. No build step or reinstallation is needed.

Wait for the GitHub Pages deployment to finish, then open the installed app with internet access. The previous app may remain visible while Chrome installs the new service worker: fully close and reopen it once more if needed. The new build has the central connection card and no simulation mode.

This build checks for service-worker updates at launch, when returning to the app, when coming online, and every five minutes. It reloads after an update when disconnected. While connected it defers reloading until controls disconnect. Updates cannot download while offline, and GitHub/Chrome delivery timing cannot be forced from the ZIP.

Future releases must bump CACHE_NAME in sw.js and upload the complete app together. Shell installation is all-or-nothing to avoid activating a release with missing files. Offline launches use the cached shell.

Connection is required to use controls. Cancelled/failed attempts can be retried; disconnection returns the card. Settings contains Disconnect controls. Browser Bluetooth pairing still requires a user click. Music pairing is separate.

Only app files changed in this release; all firmware is preserved from the uploaded LED-overhaul bundle.
