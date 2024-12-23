import { AppState } from "./index";
import { getPathToParent, isRoot } from "./tree/tree";
import { ctx, setFont, setFontMonospace, view } from "./utils/canvas";
import { colors, spacings } from "./view";

export function drawFooter(state: AppState) {
    ctx.save();
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

    if (state.playerTimeLabel) {
        ctx.textAlign = "right";
        setFontMonospace(11);
        ctx.fillStyle = colors.footerText;
        ctx.fillText(
            state.playerTimeLabel,
            view.x - 5,
            view.y - spacings.footerHeight / 2
        );
    }

    ctx.restore();
}
