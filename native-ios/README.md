# SG native audio test

Minimal SwiftUI / AVAudioEngine USB monitor. No NAM, effects, network audio,
WebView, microphone fallback or Bluetooth route. Requests measurement mode,
44.1 kHz and 64/128/256 frames; displays the actual session values.
The output starts at -24 dB. Latency labels are system reports, not measured RTL.
The app stops on route changes, interruptions and leaving the foreground.

## Build and personal installation from Windows

Run the GitHub Actions `Build iPad Audio Test` workflow on a macOS runner.
Download its artifact and extract `SGAudioTest-unsigned.ipa`.
This unsigned file CANNOT be installed directly: re-sign/install with Sideloadly
from https://sideloadly.io/ using your own Apple account on your own computer.
Never put Apple passwords in this repo or GitHub Actions.
Free-account signing expires after 7 days; refresh/re-sign when needed.
Sideloadly's official Windows prerequisites include desktop iTunes and iCloud.
Do not uninstall existing Apple software without checking the local setup first.

Connect iPad to PC, unlock it and accept Trust. Select iPad and this IPA in
Sideloadly, sign in locally and install. Enable Developer Mode / developer trust
on iPad if prompted. Then connect TONEX by USB and wired headphones to TONEX.
Open SG Audio Test, allow audio input, start at 128 frames and low volume.
Compare Start versus Stop: hardware monitoring may remain audible when stopped.
Try 64 only after 128 works; use 256 if audio crackles. No promised latency until
tested on physical hardware. This app monitors TONEX's USB signal, which may
already include its current preset. It does not change TONEX hardware settings.
