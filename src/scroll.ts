import { AppState, state } from "./index";
import { clamp } from "./utils/math";
import { typography } from "./view";

export function clampOffset(val: number) {
    const maxOffset = Math.max(
        state.pageHeight - state.drawableCanvasHeight,
        0
    );
    return clamp(val, 0, maxOffset);
}

export function scrollToSelectedItem(state: AppState) {
    const itemsToLookAhead = 3;

    let itemView = state.views.find((v) => v.item == state.selectedItem);

    if (!itemView) return;

    const { pageHeight, scrollOffset } = state;
    const height = state.drawableCanvasHeight;

    //TODO: this is not precise, but just some space to look forward.
    const spaceToLookAhead =
        itemView.fontSize * typography.lineHeight * itemsToLookAhead;
    if (
        pageHeight > height &&
        itemView.y + spaceToLookAhead - height > scrollOffset
    ) {
        const targetOffset = itemView.y - height + spaceToLookAhead;
        state.scrollOffset = clampOffset(targetOffset);
    } else if (
        pageHeight > height &&
        itemView.y - spaceToLookAhead < scrollOffset
    ) {
        const targetOffset = itemView.y - spaceToLookAhead;
        state.scrollOffset = clampOffset(targetOffset);
    } else {
        state.scrollOffset = clampOffset(state.scrollOffset);
    }
}
