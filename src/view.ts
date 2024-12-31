import type { AppState } from "./index";
import { viewModal } from "./shitcode/searchModal";
import { viewQuickSearch } from "./shitcode/quickSearch";
import { isRoot, Item } from "./tree/tree";
import {
    ctx,
    fillCircleAtCenter,
    fillSquareAtCenter,
    setFont,
    setFontMonospace,
    view,
} from "./utils/canvas";
import { lerp } from "./utils/math";
import { drawFooter } from "./footer";
import { showFontOptions } from "./fontOptions";
import { colors, typography } from "./consts";
import { buildParagraph, Paragraph } from "./paragraph";
import { drawItemBg, drawSelection } from "./shitcode/drawSelection";

export type View = {
    x: number;
    y: number;
    item: Item;
    paragraph: Paragraph;
    fontSize: number;
    fontWeight: number;
    itemHeight: number;
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

        let lineX = left + Math.max(level, 0) * step;

        // if (item.bullet) {
        //TODO: instead of hardcoded value I need to measure all bullets of siblings
        // lineX += 35;
        // }

        let fontSize =
            (item.fontSize || typography.fontSize) + typography.fontDelta;

        if (level == -1) {
            fontSize = typography.focusLevelFontSize;
        }

        let weight = item.fontWeight || typography.fontWeight;
        if (level == -1) {
            weight = typography.focusWeight;
        }

        setFont(fontSize, weight);

        const ms = ctx.measureText("f");
        const height = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;

        const paragraph = buildParagraph(item, view.x - lineX - left);

        const itemHeight = height * typography.lineHeight;
        state.views.push({
            item,
            fontSize,
            fontWeight: weight,
            x: lineX,
            y: y + itemHeight / 2,
            itemHeight,
            paragraph,
        });

        if (item.isOpen || state.focused == item)
            stack.push(
                ...item.children
                    .map((item) => ({ item, level: level + 1 }))
                    .reverse()
            );

        y += paragraph.totalHeight + typography.extraSpaceBetweenItems;
    }

    state.pageHeight = y + top;
}

export function show(state: AppState) {
    // ctx.fillStyle = colors.bg;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();

    ctx.translate(0, -state.scrollOffset);

    for (let i = 0; i < state.views.length; i++) {
        if (state.views[i].item == state.selectedItem) {
            drawSelection(state, state.views[i]);
        }
    }

    ctx.textBaseline = "middle";
    for (let i = 0; i < state.views.length; i++) {
        const v = state.views[i];
        const { x, y, fontSize, fontWeight, itemHeight, item, paragraph } = v;

        let rightLabel = "";

        if (item.remoteTotalItemsCount && item.remoteLoadedItemsCount) {
            rightLabel =
                `${item.remoteLoadedItemsCount} / ${item.remoteTotalItemsCount}  ` +
                rightLabel;
        }

        if (item.channelTitle) {
            rightLabel += " " + item.channelTitle;
        }

        if (rightLabel.length > 0) {
            setFont(typography.smallFontSize);
            ctx.textAlign = "right";
            ctx.fillStyle = colors.footerText;
            let label = rightLabel;
            if (item.durationTime)
                label = item.durationFormattted + " " + label;

            ctx.fillText(label, view.x - 10, y);
        }

        // if (item.bullet) {
        //     setFont(10);
        //     ctx.fillStyle = "#b3b3b3";
        //     ctx.textAlign = "right";
        //     ctx.fillText(item.bullet, x - 10, y);
        // }

        setFont(fontSize, fontWeight);
        ctx.fillStyle = colors.text;
        ctx.textAlign = "left";
        for (let l = 0; l < paragraph.lines.length; l++) {
            const line = paragraph.lines[l];
            ctx.fillText(line, x, y + l * paragraph.lineHeight);
        }

        if (item.children.length > 0 && !item.isOpen && item != state.focused) {
            const iconSize = 3;
            ctx.fillStyle = colors.nonEmptyClosedIcon;
            fillSquareAtCenter(x - 7, y, iconSize);
        }

        const stripeColor = getItemTypeColor(item);
        if (stripeColor) {
            ctx.fillStyle = stripeColor;
            const cursorY =
                y - itemHeight / 2 - typography.extraSpaceBetweenItemsHalf;
            const labelHeight =
                paragraph.totalHeight + typography.extraSpaceBetweenItems;

            ctx.fillRect(0, cursorY, 3, labelHeight);

            if (item.isLoading) {
                fillCircleAtCenter(x - 7, y, 2);
            }
        }
    }

    ctx.restore();

    drawScrollBar(state);

    drawFooter(state);

    viewModal(state);

    if (state.isSelectingFont) showFontOptions();

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
    if (typeof item.timeline == "number") return colors.videoTimeItemStripe;
    else if (item.videoId) return colors.videoItemStripe;
    else if (item.playlistId) return colors.playlistItemStripe;
    else if (item.channelId) return colors.channelItemStripe;
    return undefined;
}
