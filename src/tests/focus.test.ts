import { actions, test, initWithItems, expect } from "./tests";
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

test("When closing an item and then focusing on it all children are shown", async function () {
    initFocusTests();

    await actions.goDown();
    await actions.goLeft();
    expect.viewsCount(3);

    await actions.focusOnSelected();
    expect.viewsCount(6);

    await actions.focusOnParent();
    expect.viewsCount(3);
});

test("When moving item outside of focused - nothing happens", async function () {
    await initWithFocusOnTwo();

    await actions.goDown();

    expect.selectedItem("Two 1");

    await actions.moveLeft();

    expect.noHistory();
    expect.children("Two", ["Two 1", "Two 2"]);
});

test("When selecting item outside of focus - nothing happens", async function () {
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
});

test("Item focused can't be removed nor moved", async function () {
    await initWithFocusOnTwo();

    await actions.moveDown();
    expect.rootLevelItemsToBe(["One", "Two", "Three"]);
    expect.noHistory();

    await initWithFocusOnTwo();

    await actions.removeSelected();
    expect.rootLevelItemsToBe(["One", "Two", "Three"]);
    expect.noHistory();

    await initWithFocusOnTwo();

    expect.isOpen("Two");

    await actions.goLeft();
    expect.isOpen("Two");
});
