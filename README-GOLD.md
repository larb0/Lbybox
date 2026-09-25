# LarbyBox — Gold / Dark, revision 3

Upload all app files together to your existing HTTPS web host. There is no build step. Close and reopen the installed app after updating to load the new cached version. Demo works without a speaker.

## Requested changes

- Battery voltage appears next to its percentage.
- Favourite scenes and the dial's mute button have been removed.
- EQ profiles occupy the former scenes area.
- LED effects are available on Home in a single horizontally scrollable row. Swipe sideways on phone; use the scrollbar or trackpad on desktop.
- Every Advanced slider has persistent explanatory text, including the meaning of higher/lower values and units.
- Playback commands now avoid overlapping clicks, report unavailable connections and use reported playback state for the play/pause symbol.

## Playback update

Flash the updated larbybox_bt sketch to the Bluetooth/audio ESP32 for the new playing/avrc status fields and command connection checks. The LED and S3 firmware do not need another update for these app revisions. The full bundle retains the prior LED ::memcpy compile fix.

Pair your music phone or PC to LarbyBox for audio, then connect the app to the BLE control service. The app can control the music device via the Bluetooth board. A connected BLE app alone is not a connected music source. Track skipping depends on the music player supporting Bluetooth media controls.

The app sends one play, next or previous command through its acknowledged BLE queue. The Bluetooth board dispatches the existing A2DP library media command only when its AVRCP media-control connection is ready; otherwise it returns an unavailable reply. A successful reply confirms dispatch, not that the phone obeyed. The play/pause icon follows the reported audio-stream state on the once-per-second heartbeat.

## Advanced controls

Load current requests the board's current tuning values. Save tuning stores DSP tuning; Save lights stores LED tuning. Reset all DSP tuning restores and saves the DSP tuning defaults. Control descriptions remain visible independently of command acknowledgement messages.

## Validation

Browser checks passed at 360, 390, 768 and 1440px: navigation, battery text, removal of scenes/mute, playback command dispatch through a simulated BLE characteristic, live playback-state updates, disconnected controls, and descriptions for every Advanced slider. Physical Bluetooth operation and a full ESP32 firmware compilation have not been tested here.

The media-control readiness API was checked against the library's official reference:
https://pschatzmann.github.io/ESP32-A2DP/html/class_bluetooth_a2_d_p_sink.html
