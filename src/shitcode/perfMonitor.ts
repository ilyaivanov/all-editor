import { ctx, setFontMonospace, view } from "../utils/canvas";

const width = 400;
const barWidth = 2;

const maxEntries = Math.floor(width / barWidth);
const greenValues: number[] = [];
const redValues: number[] = [];
export function addEntry(red: number, green = 0) {
    if (redValues.length > maxEntries) {
        redValues.shift();
    }
    redValues.push(red);

    if (greenValues.length > maxEntries) {
        greenValues.shift();
    }
    greenValues.push(green);
}

export function drawPerformance() {
    ctx.fillStyle = "white";
    const height = 120;
    const padding = 20;
    let x = view.x - padding - width;
    let y = padding;
    ctx.fillRect(view.x - padding - width, padding, width, height);

    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    setFontMonospace(12);
    let max = 0;
    for (let i = 0; i < redValues.length; i++) {
        const t = redValues[i] + greenValues[i];
        if (max < t) max = t;
    }
    max = Math.ceil(max);
    ctx.fillText(`${max}ms ${((1 / max) * 1000).toFixed(0)}FPS`, x + 5, y + 12);
    ctx.fillRect(x, y + 12, 6, 2);

    const maxBarHeightInPixels = height - 12;
    for (let i = 0; i < redValues.length; i++) {
        const green = greenValues[i];
        const red = redValues[i];

        const redHeight = (red / max) * maxBarHeightInPixels;
        const greenHeight = (green / max) * maxBarHeightInPixels;

        const barX = x + width - barWidth * (redValues.length - i);
        const barY = y + height - redHeight;

        ctx.fillStyle = "rgb(100, 20, 20)";

        ctx.fillRect(barX, barY - greenHeight, barWidth, redHeight);

        ctx.fillStyle = "rgb(20, 80, 20)";

        ctx.fillRect(barX, y + height - greenHeight, barWidth, greenHeight);
    }
}
