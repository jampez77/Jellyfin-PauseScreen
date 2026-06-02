# Jellyfin-PauseScreen

<div align="center">
    <p>
        <img alt="Jellyfin-PauseScreen Logo" src="logo/logo.png" width="450"/>
    </p>
</div>

confirmed working on 10.11.0 

A pause screen for jellyfin that adds the logo and the disc and the description when paused that dissapears when playback is resumed or the video is exited.

## Manifest URL

```
https://raw.githubusercontent.com/jampez77/Jellyfin-PauseScreen/main/manifest.json
```

Basically it is able to pick the items logo and the items plot and then from there also grab the items disc and put them on the screen when paused. It does however have fallbacks so lets say you dont put a disc for every item, thats fine it will go to season and then if there isnt one there it will get the series disc image, same for the logo.. the only thing i didnt do like that is the plot.. because that could go very badly.


<img width="1721" height="869" alt="Screenshot 2026-06-02 at 14 26 12" src="https://github.com/user-attachments/assets/e587a512-b541-433c-9f9e-79f8d45a48e0" />
<img width="1722" height="870" alt="Screenshot 2026-06-02 at 14 26 47" src="https://github.com/user-attachments/assets/5588b268-2c74-4ea6-8fb1-4e80b57cce9d" />
<img width="1720" height="872" alt="Screenshot 2026-06-02 at 14 26 36" src="https://github.com/user-attachments/assets/17e5836c-3c65-48ea-bf8f-6d991e7e8c9b" />
<img width="1724" height="873" alt="Screenshot 2026-06-02 at 14 26 22" src="https://github.com/user-attachments/assets/8dc47df0-2d35-4b92-83bd-6b4bf855e732" />

### With Disc

````css
#overlay-disc {
  position: absolute !important;  
  top: calc(50vh - (26vw / 2)) !important;
  right: 7% !important;
  width: 26vw !important;
  height: auto !important;
  display: block !important;
  animation: 30s linear infinite spin !important;
  z-index: -1 !important;
  filter: brightness(80%) !important;
}

#overlay-plot {
  top: 61% !important;
  max-width: 54% !important;
  height: 50vh !important;
  display: block !important;
  right: 41vw !important;
  position: absolute !important;
  font-size: 21px !important;
}

#overlay-logo {
    position: absolute !important;
    max-width: 50vw !important; /* Max width is half the viewport width */
    max-height: 23vh !important; /* Limits the height */
    width: auto !important; /* Ensures no forced stretching */
    height: auto !important; /* Preserves aspect ratio */
    top: 25vh !important; /* Places it at a quarter of the viewport height */
    left: 19vw !important; /* Centers within the left half */
    transform: translateX(-50%) !important; /* Ensures true centering */
    display: block !important;
	margin-left: 12vw !important;
    object-fit: contain; /* Prevents cropping/stretching */
}
````

however some people say they DO NOT want the disc because it is "too large" or "too ugly" then you just need to add this version of the custom css

### Discless

````css
#overlay-disc {
  position: absolute !important;  
  top: calc(50vh - (26vw / 2)) !important;
  right: 7% !important;
  width: 26vw !important;
  height: auto !important;
  display: none !important;
  animation: 30s linear infinite spin !important;
  z-index: -1 !important;
  filter: brightness(80%) !important;
}

#overlay-plot {
  top: 61% !important;
  max-width: 54% !important;
  height: 50vh !important;
  display: block !important;
  right: 41vw !important;
  position: absolute !important;
  font-size: 21px !important;
  pointer-events: none;
}

#overlay-logo {
    position: absolute !important;
    pointer-events: none;
    max-width: 50vw !important; /* Max width is half the viewport width */
    max-height: 23vh !important; /* Limits the height */
    width: auto !important; /* Ensures no forced stretching */
    height: auto !important; /* Preserves aspect ratio */
    top: 25vh !important; /* Places it at a quarter of the viewport height */
    left: 19vw !important; /* Centers within the left half */
    transform: translateX(-50%) !important; /* Ensures true centering */
    display: block !important;
	margin-left: 12vw !important;
    object-fit: contain; /* Prevents cropping/stretching */
}

#overlay-details {
  pointer-events: none;
}
````

FAQ:

it doesnt show up wth?
okay so im going to slowly explain this to you you need to do two things clear the cache and then play any item in the server and reload normally and it will just work.

to clear your cache just disable cache in the dev menu right click anywhere on your servers main page > inspect > network tab > far right there is a check box that says disable caching.. check the box

then play any content... any content at all

go back to the main page and press f5 


## How to get disc art

okay so you can either get it manually by scanning your own and uploading them in the edit images tab.. yawn or you can change the "fetcher settings" in the library you want disc images for then check their collection for it (check disc inside the settings for each library you have in fetcher settings)

then search for missing metadata if there are ones that still dont have them you can manually search for them now.
