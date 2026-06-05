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
