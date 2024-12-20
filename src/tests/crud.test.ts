import { actions, expect, ftest, init, initWithItems, test } from "./tests";

test("Emptry state always creates an item as first child of a root", async function () {
    init(["One"]);
    await actions.removeSelected();

    expect.rootLevelItemsToBe([]);

    await actions.createItemAfterSelected();
    await actions.enterTextAndExit("Two");
    expect.rootLevelItemsToBe(["Two"]);
    expect.selectedItem("Two");

    await actions.removeSelected();

    await actions.createItemBeforeSelected();
    await actions.enterTextAndExit("Three");
    expect.rootLevelItemsToBe(["Three"]);
    expect.selectedItem("Three");
});

test("Renaming an items changes it's title", async function testEdit() {
    init("One Two Three".split(" "));

    await actions.replaceTitle();
    expect.mode("insert");

    await actions.enterTextAndExit("New Name");

    expect.rootLevelItemsToBe(["New Name", "Two", "Three"]);
});

test("Removing an item can be undone", async function testRemovalWithUndo() {
    init("One Two Three".split(" "));

    await actions.removeSelected();
    expect.rootLevelItemsToBe(["Two", "Three"]);
    expect.selectedItem("Two");

    await actions.goDown();
    await actions.removeSelected();
    expect.rootLevelItemsToBe(["Two"]);
    expect.selectedItem("Two");

    await actions.undo();
    expect.rootLevelItemsToBe(["Two", "Three"]);
    expect.selectedItem("Three");

    await actions.undo();
    expect.rootLevelItemsToBe(["One", "Two", "Three"]);
    expect.selectedItem("One");
});

test("Adding new item adds it to a parent", async function testAddingNew() {
    init("One Two Three".split(" "));

    await actions.createItemAfterSelected();
    await actions.enterTextAndExit("Sub 1");
    expect.rootLevelItemsToBe(["One", "Sub 1", "Two", "Three"]);

    await actions.createItemBeforeSelected();
    await actions.enterTextAndExit("Sub 1.1");

    expect.rootLevelItemsToBe(["One", "Sub 1.1", "Sub 1", "Two", "Three"]);
});
