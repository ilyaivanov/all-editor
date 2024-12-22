import { youtubeIframeId } from "./youtubePlayer";

export function createPlayerElem() {
    const playerContainer = document.createElement("div");
    playerContainer.id = youtubeIframeId;
    Object.assign(playerContainer.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        height: "300px",
        width: "600px",
    });
    return playerContainer;
}
