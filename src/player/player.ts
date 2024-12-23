import { state } from "../index";
import { show } from "../view";
import {
    formatTime,
    formatTimeOmitHour,
    getPlayerProgressState,
    youtubeIframeId,
} from "./youtubePlayer";

export function createPlayerElem() {
    const playerContainer = document.createElement("div");
    playerContainer.id = youtubeIframeId;
    Object.assign(playerContainer.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        height: "250px",
        width: "600px",
    });
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
            state.playerTimeLabel = `(+${loadedSeconds}s) ${fm(info.currentTime)} / ${fm(info.duration)}`;
            show(state);
        }
    }
});
