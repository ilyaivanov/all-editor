import { AppState } from "./index";
import { changeSelected } from "./actions";
import { saveItemsToLocalStorage } from "./persistance.storage";
import { addItemAt, Item, removeItem } from "./tree/tree";

export const changes = {
    closeItem: (item: Item): Edit => ({
        type: "change",
        item,
        prop: "isOpen",
        newValue: false,
        oldValue: item.isOpen,
    }),

    openItem: (item: Item): Edit => ({
        type: "change",
        item,
        prop: "isOpen",
        newValue: true,
        oldValue: item.isOpen,
    }),

    rename: (item: Item, newName: string): Edit => ({
        type: "change",
        item,
        prop: "title",
        oldValue: item.title,
        newValue: newName,
    }),

    renameWithOld: (item: Item, newName: string, oldName: string): Edit => ({
        type: "change",
        item,
        prop: "title",
        oldValue: oldName,
        newValue: newName,
    }),

    add: (newItem: Item, parent: Item, at: number, state: AppState): Edit => ({
        type: "add",
        item: newItem,
        parent: parent,
        position: at,
        selectedAtMoment: state.selectedItem,
    }),

    remove: (item: Item, itemToSelectNext: Item | undefined): Edit => ({
        type: "remove",
        item: item,
        position: item.parent.children.indexOf(item),
        itemToSelectNext,
    }),
};

export type Edit =
    | {
          type: "change";
          item: Item;
          prop: keyof Item;
          oldValue: any;
          newValue: any;
      }
    | {
          type: "remove";
          item: Item;
          position: number;
          itemToSelectNext: Item | undefined;
      }
    | {
          type: "add";
          item: Item;
          parent: Item;
          position: number;
          selectedAtMoment: Item;
      }
    | {
          type: "move";
          item: Item;
          oldParent: Item;
          oldPosition: number;
          newParent: Item;
          newPosition: number;
      };

export function editTree(state: AppState, edit: Edit | Edit[]) {
    const entry = Array.isArray(edit) ? edit : [edit];
    pushNewChange(state, entry);
    performChange(state, entry);
}

function performChange(state: AppState, entry: Edit[]) {
    for (const edit of entry) {
        if (edit.type == "add") {
            const { item, parent, position } = edit;
            addItemAt(parent, item, position);

            changeSelected(item);
        }

        if (edit.type == "remove") {
            removeItem(edit.item);
            changeSelected(edit.itemToSelectNext);
        }

        if (edit.type == "change") {
            const { item, prop, newValue } = edit;
            //TS is too restrictive here
            (item as any)[prop] = newValue;
            changeSelected(item);
        }

        if (edit.type == "move") {
            const { item, newParent, newPosition } = edit;
            removeItem(item);
            addItemAt(newParent, item, newPosition);
            changeSelected(item);
        }
    }

    saveItemsToLocalStorage(state);
}

function revertChange(state: AppState, entry: Edit[]) {
    for (const edit of entry) {
        if (edit.type == "add") {
            removeItem(edit.item);
            changeSelected(edit.selectedAtMoment);
        }
        if (edit.type == "remove") {
            const { item, position } = edit;

            addItemAt(item.parent, item, position);
            changeSelected(item);
        } else if (edit.type == "change") {
            const { item, prop, oldValue } = edit;
            //TS is too restrictive here
            (item as any)[prop] = oldValue;
            changeSelected(item);
        }
        if (edit.type == "move") {
            const { item, oldParent, oldPosition } = edit;
            removeItem(item);
            addItemAt(oldParent, item, oldPosition);
            changeSelected(item);
        }
    }
    saveItemsToLocalStorage(state);
}

export function undoLastChange(state: AppState) {
    const { currentChange, changeHistory } = state;
    if (currentChange > -1) {
        const change = changeHistory[currentChange];
        state.currentChange--;
        revertChange(state, change);
    }
}

export function redoLastChange(state: AppState) {
    const { currentChange, changeHistory } = state;
    if (currentChange < changeHistory.length - 1) {
        state.currentChange++;
        const change = changeHistory[state.currentChange];
        performChange(state, change);
    }
}

function pushNewChange(state: AppState, change: Edit[]) {
    const { currentChange, changeHistory } = state;
    if (currentChange < changeHistory.length - 1) {
        changeHistory.splice(
            currentChange + 1,
            changeHistory.length - currentChange - 1
        );
    }

    changeHistory.push(change);
    state.currentChange++;
}
