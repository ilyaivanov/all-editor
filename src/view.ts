import type { AppState } from "./index";
import { viewModal } from "./shitcode/searchModal";
import { viewQuickSearch } from "./shitcode/quickSearch";
import { getPathToParent, isRoot, Item } from "./tree/tree";
import { ctx, fillSquareAtCenter, setFont, view } from "./utils/canvas";
import { lerp } from "./utils/math";

export const typography = {
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
     "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
     sans-serif`,
    font2: "monospace",

    lineHeight: 1.3,

    focusLevelFontSize: 20,
    focusWeight: 800,

    firstLevelFontSize: 14,
    weightFirstLevel: 600,

    otherLevelFontSize: 12,
    weightOtherLevel: 400,
};

export const spacings = {
    footerHeight: 20,
};

export const colors = {
    bg: "#0c0c0c",
    footerBg: "#2c2c2c",
    text: "#e0e0e0",
    footerText: "#a0a0a0",
    footerTextFocus: "#e0e0e0",
    selectionBg: "#252525",
    scrollbar: "#204040",

    nonEmptyClosedIcon: "#968037",

    cursorNormalMode: "rgb(20, 200, 20)",
    cursorInsertMode: "rgb(200, 20, 20)",

    //modal
    modalBg: "#1c1c1c",
};
export type View = {
    x: number;
    y: number;
    item: Item;
    fontSize: number;
    fontWeight: number;
    level: number;
};

export function buildViews(state: AppState) {
    state.views.splice(0);

    const left = 20;
    const top = 10;
    const step = 20;

    let initialLevel = isRoot(state.focused) ? 0 : -1;
    let initialItems = isRoot(state.focused)
        ? [...state.focused.children]
        : [state.focused];
    const stack = initialItems
        .map((item) => ({ item, level: initialLevel }))
        .reverse();

    let y = top;

    while (stack.length > 0) {
        const { item, level } = stack.pop()!;

        const lineX = left + Math.max(level, 0) * step;

        const fontSize =
            level == -1
                ? typography.focusLevelFontSize
                : level == 0
                  ? typography.firstLevelFontSize
                  : typography.otherLevelFontSize;

        const weight =
            level == -1
                ? typography.focusWeight
                : level == 0
                  ? typography.weightFirstLevel
                  : typography.weightOtherLevel;

        setFont(fontSize, weight);

        const ms = ctx.measureText("f");
        const height = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

        y += (height * typography.lineHeight) / 2;

        state.views.push({
            item,
            level,
            fontSize,
            fontWeight: weight,
            x: lineX,
            y,
        });

        if (item.isOpen || state.focused == item)
            stack.push(
                ...item.children
                    .map((item) => ({ item, level: level + 1 }))
                    .reverse()
            );

        y += (height * typography.lineHeight) / 2;
    }

    state.pageHeight = y + top;
}

export function show(state: AppState) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();

    ctx.translate(0, -state.scrollOffset);

    const { position, mode } = state;

    for (let i = 0; i < state.views.length; i++) {
        if (state.views[i].item == state.selectedItem) {
            const { x, y, fontSize, fontWeight, item } = state.views[i];
            setFont(fontSize, fontWeight);

            const m2 = ctx.measureText(item.title.slice(0, position));
            const h = m2.fontBoundingBoxAscent + m2.fontBoundingBoxDescent;
            const cursorX = x + m2.width;

            const cursorHeight = h * typography.lineHeight;
            const cursorY = y - (h * typography.lineHeight) / 2;

            ctx.fillStyle = colors.selectionBg;
            ctx.fillRect(0, cursorY, view.x, cursorHeight);

            if (mode == "normal") ctx.fillStyle = colors.cursorNormalMode;
            else ctx.fillStyle = colors.cursorInsertMode;

            ctx.fillRect(cursorX - 0.5, cursorY, 1, cursorHeight);
        }
    }

    ctx.textBaseline = "middle";
    for (let i = 0; i < state.views.length; i++) {
        const { x, y, fontSize, fontWeight, item, level } = state.views[i];
        setFont(fontSize, fontWeight);

        ctx.fillStyle = colors.text;
        ctx.fillText(item.title, x, y);

        if (item.children.length > 0 && !item.isOpen && item != state.focused) {
            const iconSize = level == 0 ? 3 : 2;
            ctx.fillStyle = colors.nonEmptyClosedIcon;
            fillSquareAtCenter(x - 7, y, iconSize);
        }
    }

    ctx.restore();

    drawScrollBar(state);

    drawFooter(state);

    viewModal(state);

    viewQuickSearch(state);
}

function drawScrollBar(state: AppState) {
    const { drawableCanvasHeight, pageHeight, scrollOffset } = state;

    if (pageHeight > drawableCanvasHeight) {
        const scrollWidth = 8;
        const scrollHeight =
            (drawableCanvasHeight * drawableCanvasHeight) / pageHeight;
        const maxOffset = pageHeight - drawableCanvasHeight;
        const maxScrollY = drawableCanvasHeight - scrollHeight;
        const scrollY = lerp(0, maxScrollY, scrollOffset / maxOffset);

        ctx.fillStyle = colors.scrollbar;
        ctx.fillRect(view.x - scrollWidth, scrollY, scrollWidth, scrollHeight);
    }
}

function drawFooter(state: AppState) {
    ctx.fillStyle = colors.footerBg;
    const height = spacings.footerHeight;
    ctx.fillRect(0, view.y - height, view.x, height);

    ctx.fillStyle = colors.footerText;
    ctx.textBaseline = "middle";
    setFont(13);

    const path = getPathToParent(state.focused)
        .reverse()
        .map((i) => i.title);

    path.splice(path.length - 1, 1);

    let msg = path.join(" / ") + " / ";

    if (path.length > 0) msg = " / " + msg;

    const width = ctx.measureText(msg).width;
    const footerTextLeft = 10;
    ctx.fillText(msg, footerTextLeft, view.y - spacings.footerHeight / 2);

    ctx.fillStyle = colors.footerTextFocus;

    if (!isRoot(state.focused))
        ctx.fillText(
            state.focused.title,
            footerTextLeft + width,
            view.y - spacings.footerHeight / 2
        );
}
