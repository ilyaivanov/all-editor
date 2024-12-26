import { ctx, setFont, view } from "./utils/canvas";
import { colors, typography } from "./consts";

const options = [
    {
        fontSize: typography.fontSize,
        weight: typography.fontWeight,
        label: "Regular",
    },
    {
        fontSize: 14,
        weight: 400,
        label: "Subheader",
    },
    {
        fontSize: 14,
        weight: 600,
        label: "Subheader bold",
    },
    {
        fontSize: 16,
        weight: 600,
        label: "Header",
    },
    {
        fontSize: 18,
        weight: 600,
        label: "Subtitle",
    },
    {
        fontSize: 22,
        weight: 600,
        label: "Title",
    },
];
export function getOption(position: number) {
    return options[position - 1] || options[0];
}

export function showFontOptions() {
    const width = 200;
    const height = 200;
    ctx.fillStyle = colors.fontSelectionBg;
    ctx.fillRect(view.x - width, view.y / 2 - height / 2, width, height);

    const padding = 5;
    let x = view.x - width;
    let y = view.y / 2 - height / 2 + padding;
    ctx.textBaseline = "top";
    for (let i = 0; i < options.length; i++) {
        const { fontSize, weight, label } = options[i];
        setFont(fontSize, weight);
        ctx.fillStyle = colors.text;
        ctx.fillText(`${i + 1}. ${label}`, x + padding, y);
        const labelHeight = fontHeight();
        y += labelHeight * 1.3;

        if (i != options.length) {
            ctx.fillStyle = colors.footerBg;
            ctx.fillRect(x, y, width, 2);
        }
        y += labelHeight * 0.4;
    }
}

function fontHeight() {
    const ms = ctx.measureText("f");
    return ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
}