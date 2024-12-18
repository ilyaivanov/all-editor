import type { AppState } from "./index";
import type { Item } from "./root";
// import { Item, isRoot } from "./utils/tree";

export function isRoot(item: Item) {
    return item.parent == item;
}

function isFocused(state: AppState, item: Item) {
    return isRoot(item);
}

// export function getItemToSelectAfterRemovingSelected(item: Item) {
//     return getItemAbove(item) || getFollowingSibling(item);
// }

export const getItemAbove = (item: Item): Item | undefined => {
    const parent = item.parent;
    if (parent) {
        const index = parent.children.indexOf(item);
        if (index > 0) {
            const previousItem = parent.children[index - 1];
            if (previousItem.isOpen)
                return getLastNestedItem(
                    previousItem.children[previousItem.children.length - 1]
                );
            return getLastNestedItem(previousItem);
        } else if (!isRoot(parent)) return parent;
    }
};

export function getItemBelow(state: AppState, item: Item) {
    if ((item.isOpen || isFocused(state, item)) && item.children.length > 0)
        return item.children[0];
    return getFollowingItem(item);
}

const getFollowingItem = (item: Item): Item | undefined => {
    const followingItem = getFollowingSibling(item);
    if (followingItem) return followingItem;
    else {
        let parent = item.parent;
        while (parent && isLast(parent)) {
            parent = parent.parent;
        }
        if (parent) return getFollowingSibling(parent);
    }
};

const getFollowingSibling = (item: Item): Item | undefined =>
    getRelativeSibling(item, (currentIndex) => currentIndex + 1);

const getPreviousSibling = (item: Item): Item | undefined =>
    getRelativeSibling(item, (currentIndex) => currentIndex - 1);

const getRelativeSibling = (
    item: Item,
    getNextItemIndex: (itemIndex: number) => number
): Item | undefined => {
    const context = item.parent?.children;
    if (context) {
        const index = context.indexOf(item);
        return context[getNextItemIndex(index)];
    }
};

const isLast = (item: Item): boolean => !getFollowingSibling(item);

const getLastNestedItem = (item: Item): Item => {
    if (item.isOpen && item.children) {
        const { children } = item;
        return getLastNestedItem(children[children.length - 1]);
    }
    return item;
};
