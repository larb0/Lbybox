# LarbyBox — Gold / Dark app

Replace the files in your existing web app with all files from this folder, keeping them together. This is a static app: there is no build step. Use your existing HTTPS hosting for Bluetooth control. No speaker firmware update is needed for this visual update.

Open the app and choose Connect. Demo lets you try the layout and controls without a speaker. If your installed app still shows the older interface after uploading, close and reopen it after the new service worker has installed; refreshing once more can also fetch the new shell.

## Controls

- Home: volume dial, playback, bass profile, lighting and favourite scenes.
- Drag or tap the dial. Keyboard: arrows change volume by 1, Page Up/Down by 10, Home/End select 0/100. Commands send when a drag ends.
- The centre mute button sends volume 0; pressing it again restores the previous app volume. It does not change the speaker's battery-protection mute.
- Scene buttons set bass profile, lighting effect, colour and brightness. They do not change volume or EQ trim values. Save current replaces one of the three scene slots; scenes are stored in this browser on this device, not automatically shared across devices or saved to the speaker's startup settings.
- Lights: all effects with a preview and the same colour/brightness controls.
- Sound: the existing sound controls, startup defaults and save/reset actions.
- Settings: Power & system, Activity and Advanced.
- Controls are unavailable when disconnected or when their board is absent. Microphone controls require the reported microphone hardware.

The main playback button sends the existing play/pause command. Current firmware does not report playback state, so the live app uses a play symbol for this toggle; demo mode can show pause.

## Changes and validation

Implemented the approved charcoal/gold layout with a circular SVG dial, responsive navigation, accessible controls, scene storage, and acknowledgement-based dial updates. Added gold.css and gold.js; updated index.html, manifest colours and the offline cache version. Fixed the supplied app's missing checkForReboot/lastUptime definitions so incoming acknowledgements can be processed.

Browser checks passed: desktop and mobile layouts (360, 390, 768, 1024 and 1440px widths); dial pointer/keyboard input; mute/restore; scene application and persistence; tab navigation; queued commands and clamped replies through a simulated Bluetooth characteristic; disconnect gating. No physical speaker or Bluetooth radio was available for hardware testing. Firmware files in the full bundle are unchanged from the uploaded version 8.
