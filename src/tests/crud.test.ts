import { item } from "../tree/tree";
import {
    actions,
    expect,
    ftest,
    init,
    initWithItems,
    test,
    xtest,
} from "./tests";

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

test("Pressing enter will add a new item below if cursor is at the end in insert mode", async function () {
    initWithItems([item("One")]);

    await actions.jumpWordForward();
    await actions.enterInsertMode();
    await actions.enterText(" and");
    await actions.pressKey("Enter");
    await actions.enterTextAndExit("Two");

    expect.rootLevelItemsToBe(["One and", "Two"]);
});

test("Pressing enter will add a new item below if cursor is at the end in normal mode", async function () {
    initWithItems([item("One")]);

    await actions.jumpWordForward();
    await actions.pressKey("Enter");
    await actions.enterInsertMode();
    await actions.enterTextAndExit("Two");

    expect.rootLevelItemsToBe(["One", "Two"]);
});

test("Pressing enter in the middle of item break it into two", async function () {
    initWithItems([item("One Two")]);

    await actions.jumpWordForward();
    await actions.pressKey("Enter");

    expect.mode("normal");
    expect.rootLevelItemsToBe(["One ", "Two"]);

    await actions.undo();
    expect.rootLevelItemsToBe(["One Two"]);
    expect.children("One Two", []);
});

test("Pressing enter in the middle of item break it into two in insert mode", async function () {
    initWithItems([item("One Two")]);

    await actions.jumpWordForward();
    await actions.enterInsertMode();
    await actions.pressKey("Enter");

    expect.mode("insert");
    expect.rootLevelItemsToBe(["One ", "Two"]);

    await actions.pressKey("Escape");

    await actions.undo();
    expect.rootLevelItemsToBe(["One Two"]);
    expect.children("One Two", []);
    expect.mode("normal");
});

test("Pressing enter in the middle of item which is focused breaks it into two and new items is inserted inside focused", async function () {
    initWithItems([item("One Two")]);

    await actions.focusOnSelected();
    await actions.jumpWordForward();
    await actions.pressKey("Enter");

    expect.mode("normal");
    expect.rootLevelItemsToBe(["One "]);
    expect.children("One ", ["Two"]);

    await actions.undo();
    expect.rootLevelItemsToBe(["One Two"]);
    expect.children("One Two", []);
});

test("Pressing enter in the middle of item which is focused breaks it into two and new items is inserted inside focused", async function () {
    initWithItems([item("One Two")]);

    await actions.jumpWordForward();
    await actions.enterInsertMode();
    await actions.pressKey("Enter");

    await actions.enterTextAndExit("and ");
    expect.rootLevelItemsToBe(["One ", "and Two"]);

    await actions.enterInsertMode();
    await actions.enterTextAndExit("42 ");

    expect.rootLevelItemsToBe(["One ", "and 42 Two"]);

    await actions.undo();
    expect.rootLevelItemsToBe(["One ", "and Two"]);

    await actions.undo();
    expect.rootLevelItemsToBe(["One Two"]);

    await actions.redo();
    expect.rootLevelItemsToBe(["One ", "and Two"]);

    await actions.redo();
    expect.rootLevelItemsToBe(["One ", "and 42 Two"]);
});
