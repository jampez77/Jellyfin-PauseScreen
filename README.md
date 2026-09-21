# Jellyfin-PauseScreen

<div align="center">
    <p>
        <img alt="Jellyfin-PauseScreen Logo" src="logo/logo.png" width="450"/>
    </p>
</div>

This plugin take and builds upon the great work by [`BobHasNoSoul`](https://github.com/BobHasNoSoul/Jellyfin-PauseScreen) with added support for live TV as well as neater styling.



confirmed working on 10.11.0 

A pause screen for jellyfin that adds the logo and the disc and the description when paused that dissapears when playback is resumed or the video is exited.

## Manifest URL

```
https://raw.githubusercontent.com/jampez77/Jellyfin-PauseScreen/main/manifest.json
```

Basically it is able to pick the items logo and the items plot and then from there also grab the items disc and put them on the screen when paused. It does however have fallbacks so lets say you dont put a disc for every item, thats fine it will go to season and then if there isnt one there it will get the series disc image, same for the logo.. the only thing i didnt do like that is the plot.. because that could go very badly.


<img alt="Screenshot 2026-06-02 at 14 26 12" src="https://github.com/user-attachments/assets/e587a512-b541-433c-9f9e-79f8d45a48e0" />
<img alt="Screenshot 2026-06-02 at 14 26 47" src="https://github.com/user-attachments/assets/5588b268-2c74-4ea6-8fb1-4e80b57cce9d" />
<img alt="Screenshot 2026-06-02 at 14 26 36" src="https://github.com/user-attachments/assets/17e5836c-3c65-48ea-bf8f-6d991e7e8c9b" />
<img alt="Screenshot 2026-06-02 at 14 26 22" src="https://github.com/user-attachments/assets/8dc47df0-2d35-4b92-83bd-6b4bf855e732" />

## LG webOS compatibility

The embedded script uses ES2017 syntax, following the approach in
[InPlayerEpisodePreview's webOS fix](https://github.com/Namo2/InPlayerEpisodePreview/commit/aec89585afef65d12a29a58072939a9d9244b490).
[LG lists Chromium 79 for webOS 6.x and Chromium 68 for webOS 5.x](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine).
These engines cannot parse optional chaining (`?.`) or nullish coalescing (`??`),
so the script uses explicit checks instead. This targets webOS 5.x and later;
older webOS versions are not covered by this change.

The server still injects the same embedded script into Jellyfin Web. No TV-specific
PauseScreen implementation or changes to Jellyfin's web files are required.
Playback and remote-control behavior still need verification on a physical LG TV.

### Build and test

With Node.js 22 and a .NET SDK capable of building `net9.0` installed:

```sh
npm ci
npm test
dotnet publish Jellyfin.Plugin.PauseScreen.sln -c Release
```

The tests reject JavaScript newer than ES2017 and exercise playback events,
nullable metadata, Live TV, image fallbacks, and the Jellyfin 12 auth headers.
Node.js is only needed for these development tests, not on the Jellyfin server.

### Test a local build in Docker

Stop Jellyfin and extract the plugin ZIP into a dedicated folder under the host
directory mounted as `/config/plugins`, for example
`/config/plugins/Jellyfin-PauseScreen_1.1.1.0/`. Move any older PauseScreen plugin
folder outside `/config/plugins` before starting Jellyfin again, keeping it as a
rollback copy. The ZIP contains the plugin DLL, its metadata, and build outputs.

Fully exit and reopen the Jellyfin app on the TV, then play and pause an episode,
resume playback, switch to another item, and test Live TV if available. The script
endpoint is cached for five minutes, so allow that cache to expire when testing an
upgrade. Confirm `/pausescreen/pausescreen.js` on your server serves the updated
script (including the ES2017 compatibility comment).

`manifest.json` continues to list the latest published release. A local ZIP does
not become a catalog update until its release asset and manifest entry are published.
