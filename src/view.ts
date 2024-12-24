import type { AppState } from "./index";
import { viewModal } from "./shitcode/searchModal";
import { viewQuickSearch } from "./shitcode/quickSearch";
import { getPathToParent, isRoot, Item } from "./tree/tree";
import {
    ctx,
    fillCircleAtCenter,
    fillSquareAtCenter,
    setFont,
    view,
} from "./utils/canvas";
import { lerp } from "./utils/math";
import { drawFooter } from "./footer";

export const typography = {
    font: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
     "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
     sans-serif`,
    font2: "monospace",

    lineHeight: 1.3,

    focusLevelFontSize: 20,
    focusWeight: 800,

    fontSize: 12,
    fontWeight: 400,
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

    videoItemStripe: "rgb(160, 10, 10)",
    playlistItemStripe: "rgb(10, 160, 10)",
    channelItemStripe: "rgb(40, 40, 200)",

    //modal
    modalBg: "#1c1c1c",

    //footer
    playFooterText: "rgb(80, 180, 80)",
    pauseFooterText: "rgb(220, 100, 100)",
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
            level == -1 ? typography.focusLevelFontSize : typography.fontSize;

        const weight =
            level == -1 ? typography.focusWeight : typography.fontWeight;

        setFont(fontSize, weight);

        const ms = ctx.measureText("f");
        const height = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

        y += (height * typography.lineHeight) / 2;

        state.views.push({
            item,
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
    // ctx.fillStyle = colors.bg;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

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
        const { x, y, fontSize, fontWeight, item } = state.views[i];

        let rightLabel = "";

        if (item.remoteTotalItemsCount && item.remoteLoadedItemsCount) {
            rightLabel =
                `${item.remoteLoadedItemsCount} / ${item.remoteTotalItemsCount}  ` +
                rightLabel;
        }

        if (item.channelTitle) {
            rightLabel += " " + item.channelTitle;
        }

        setFont(typography.fontSize, typography.fontWeight);

        if (rightLabel.length > 0) {
            ctx.textAlign = "right";
            ctx.fillStyle = colors.footerText;
            ctx.fillText(rightLabel, view.x - 10, y);
        }

        setFont(fontSize, fontWeight);
        ctx.fillStyle = colors.text;
        ctx.textAlign = "left";
        ctx.fillText(item.title, x, y);

        if (item.videoId || item.channelId || item.playlistId) {
            const m2 = ctx.measureText("f");
            const h = m2.fontBoundingBoxAscent + m2.fontBoundingBoxDescent;
            const cursorHeight = h * typography.lineHeight;
            ctx.fillStyle = getItemTypeColor(item);
            const cursorY = y - (h * typography.lineHeight) / 2;
            ctx.fillRect(0, cursorY, 2, cursorHeight);
            ctx.fillRect(0, cursorY, 2, cursorHeight);
        }

        if (item.children.length > 0 && !item.isOpen && item != state.focused) {
            const iconSize = 3;
            ctx.fillStyle = colors.nonEmptyClosedIcon;
            fillSquareAtCenter(x - 7, y, iconSize);
        }

        if (item.isLoading) {
            ctx.fillStyle = getItemTypeColor(item);
            fillCircleAtCenter(x - 7, y, 2);
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

function getItemTypeColor(item: Item) {
    if (item.videoId) return colors.videoItemStripe;
    else if (item.playlistId) return colors.playlistItemStripe;
    else if (item.channelId) return colors.channelItemStripe;
    return "white";
}
