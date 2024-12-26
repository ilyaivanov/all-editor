import { AppState } from "./index";
import { getPathToParent, isRoot } from "./tree/tree";
import { ctx, setFont, setFontMonospace, view } from "./utils/canvas";
import { colors, spacings } from "./consts";

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

    const footerCenter = view.y - spacings.footerHeight / 2;

    const width = ctx.measureText(msg).width;
    const footerTextLeft = 10;
    ctx.fillText(msg, footerTextLeft, footerCenter);

    ctx.fillStyle = colors.footerTextFocus;

    if (!isRoot(state.focused))
        ctx.fillText(state.focused.title, footerTextLeft + width, footerCenter);

    if (state.playerTimeLabel && state.itemPlaying) {
        ctx.textAlign = "right";
        setFontMonospace(11);
        ctx.fillStyle =
            state.playerState == "play"
                ? colors.playFooterText
                : colors.pauseFooterText;

        const textToShow =
            state.itemPlaying.title + " " + state.playerTimeLabel;

        ctx.fillText(textToShow, view.x - 10, footerCenter);
    }

    ctx.restore();
}
