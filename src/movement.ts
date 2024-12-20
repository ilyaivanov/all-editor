import { AppState } from "./index";
import { getPreviousSibling, isRoot, isSameOrParentOf } from "./tree/tree";
import { editTree, Edit } from "./undoRedo";

export function moveSelectedItem(
    state: AppState,
    direction: "up" | "down" | "left" | "right"
) {
    if (state.selectedItem == state.focused) return;

    const item = state.selectedItem;
    const context = item.parent.children;
    let move: Edit = {
        type: "move",
        item: item,
        newParent: item.parent,
        newPosition: -1,
        oldParent: item.parent,
        oldPosition: context.indexOf(item),
    };

    if (direction == "up") move.newPosition = Math.max(move.oldPosition - 1, 0);
    else if (direction == "down")
        move.newPosition = Math.min(move.oldPosition + 1, context.length - 1);
    else if (direction == "right") {
        const prev = getPreviousSibling(item);
        if (!prev) return;

        move.newParent = prev;
        move.newPosition = move.newParent.children.length;
    } else if (direction == "left") {
        if (isRoot(item.parent)) return;

        move.newParent = item.parent.parent;
        move.newPosition = item.parent.parent.children.indexOf(item.parent) + 1;
    }

    if (!isSameOrParentOf(state.focused, move.newParent)) return;

    if (
        move.newPosition != move.oldPosition ||
        move.oldParent != move.newParent
    )
        editTree(state, move);
}
