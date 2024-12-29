import { state } from "../index";
import { show } from "../view";
import {
    formatTime,
    formatTimeOmitHour,
    getPlayerProgressState,
    getVolume,
    youtubeIframeId,
} from "./youtubePlayer";

export function createPlayerElem() {
    const playerContainer = document.createElement("div");
    playerContainer.id = youtubeIframeId;

    Object.assign(playerContainer.style, {
        position: "fixed",
        filter: "brightness(100%)",
    });
    setPlayerClass(playerContainer, state.playerMode);

    return playerContainer;
}

document.addEventListener("video-progress", () => {
    const info = getPlayerProgressState();
    if (info.duration > 0) {
        const time = Math.floor(info.currentTime);
        if (state.playerTimeSeconds != time) {
            const oneHour = 60 * 60;
            const fm =
                info.duration >= oneHour ? formatTime : formatTimeOmitHour;
            const loadedSeconds = Math.floor(
                info.loadedFraction * info.duration - info.currentTime
            );

            state.playerTimeSeconds = time;
            state.playerTimeLabel = `(${getVolume().toFixed(0)}vol) (+${loadedSeconds}s) ${fm(info.currentTime)} / ${fm(info.duration)}`;
            show(state);
        }
    }
});

export function hideVideo() {
    const playerContainer = document.getElementById(youtubeIframeId);
    if (playerContainer) {
        playerContainer.style.display = "none";
    }
}

export function showVideo() {
    const playerContainer = document.getElementById(youtubeIframeId);
    if (playerContainer) playerContainer.style.removeProperty("display");
}

export function onBrightnessChanged(val: number) {
    const playerContainer = document.getElementById(youtubeIframeId);
    if (playerContainer) {
        playerContainer.style.opacity = val.toFixed(2);
    }
}

export type PlayerMode = "fullscreen" | "small";
export function onPlayerModeChanged(mode: PlayerMode) {
    const playerContainer = document.getElementById(youtubeIframeId);
    if (!playerContainer) return;

    setPlayerClass(playerContainer, mode);
}

function setPlayerClass(elem: HTMLElement, mode: PlayerMode) {
    const isFullscreen = mode == "fullscreen";
    elem.classList.toggle("small-player", !isFullscreen);
    elem.classList.toggle("fullscreen-player", isFullscreen);
}
