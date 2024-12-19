// import { Item, findParent, getIndexOf, isRoot } from "../utils/tree";

import { AppState } from ".";
import { getPreviousSibling, isRoot } from "./tree/tree";
import { editTree, MoveInfo } from "./undoRedo";

// import { getPreviousSibling } from "../selection";
// import { editTree, MoveInfo } from "./edit";
// import { AppState } from "../index";

export function moveSelectedItem(
    state: AppState,
    direction: "up" | "down" | "left" | "right"
) {
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
        info.newParent = getPreviousSibling(item)!;
        info.newPosition = 0;
    } else if (direction == "left") {
        if (!isRoot(item.parent)) {
            info.newParent = item.parent.parent;
            info.newPosition =
                item.parent.parent.children.indexOf(item.parent) + 1;
        } else {
            return;
        }
    }

    if (info.newPosition != info.oldPosition)
        editTree(state, { type: "move", item: info });
    // I don't want to move an item if parent is selected. Maybe I will change that
    // items = items.filter((c) => {
    //     const isParentAlreadySelected = findParent(
    //         c.item,
    //         (p) => !!items.find((i) => i != c && i.item == p)
    //     );
    //     return !isParentAlreadySelected;
    // });

    // if (direction == "up") {
    //     // items.sort((a, b) => a.oldPosition - b.oldPosition);
    //     // items.forEach((i) => {
    //     //     i.newPosition = Math.max(i.oldPosition - 1, 0);
    //     // });

    //     items.forEach((info) => {
    //         let areAllItemAboveSelected = true;
    //         const context = info.item.parent.children;
    //         for (let i = 0; i < info.oldPosition; i++) {
    //             if (!items.find((info) => info.item == context[i])) {
    //                 areAllItemAboveSelected = false;
    //                 break;
    //             }
    //         }
    //         if (areAllItemAboveSelected) {
    //             info.newPosition = info.oldPosition;
    //         }
    //     });
    // } else
    // if (direction == "up") info.newPosition = Math.max(info.oldPosition - 1, 0);
    // else if (direction == "down") {
    //     info.newPosition = Math.min(info.oldPosition + 1, context.length - 1);
    // items.sort((a, b) => b.oldPosition - a.oldPosition);
    // items.forEach((i) => {
    //     i.newPosition = i.oldPosition + 1;
    // });

    // items.forEach((info) => {
    // let areAllItemAboveSelected = true;
    // const context = info.item.parent.children;
    // for (let i = info.oldPosition; i < context.length; i++) {
    //     if (!items.find((info) => info.item == context[i])) {
    //         areAllItemAboveSelected = false;
    //         break;
    //     }
    // }
    // if (areAllItemAboveSelected) {
    //     info.newPosition = info.oldPosition;
    // }
    // });
    // }
    //  else if (direction == "left") {
    //     items.sort((a, b) => a.oldPosition - b.oldPosition);
    //     const targetPosition = new Map<Item, number>();
    //     items.forEach((c) => {
    //         if (!isRoot(c.item.parent) && !targetPosition.has(c.item.parent)) {
    //             targetPosition.set(
    //                 c.item.parent,
    //                 getIndexOf(c.item.parent) + 1
    //             );
    //         }
    //     });

    //     items.forEach((c) => {
    //         if (!isRoot(c.item.parent)) {
    //             c.newParent = c.item.parent.parent;

    //             c.newPosition = targetPosition.get(c.item.parent)!;
    //             targetPosition.set(c.item.parent, c.newPosition + 1);
    //         }
    //     });
    // } else if (direction == "right") {
    //     items.sort((a, b) => a.oldPosition - b.oldPosition);

    //     const targetPosition = new Map<Item, number>();
    //     items.forEach((c) => {
    //         const prevSibling = getPreviousSibling(c.item);
    //         if (prevSibling && !targetPosition.has(prevSibling)) {
    //             targetPosition.set(prevSibling, prevSibling.children.length);
    //         }
    //     });

    //     items.forEach((c) => {
    //         let prevSibling = getPreviousSibling(c.item);
    //         while (items.find((c) => c.item == prevSibling)) {
    //             if (!prevSibling) break;
    //             prevSibling = getPreviousSibling(prevSibling);
    //         }

    //         if (prevSibling) {
    //             c.newParent = prevSibling;

    //             c.newPosition = targetPosition.get(prevSibling)!;
    //             targetPosition.set(prevSibling, c.newPosition + 1);
    //         }
    //     });
    // }

    // items = items.filter((i) => i.newPosition != -1);
}

// export function moveItemDown(item: Item) {
//     const context = getContext(item);
//     const index = context.indexOf(item);
//     if (index < context.length - 1) {
//         context.splice(index, 1);
//         context.splice(index + 1, 0, item);
//     }
// }

// export function moveItemUp(item: Item) {
//     const context = getContext(item);
//     const index = context.indexOf(item);
//     if (index > 0) {
//         context.splice(index, 1);
//         context.splice(index - 1, 0, item);
//     }
// }

// export function moveItemRight(item: Item) {
//     const previousSibling = getPreviousSibling(item);
//     if (previousSibling) {
//         previousSibling.isOpen = true;
//         insertAsLastChild(previousSibling, item);
//     }
// }

// export function moveItemLeft(item: Item) {
//     const parent = item.parent;
//     if (parent && !isRoot(parent)) {
//         insertItemAfter(parent, item);
//         if (parent.children.length == 0) parent.isOpen = false;
//     }
// }
