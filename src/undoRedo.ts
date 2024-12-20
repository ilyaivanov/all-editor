import { AppState } from ".";
import { changeSelected } from "./actions";
import { saveItemsToLocalStorage } from "./persistance";
import { addItemAt, Item, removeItem } from "./tree/tree";

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

export function editTree(state: AppState, edit: Edit) {
    pushNewChange(state, edit);
    performChange(state, edit);
}

function performChange(state: AppState, edit: Edit) {
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

    saveItemsToLocalStorage(state);
}

function revertChange(state: AppState, edit: Edit) {
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

function pushNewChange(state: AppState, change: Edit) {
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
