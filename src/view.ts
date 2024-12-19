import type { AppState, V2 } from ".";
import { Item } from "./tree/tree";
import { ctx, view } from "./utils/canvas";
import { lerp } from "./utils/math";

export const typography = {
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
     "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
     sans-serif`,
    font2: "monospace",

    lineHeight: 1.3,

    weightFirstLevel: 600,
    weightOtherLevel: 400,
    firstLevelFontSize: 14,
    otherLevelFontSize: 12,
};

const colors = {
    bg: "#0c0c0c",
    text: "#e0e0e0",
    selectionBg: "#252525",
    scrollbar: "#204040",

    cursorNormalMode: "rgb(20, 200, 20)",
    cursorInsertMode: "rgb(200, 20, 20)",
};
export type View = {
    x: number;
    y: number;
    item: Item;
    fontSize: number;
    fontWeight: number;
};

export function buildViews(state: AppState) {
    state.views.splice(0);

    const left = 20;
    const top = 20;
    const step = 20;

    const stack = [...state.root.children]
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

        state.views.push({
            x: lineX,
            y: lineY,
            fontSize,
            fontWeight: weight,
            item,
        });

        if (item.isOpen)
            stack.push(
                ...item.children
                    .map((item) => ({ item, level: level + 1 }))
                    .reverse()
            );

        y += height * typography.lineHeight;
    }

    state.pageHeight = y + top / 2;
}

export function show(state: AppState) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();

    ctx.translate(0, -state.scrollOffset);

    const { root, position, mode, selectedItem } = state;

    ctx.textBaseline = "top";

    for (let i = 0; i < state.views.length; i++) {
        if (state.views[i].item == state.selectedItem) {
            const { x, y, fontSize, fontWeight, item } = state.views[i];
            ctx.font = `${fontWeight} ${fontSize}px ${typography.font}`;

            const m2 = ctx.measureText(item.title.slice(0, position));
            const h = m2.fontBoundingBoxAscent + m2.fontBoundingBoxDescent;
            const cursorX = x + m2.width;

            const cursorHeight = h * typography.lineHeight;
            const cursorY = y - h * typography.lineHeight * 0.2;

            ctx.fillStyle = colors.selectionBg;
            ctx.fillRect(0, cursorY, view.x, cursorHeight);

            if (mode == "normal") ctx.fillStyle = colors.cursorNormalMode;
            else ctx.fillStyle = colors.cursorInsertMode;

            ctx.fillRect(cursorX - 0.5, cursorY, 1, cursorHeight);
        }
    }

    for (let i = 0; i < state.views.length; i++) {
        const { x, y, fontSize, fontWeight, item } = state.views[i];
        ctx.font = `${fontWeight} ${fontSize}px ${typography.font}`;

        ctx.fillStyle = colors.text;
        ctx.fillText(item.title, x, y);
    }

    ctx.restore();

    drawScrollBar(state);

    // const left = 20;
    // const top = 20;
    // const step = 20;

    // const stack = [...root.children]
    //     .map((item) => ({ item, level: 0 }))
    //     .reverse();

    // let x = left;
    // let y = top;

    // while (stack.length > 0) {
    //     const { item, level } = stack.pop()!;
    //     const lineY = y;
    //     const lineX = left + level * step;

    //     const fontSize =
    //         level == 0
    //             ? typography.firstLevelFontSize
    //             : typography.otherLevelFontSize;

    //     const weight =
    //         level == 0
    //             ? typography.weightFirstLevel
    //             : typography.weightOtherLevel;

    //     ctx.font = `${weight} ${fontSize}px ${typography.font}`;

    //     const ms = ctx.measureText("f");
    //     const height = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
    //     const lineHeight = typography.lineHeight;

    //     // if (selectedItem == item) {
    //     //     const m2 = ctx.measureText(item.title.slice(0, position));
    //     //     const h = m2.fontBoundingBoxAscent + m2.fontBoundingBoxDescent;
    //     //     const cursorX = lineX + m2.width;

    //     //     const cursorHeight = h * lineHeight;
    //     //     const cursorY = lineY - h * lineHeight * 0.2;

    //     //     ctx.fillStyle = colors.selectionBg;
    //     //     ctx.fillRect(0, cursorY, view.x, cursorHeight);

    //     //     if (mode == "normal") ctx.fillStyle = colors.cursorNormalMode;
    //     //     else ctx.fillStyle = colors.cursorInsertMode;

    //     //     ctx.fillRect(cursorX - 0.5, cursorY, 1, cursorHeight);
    //     // }

    //     ctx.fillStyle = colors.text;
    //     ctx.fillText(item.title, lineX, lineY);

    //     if (item.isOpen)
    //         stack.push(
    //             ...item.children
    //                 .map((item) => ({ item, level: level + 1 }))
    //                 .reverse()
    //         );

    //     y += height * lineHeight;
    // }
    // state.pageHeight = y + top / 2;
}

function drawScrollBar(state: AppState) {
    const { pageHeight, scrollOffset } = state;
    const height = view.y;
    const width = view.x;
    if (pageHeight > height) {
        const scrollWidth = 8;
        const scrollHeight = (height * height) / pageHeight;
        const maxOffset = pageHeight - height;
        const maxScrollY = height - scrollHeight;
        const scrollY = lerp(0, maxScrollY, scrollOffset / maxOffset);

        ctx.fillStyle = colors.scrollbar;
        ctx.fillRect(width - scrollWidth, scrollY, scrollWidth, scrollHeight);
    }
}
