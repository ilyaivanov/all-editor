import { actions, expect, init, initWithItems, test } from "./tests";
import { item } from "../tree/tree";

//TODO turn comments into code. those comments should be strings, which will drive assertions
test("Adding or removing an items can be undone", async function () {
    init("One Two Three".split(" "));

    await actions.goDown();
    await actions.goDown();
    expect.selectedItem("Three");
    // One
    // Two
    // Three << selected

    await actions.deleteSelected();
    expect.selectedItem("Two");
    // One
    // Two << selected (-Three)

    await actions.deleteSelected();
    expect.selectedItem("One");
    // One << selected (-Three -Two)

    await actions.undo();
    expect.rootLevelItemsToBe(["One", "Two"]);
    expect.selectedItem("Two");
    // One
    // Two << selected (-Three | -Two)

    await actions.createItemAfterSelected();
    await actions.enterTextAndExit("Four");
    expect.rootLevelItemsToBe(["One", "Two", "Four"]);

    // One
    // Two
    // Four << selected (-Three +Four | )

    await actions.undo();
    expect.rootLevelItemsToBe(["One", "Two"]);
    expect.selectedItem("Two");

    // One
    // Two << selected (-Three | +Four)

    await actions.undo();
    expect.rootLevelItemsToBe(["One", "Two", "Three"]);
    expect.selectedItem("Three");
    // One
    // Two
    // Three << selected (| -Three +Four)

    await actions.redo();
    expect.rootLevelItemsToBe(["One", "Two"]);
    expect.selectedItem("Two");
    // One
    // Two << selected (-Three | +Four)

    await actions.redo();
    expect.rootLevelItemsToBe(["One", "Two", "Four"]);
    expect.selectedItem("Four");
    // One
    // Two
    // Four << selected (-Three +Four |)
});

test("Renaming an item can be undone", async function () {
    init("One Two".split(" "));

    await actions.replaceTitle();
    await actions.enterTextAndExit("New One");

    expect.rootLevelItemsToBe(["New One", "Two"]);
    expect.selectedItem("New One");

    await actions.goDown();
    await actions.jumpWordForward();
    await actions.enterInsertMode();
    await actions.enterTextAndExit(" and Three");

    expect.rootLevelItemsToBe(["New One", "Two and Three"]);
    expect.selectedItem("Two and Three");

    await actions.undo();
    expect.rootLevelItemsToBe(["New One", "Two"]);
    expect.selectedItem("Two");

    await actions.undo();
    expect.rootLevelItemsToBe(["One", "Two"]);
    expect.selectedItem("One");

    await actions.redo();
    expect.rootLevelItemsToBe(["New One", "Two"]);
    expect.selectedItem("New One");

    await actions.redo();
    expect.rootLevelItemsToBe(["New One", "Two and Three"]);
    expect.selectedItem("Two and Three");
});

test("Opening and closing an item can be undone", async function () {
    initWithItems([item("One", [item("Two")])]);

    expect.viewsCount(2);

    expect.isOpen("One");
    await actions.goLeft();
    expect.isClosed("One");
    expect.viewsCount(1);
    expect.historyCount(1);

    await actions.goRight();
    expect.isOpen("One");
    expect.viewsCount(2);
    expect.historyCount(2);

    await actions.undo();
    expect.isClosed("One");
    expect.viewsCount(1);

    await actions.undo();
    expect.isOpen("One");
    expect.viewsCount(2);
});
