(function() {
    let currentVideo = null;
    let currentItemId = null;
    let currentType = null; // "item" | "channel"
    let userId = null;
    let token = null;
    let cleanupListeners = null;
    let renderGeneration = 0;

    // ---------------- UI SETUP (UNCHANGED) ----------------

    const overlay = document.createElement("div");
    overlay.id = "video-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 0;
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
    `;

    const overlayContent = document.createElement("div");
    overlayContent.style.cssText = "display: flex; align-items: center; justify-content: center; text-align: center; padding: 2vw;";

    const overlayLogo = document.createElement("img");
    overlayLogo.style.cssText = "width: 50vw; height: auto; margin-right: 50vw; display: none;";

    const overlayPlot = document.createElement("div");

    const overlayDetails = document.createElement("div");
    overlayDetails.style.cssText = "position: absolute; top: 55%; left: 19vw; margin-left: 12vw; transform: translateX(-50%); width: 50vw; font-size: 22px; font-weight: bold; display: flex; justify-content: center; gap: 30px;";

    overlayContent.appendChild(overlayLogo);
    overlayContent.appendChild(overlayPlot);
    overlay.appendChild(overlayContent);
    overlay.appendChild(overlayDetails);

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.style.display = "none";
            currentVideo?.paused && currentVideo.play();
        }
    });

    // ---------------- AUTH ----------------

    const getCredentials = () => {
        const creds = localStorage.getItem("jellyfin_credentials");
        if (!creds) return null;

        try {
            const parsed = JSON.parse(creds);
            const server = parsed.Servers[0];
            return { token: server.AccessToken, userId: server.UserId };
        } catch {
            return null;
        }
    };

    // ---------------- HELPERS ----------------

    const clearDisplay = () => {
        overlayPlot.textContent = "";
        overlayDetails.innerHTML = "";
        overlayLogo.src = "";
        overlayLogo.style.display = "none";
    };

    const api = async (path) => {
        const res = await fetch(`${window.location.origin}${path}`, {
            headers: { "X-Emby-Token": token }
        });
        return res.ok ? res.json() : null;
    };

    const resolveLogo = async (entity) => {
        const base = window.location.origin;

        const isChannel = entity.Number !== undefined || entity.Type === "TvChannel";

        const urls = isChannel
            ? [
                `${base}/Items/${entity.Id}/Images/Primary`,
                `${base}/Items/${entity.Id}/Images/Logo`,
                `${base}/Items/${entity.Id}/Images/Thumb`
            ]
            : [
                `${base}/Items/${entity.Id}/Images/Logo`,
                `${base}/Items/${entity.Id}/Images/Primary`,
                entity.SeriesId ? `${base}/Items/${entity.SeriesId}/Images/Logo` : null,
                entity.ParentId ? `${base}/Items/${entity.ParentId}/Images/Logo` : null,
                entity.SeriesId ? `${base}/Items/${entity.SeriesId}/Images/Thumb` : null,
                entity.ParentId ? `${base}/Items/${entity.ParentId}/Images/Thumb` : null,

            ].filter(Boolean);

        for (const url of urls) {
            try {
                const img = new Image();
                img.src = url;

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(reject, 800);
                });

                return url;
            } catch {
                continue;
            }
        }

        return null;
    };

    // ---------------- LIVE TV RESOLUTION ----------------

    const getSessionNowPlaying = async () => {
        const sessions = await api("/Sessions");
        if (!sessions) return null;

        const session = sessions.find(s => s.NowPlayingItem);
        return session?.NowPlayingItem || null;
    };

    const getChannelFromItem = async (item) => {
        if (!item?.ChannelId && item?.Type !== "TvChannel") return null;

        const channels = await api("/LiveTv/Channels");
        return channels?.Items?.find(c =>
            c.Id === item.ChannelId || c.Id === item.Id
        ) || null;
    };

    const getCurrentProgram = async (channelId) => {
        const data = await api(
            `/LiveTv/Programs?ChannelIds=${channelId}&IsAiring=true&Fields=Name,Overview,ShortOverview,Description,StartDate,EndDate`
        );

        return data?.Items?.[0] || null;
    };

    // ---------------- ITEM RENDER ----------------

    const renderItem = async (item) => {
        currentType = "item";
        currentItemId = item.Id;

        const isEpisode = item.Type === "Episode";

        const title = item.SeriesName || item.Name || "Unknown Title";

        const episodeTitle = item.Name || "";

        const season = item.ParentIndexNumber ?? item.SeasonNumber;
        const episode = item.IndexNumber ?? item.EpisodeNumber;

        const year = item.ProductionYear;
        const rating = item.OfficialRating;

        const synopsis =
            item.Overview ||
            item.ShortOverview ||
            item.Taglines?.[0] ||
            "";

        // ---------------- LEFT COLUMN ----------------

        const finalLogo = await resolveLogo(item);

        const leftMeta = isEpisode
            ? `${season != null && episode != null ? `S${season}E${episode}` : ""}`
            : `${year ? year + " • " : ""}${rating || ""}`;

        const left = `
            <div style="
                width: 28%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
                <img src="${finalLogo}" style="
                    width: 160px;
                    height: auto;
                    margin-bottom: 20px;
                "/>

                <div style="
                    font-size: 22px;
                    text-align: center;
                    opacity: 0.9;
                ">
                    ${leftMeta}
                </div>
            </div>
        `;

        // ---------------- RIGHT COLUMN ----------------
        const mainTitle = isEpisode ? (item.SeriesName || title) : title;

        const subtitle = isEpisode
            ? `${season != null && episode != null ? `S${season}E${episode} • ` : ""}${episodeTitle}`
            : (year ? `Released ${year}` : "");

        const right = `
            <div style="
                width: 72%;
                padding-left: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            ">
                <div style="
                    font-size: 34px;
                    font-weight: 600;
                    margin-bottom: 10px;
                ">
                    ${mainTitle}
                </div>

                <div style="
                    font-size: 20px;
                    opacity: 0.85;
                    margin-bottom: 20px;
                ">
                    ${subtitle}
                </div>

                <div style="
                    font-size: 16px;
                    opacity: 0.8;
                    line-height: 1.5;
                    max-width: 90%;
                ">
                    ${synopsis || ""}
                </div>
            </div>
        `;

        // ---------------- FINAL LAYOUT ----------------
        overlayPlot.innerHTML = `
            <div style="
                display: flex;
                width: 100%;
                height: 100%;
                align-items: center;
            ">
                ${left}
                ${right}
            </div>
        `;

        overlayDetails.innerHTML = "";
    };

    // ---------------- CHANNEL RENDER ----------------

    const renderChannel = async (channel) => {
        const program = await getCurrentProgram(channel.Id);

        const channelName = channel.Name || "Live TV";

        const seriesName = program?.SeriesName || program?.Name || "";
        const episodeTitle = program?.Name || "";

        const season = program?.ParentIndexNumber ?? program?.SeasonNumber;
        const episode = program?.IndexNumber ?? program?.EpisodeNumber;

        const synopsis =
            program?.Overview ||
            program?.ShortOverview ||
            program?.Description ||
            "";

        // ---------------- LEFT COLUMN (CHANNEL) ----------------
        const finalLogo = await resolveLogo(channel);

        const left = `
            <div style="
                width: 28%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
                <img src="${finalLogo}" style="
                    width: 160px;
                    height: auto;
                    margin-bottom: 20px;
                "/>

                <div style="
                    font-size: 22px;
                    text-align: center;
                    opacity: 0.9;
                ">
                    ${channel.Number ? channel.Number + " • " : ""}${channelName}
                </div>
            </div>
        `;

        // ---------------- RIGHT COLUMN (PROGRAM) ----------------
        let subtitle = "";

        if (seriesName) {
            subtitle = seriesName;

            if (season != null && episode != null) {
                subtitle += ` — S${season}E${episode}`;
            }

            if (episodeTitle && episodeTitle !== seriesName) {
                subtitle += ` • ${episodeTitle}`;
            }
        } else {
            subtitle = episodeTitle || channelName;
        }

        const right = `
            <div style="
                width: 72%;
                padding-left: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            ">
                <div style="
                    font-size: 34px;
                    font-weight: 600;
                    margin-bottom: 10px;
                ">
                    ${seriesName}
                </div>

                <div style="
                    font-size: 20px;
                    opacity: 0.85;
                    margin-bottom: 20px;
                ">
                    ${subtitle}
                </div>

                <div style="
                    font-size: 16px;
                    opacity: 0.8;
                    line-height: 1.5;
                    max-width: 90%;
                ">
                    ${synopsis || ""}
                </div>
            </div>
        `;

        // ---------------- FINAL LAYOUT ----------------
        overlayPlot.innerHTML = `
            <div style="
                display: flex;
                width: 100%;
                height: 100%;
                align-items: center;
            ">
                ${left}
                ${right}
            </div>
        `;
    };

    // ---------------- CORE RESOLUTION ----------------

    const safeRender = async () => {
        try {
            await resolveAndRender();
        } catch (e) {
            console.warn("Fatal render error", e);
            clearState(); // <-- this is what fixes "stuck overlay"
        }
    };

    const resolveAndRender = async () => {
        const gen = ++renderGeneration;

        try {
            const nowPlaying = await getSessionNowPlaying();

            // If a newer render started, abort
            if (gen !== renderGeneration) return;

            if (!nowPlaying) {
                clearState();
                return;
            }

            if (nowPlaying.Type === "TvChannel" || nowPlaying.ChannelId) {
                const channel = await getChannelFromItem(nowPlaying);
                if (!channel) {
                    clearState();
                    return;
                }

                const program = await getCurrentProgram(channel.Id);

                if (gen !== renderGeneration) return;

                await renderChannel(channel, program);
                return;
            }

            const item = await api(`/Items/${nowPlaying.Id}`);
            if (gen !== renderGeneration) return;

            if (item) await renderItem(item);

        } catch (e) {
            console.warn("Render failed", e);
            clearState();
        }
    };

    // ---------------- VIDEO HOOK ----------------

    const attachVideoListeners = (video) => {
        const onPause = () => {
            overlay.style.display = "flex";
            safeRender();
        };

        const onPlay = () => {
            overlay.style.display = "none";
        };

        video.addEventListener("pause", onPause);
        video.addEventListener("play", onPlay);

        return () => {
            video.removeEventListener("pause", onPause);
            video.removeEventListener("play", onPlay);
        };
    };

    // ---------------- ROUTE CHANGE DETECTION ----------------

    let lastUrl = location.href;

    const watchRouteChange = () => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            clearState();
        }
        requestAnimationFrame(watchRouteChange);
    };

    const clearState = () => {
        overlay.style.display = "none";

        overlayPlot.textContent = "";
        overlayDetails.innerHTML = "";
        overlayLogo.src = "";
        overlayLogo.style.display = "none";

        currentItemId = null;
        currentType = null;
        currentVideo = null;
    };

    // ---------------- LOOP ----------------

    const scanLoop = () => {
        const video = document.querySelector(".videoPlayerContainer video");

        // NEW: if video disappears, always reset
        if (!video && currentVideo) {
            clearState();
            currentVideo = null;
            currentItemId = null;
        }

        if (video && video !== currentVideo) {
            currentVideo = video;

            cleanupListeners?.();
            cleanupListeners = attachVideoListeners(video);

            safeRender();
        }

        requestAnimationFrame(scanLoop);
    };

    // ---------------- INIT ----------------

    const creds = getCredentials();
    if (!creds) {
        console.error("Jellyfin credentials not found");
        return;
    }

    userId = creds.userId;
    token = creds.token;

    requestAnimationFrame(scanLoop);
})();