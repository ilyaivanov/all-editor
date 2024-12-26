import { colors, typography } from "../consts";
import { AppState } from "../index";
import { ctx, setFont, view } from "../utils/canvas";
import { View } from "../view";

function drawCursor(view: View, state: AppState) {
    const cursorPosition = state.position;
    const mode = state.mode;
    const { paragraph } = view;
    if (paragraph) {
        const { item, lines } = paragraph;
        const text = item.title;
        let currentChars = 0;
        let currentLine = -2;
        for (let i = 0; i < lines.length; i++) {
            if (currentChars >= cursorPosition) {
                currentLine = i - 1;
                break;
            }
            currentChars += lines[i].length - 1;
        }
        if (currentLine == -2) currentLine = lines.length - 1;
        else if (currentLine < 0) currentLine = 0;
        let lineStart = sumBy(
            takeFirst(lines, currentLine),
            (l) => l.length + 1
        );
        const t = text.slice(lineStart, cursorPosition);
        const cursorHeight = paragraph.lineHeight;
        const cursorWidth = 1;

        if (mode == "normal") ctx.fillStyle = colors.cursorNormalMode;
        else ctx.fillStyle = colors.cursorInsertMode;

        ctx.fillRect(
            view.x + ctx.measureText(t).width - cursorWidth / 2,
            view.y + currentLine * paragraph.lineHeight - cursorHeight / 2,
            cursorWidth,
            cursorHeight
        );
    }
}

function takeFirst<T>(items: T[], count: number) {
    return items.slice(0, count);
}

function sumBy<T>(items: T[], fn: (item: T) => number) {
    return items.reduce((prev, item) => prev + fn(item), 0);
}

export function drawSelection(state: AppState, v: View) {
    const { y, fontSize, fontWeight, itemHeight, paragraph } = v;

    ctx.fillStyle = state.isSelectingFont
        ? colors.fontSelectionBg
        : colors.selectionBg;

    drawItemBg(v);

    setFont(fontSize, fontWeight);
    drawCursor(v, state);
}

export function drawItemBg(v: View) {
    const { y, itemHeight, paragraph } = v;

    const cursorY = y - itemHeight / 2;

    ctx.fillRect(
        0,
        cursorY - typography.extraSpaceBetweenItems * 0.75,
        view.x,
        paragraph.totalHeight + typography.extraSpaceBetweenItems * 1.5
    );
}
