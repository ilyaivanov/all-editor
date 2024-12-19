import { state } from "..";
import {
    actions,
    checkRootItems,
    checkSelected,
    expect,
    init,
    pressKey,
} from "./utils";

export async function runMovementTests() {
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

    await actions.selectBelow();

    expect.isTrue(!oneItem.isOpen);
    await actions.moveRight();

    expect.isTrue(oneItem.isOpen);
    checkRootItems(["One"]);

    expect.arrayEqual(
        state.root.children[0].children.map((i) => i.title),
        ["Two"]
    );

    await actions.moveRight();

    expect.arrayEqual(
        state.root.children[0].children.map((i) => i.title),
        ["Two"]
    );

    await actions.moveLeft();
    expect.isTrue(!oneItem.isOpen);
    expect.isTrue(oneItem.children.length == 0);
    checkRootItems(["One", "Two"]);

    await actions.moveLeft();
    checkRootItems(["One", "Two"]);

    await actions.undo();

    checkRootItems(["One"]);
    expect.arrayEqual(
        state.root.children[0].children.map((i) => i.title),
        ["Two"]
    );

    await actions.undo();

    checkRootItems(["One", "Two"]);
    checkSelected("Two");
}
