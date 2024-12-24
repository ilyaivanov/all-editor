import { state } from "./../index";
import { spacings, typography } from "../view";

export const canvas = document.createElement("canvas");
export const ctx = canvas.getContext("2d")!;

let scale = 0;
export const view = { x: 0, y: 0 };

export function onResize() {
    scale = window.devicePixelRatio || 1;
    ctx.imageSmoothingEnabled = false;

    view.x = window.innerWidth;
    view.y = window.innerHeight;

    canvas.style.width = view.x + "px";
    canvas.style.height = view.y + "px";

    canvas.width = view.x * scale;
    canvas.height = view.y * scale;

    ctx.scale(scale, scale);

    //TODO this doesn't belong here
    state.drawableCanvasHeight = view.y - spacings.footerHeight;
}

export function setFont(size: number, weight = 400) {
    ctx.font = `${weight} ${size}px ${typography.font}`;
}
export function setFontMonospace(size: number, weight = 400) {
    ctx.font = `${weight} ${size}px monospace`;
}

export function fillSquareAtCenter(x: number, y: number, size: number) {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
}
export function fillCircleAtCenter(x: number, y: number, r: number) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}
