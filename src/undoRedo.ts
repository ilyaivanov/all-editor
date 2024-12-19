import { AppState } from ".";
import { changeSelected } from "./actions";
import { addItemAt, Item, removeItem } from "./tree/tree";

export type MoveInfo = {
    item: Item;
    oldParent: Item;
    oldPosition: number;
    newParent: Item;
    newPosition: number;
};

export type AdditionInfo = {
    item: Item;
    parent: Item;
    position: number;
    selectedAtMoment: Item;
};

export type RenameInfo = {
    item: Item;
    oldTitle: string;
    newTitle: string;
};

export type Edit =
    | {
          type: "rename";
          item: RenameInfo;
      }
    | {
          type: "remove";
          item: {
              item: Item;
              position: number;
          };
          itemToSelectNext: Item | undefined;
      }
    | {
          type: "add";
          item: AdditionInfo;
      }
    | {
          type: "move";
          item: MoveInfo;
      };

export function editTree(state: AppState, edit: Edit) {
    pushNewChange(state, edit);
    performChange(state, edit);
}

function performChange(state: AppState, edit: Edit) {
    if (edit.type == "add") {
        const info = edit.item;
        addItemAt(info.parent, info.item, info.position);

        changeSelected(edit.item.item);
    }

    if (edit.type == "remove") {
        const c = edit.item;
        removeItem(c.item);
        changeSelected(edit.itemToSelectNext);
    }

    if (edit.type == "rename") {
        const c = edit.item;
        c.item.title = c.newTitle;
        changeSelected(c.item);
    }

    if (edit.type == "move") {
        const move = edit.item;
        removeItem(move.item);
        addItemAt(move.newParent, move.item, move.newPosition);
    }
}

function revertChange(state: AppState, edit: Edit) {
    if (edit.type == "add") {
        const info = edit.item;
        removeItem(info.item);
        changeSelected(edit.item.selectedAtMoment);
    }
    if (edit.type == "remove") {
        const info = edit.item;

        addItemAt(info.item.parent, info.item, info.position);
        //TODO: waiting for multiple cursors support
        changeSelected(edit.item.item);
    } else if (edit.type == "rename") {
        const c = edit.item;
        c.item.title = c.oldTitle;
        changeSelected(c.item);
    }
    if (edit.type == "move") {
        const move = edit.item;
        removeItem(move.item);
        addItemAt(move.oldParent, move.item, move.oldPosition);
    }
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
