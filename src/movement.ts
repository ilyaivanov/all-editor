import { AppState } from ".";
import { getPreviousSibling, isRoot, isSameOrParentOf } from "./tree/tree";
import { editTree, MoveInfo } from "./undoRedo";

export function moveSelectedItem(
    state: AppState,
    direction: "up" | "down" | "left" | "right"
) {
    if (state.selectedItem == state.focused) return;

    const item = state.selectedItem;
    const context = item.parent.children;
    let info: MoveInfo = {
        item: item,
        newParent: item.parent,
        newPosition: -1,
        oldParent: item.parent,
        oldPosition: context.indexOf(item),
    };

    if (direction == "up") info.newPosition = Math.max(info.oldPosition - 1, 0);
    else if (direction == "down")
        info.newPosition = Math.min(info.oldPosition + 1, context.length - 1);
    else if (direction == "right") {
        const prev = getPreviousSibling(item);
        if (!prev) return;

        info.newParent = prev;
        info.newPosition = info.newParent.children.length;
    } else if (direction == "left") {
        if (isRoot(item.parent)) return;

        info.newParent = item.parent.parent;
        info.newPosition = item.parent.parent.children.indexOf(item.parent) + 1;
    }

    if (!isSameOrParentOf(state.focused, info.newParent)) return;

    if (
        info.newPosition != info.oldPosition ||
        info.oldParent != info.newParent
    )
        editTree(state, { type: "move", item: info });
}
