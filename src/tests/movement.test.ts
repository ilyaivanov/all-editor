import { state } from "..";
import {
    actions,
    checkRootItems,
    checkSelected,
    init,
    expect,
    pressKey,
} from "./utils";

export async function runMovementTests() {
    await movingManyItemsInside();
    await runMovementTestsWithUndo();
    await movesWhichDoNotAffectOrderAreNotPlacedInHistory();
    await movingItemRightPlacedItAsFirstChildOfPreviousItem();
}

async function movesWhichDoNotAffectOrderAreNotPlacedInHistory() {
    init("One Two".split(" "));

    await actions.moveDown();
    await actions.moveDown(20);
    await actions.moveDown(20);

    checkRootItems(["Two", "One"]);
    await actions.undo();
    checkRootItems(["One", "Two"]);

    init("One Two".split(" "));

    await pressKey("J");
    await actions.moveUp();
    await actions.moveUp(20);
    await actions.moveUp(20);

    checkRootItems(["Two", "One"]);
    await actions.undo();
    checkRootItems(["One", "Two"]);
}

async function runMovementTestsWithUndo() {
    init("One Two Three".split(" "));

    await actions.moveDown();
    checkRootItems(["Two", "One", "Three"]);
    checkSelected("One");

    await actions.moveDown();
    checkRootItems(["Two", "Three", "One"]);
    checkSelected("One");

    await actions.moveDown();
    checkRootItems(["Two", "Three", "One"]);
    checkSelected("One");

    await actions.moveUp();
    checkRootItems(["Two", "One", "Three"]);
    checkSelected("One");

    await actions.moveUp();
    checkRootItems(["One", "Two", "Three"]);
    checkSelected("One");

    await actions.moveUp();
    checkRootItems(["One", "Two", "Three"]);
    checkSelected("One");

    await pressKey("J");
    checkSelected("Two");

    await actions.undo();
    checkRootItems(["Two", "One", "Three"]);
    checkSelected("One");

    await actions.undo();
    checkRootItems(["Two", "Three", "One"]);
    checkSelected("One");

    await actions.redo();
    checkRootItems(["Two", "One", "Three"]);
    checkSelected("One");

    await actions.redo();
    checkRootItems(["One", "Two", "Three"]);
    checkSelected("One");
}

async function movingItemRightPlacedItAsFirstChildOfPreviousItem() {
    init(["One", "Two"]);

    const oneItem = state.root.children[0];

    await actions.goDown();

    expect.isClosed("One");
    await actions.moveRight();

    expect.isOpen("One");
    checkRootItems(["One"]);

    expect.children("One", ["Two"]);

    await actions.moveRight();

    expect.children("One", ["Two"]);

    await actions.moveLeft();
    expect.isClosed("One");
    expect.isTrue(oneItem.children.length == 0);
    checkRootItems(["One", "Two"]);

    await actions.moveLeft();
    checkRootItems(["One", "Two"]);

    await actions.undo();

    checkRootItems(["One"]);
    expect.children("One", ["Two"]);
    await actions.undo();

    checkRootItems(["One", "Two"]);
    checkSelected("Two");
}

async function movingManyItemsInside() {
    init("One Two Three".split(" "));

    await actions.goDown();
    await actions.moveRight();
    await actions.goDown();
    await actions.moveRight();

    expect.children("One", ["Two", "Three"]);

    await actions.moveRight();
    expect.children("One", ["Two"]);
    expect.children("Two", ["Three"]);

    await actions.moveRight();
    expect.children("One", ["Two"]);
    expect.children("Two", ["Three"]);

    await actions.moveLeft();
    expect.children("One", ["Two", "Three"]);

    await actions.undo();
    expect.children("One", ["Two"]);
    expect.children("Two", ["Three"]);

    await actions.undo();
    expect.children("One", ["Two", "Three"]);
}
