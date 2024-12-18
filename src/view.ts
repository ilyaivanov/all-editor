import type { AppState, V2 } from ".";
import { ctx, view } from "./canvas";

const typography = {
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
     "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
     sans-serif`,
    font2: "monospace",

    lineHeight: 1.3,

    weightFirstLevel: "600",
    weightOtherLevel: "400",
    firstLevelFontSize: 14,
    otherLevelFontSize: 12,
};

const colors = {
    bg: "#0c0c0c",
    text: "#e0e0e0",
    cursorNormalMode: "rgb(20, 200, 20)",
    cursorInsertMode: "rgb(200, 20, 20)",
};

export function show(state: AppState) {
    const { root, position, mode, selectedItem } = state;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.textBaseline = "top";

    const left = 20;
    const top = 20;
    const step = 20;

    const stack = [...root.children]
        .map((item) => ({ item, level: 0 }))
        .reverse();

    let x = left;
    let y = top;
    while (stack.length > 0) {
        const { item, level } = stack.pop()!;
        const lineY = y;
        const lineX = left + level * step;

        const fontSize =
            level == 0
                ? typography.firstLevelFontSize
                : typography.otherLevelFontSize;

        const weight =
            level == 0
                ? typography.weightFirstLevel
                : typography.weightOtherLevel;

        ctx.font = `${weight} ${fontSize}px ${typography.font}`;

        const ms = ctx.measureText("f");
        const height = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
        const lineHeight = typography.lineHeight;

        if (selectedItem == item) {
            const m2 = ctx.measureText(item.title.slice(0, position));
            const h = m2.fontBoundingBoxAscent + m2.fontBoundingBoxDescent;
            const cursorX = lineX + m2.width;

            const cursorHeight = h * lineHeight;
            const cursorY = lineY - h * lineHeight * 0.2;

            ctx.fillStyle = "#252525";
            ctx.fillRect(0, cursorY, view.x, cursorHeight);

            if (mode == "normal") ctx.fillStyle = colors.cursorNormalMode;
            else ctx.fillStyle = colors.cursorInsertMode;

            ctx.fillRect(cursorX - 0.5, cursorY, 1, cursorHeight);
        }

        ctx.fillStyle = colors.text;
        ctx.fillText(item.title, lineX, lineY);

        if (item.isOpen)
            stack.push(
                ...item.children
                    .map((item) => ({ item, level: level + 1 }))
                    .reverse()
            );

        y += height * lineHeight;
    }
}
