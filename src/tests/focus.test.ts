import { actions, checkRootItems, expect, initWithItems } from "./utils";
import { item } from "../tree/tree";

async function initFocusTests() {
    const items = [
        item("One"),
        item("Two", [
            item("Two 1", [
                //
                item("Two 1.1"),
                item("Two 1.2"),
                item("Two 1.3"),
            ]),
            item("Two 2"),
        ]),
        item("Three"),
    ];
    initWithItems(items);
}

async function initWithFocusOnTwo() {
    initFocusTests();

    await actions.goDown();
    await actions.focusOnSelected();
}

export async function runFocusTests() {
    await focusedItemCantBeRemovedOrMoved();
    await whenClosingItemAndThenFocusingOnItAllChildrenareShown();
    await itemOutsideFocusCantBeSelected();
    await itemMovementIsLimitedToFocus();
}

async function whenClosingItemAndThenFocusingOnItAllChildrenareShown() {
    initFocusTests();

    await actions.goDown();
    await actions.goLeft();
    expect.viewsCount(3);

    await actions.focusOnSelected();
    expect.viewsCount(6);

    await actions.focusOnParent();
    expect.viewsCount(3);
}

async function itemMovementIsLimitedToFocus() {
    await initWithFocusOnTwo();

    await actions.goDown();

    expect.selectedItem("Two 1");

    await actions.moveLeft();

    expect.noHistory();
    expect.children("Two", ["Two 1", "Two 2"]);
}

async function itemOutsideFocusCantBeSelected() {
    await initWithFocusOnTwo();
    await actions.goUp();
    await actions.goUp();
    expect.selectedItem("Two");

    await actions.goDown();
    await actions.goLeft();
    await actions.goDown();
    expect.selectedItem("Two 2");

    await actions.goDown();
    expect.selectedItem("Two 2");
}

async function focusedItemCantBeRemovedOrMoved() {
    await initWithFocusOnTwo();

    await actions.moveDown();
    checkRootItems(["One", "Two", "Three"]);
    expect.noHistory();

    await initWithFocusOnTwo();

    await actions.removeSelected();
    checkRootItems(["One", "Two", "Three"]);
    expect.noHistory();

    await initWithFocusOnTwo();

    expect.isOpen("Two");

    await actions.goLeft();
    expect.isOpen("Two");
}
