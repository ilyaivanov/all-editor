import { state } from "..";
import { actions, test, init, expect } from "./tests";

test("If when moving nothing changes - history is not being altered", async function () {
    init("One Two".split(" "));

    await actions.moveDown();
    await actions.moveDown(20);
    await actions.moveDown(20);

    expect.firstLevelItemsToBe(["Two", "One"]);
    await actions.undo();
    expect.firstLevelItemsToBe(["One", "Two"]);

    init("One Two".split(" "));

    await actions.goDown();
    await actions.moveUp();
    await actions.moveUp(20);
    await actions.moveUp(20);

    expect.firstLevelItemsToBe(["Two", "One"]);
    await actions.undo();
    expect.firstLevelItemsToBe(["One", "Two"]);
});

test("Moving item stored that movement in history", async function () {
    init("One Two Three".split(" "));

    await actions.moveDown();
    expect.firstLevelItemsToBe(["Two", "One", "Three"]);
    expect.selectedItem("One");

    await actions.moveDown();
    expect.firstLevelItemsToBe(["Two", "Three", "One"]);
    expect.selectedItem("One");

    await actions.moveDown();
    expect.firstLevelItemsToBe(["Two", "Three", "One"]);
    expect.selectedItem("One");

    await actions.moveUp();
    expect.firstLevelItemsToBe(["Two", "One", "Three"]);
    expect.selectedItem("One");

    await actions.moveUp();
    expect.firstLevelItemsToBe(["One", "Two", "Three"]);
    expect.selectedItem("One");

    await actions.moveUp();
    expect.firstLevelItemsToBe(["One", "Two", "Three"]);
    expect.selectedItem("One");

    await actions.goDown();
    expect.selectedItem("Two");

    await actions.undo();
    expect.firstLevelItemsToBe(["Two", "One", "Three"]);
    expect.selectedItem("One");

    await actions.undo();
    expect.firstLevelItemsToBe(["Two", "Three", "One"]);
    expect.selectedItem("One");

    await actions.redo();
    expect.firstLevelItemsToBe(["Two", "One", "Three"]);
    expect.selectedItem("One");

    await actions.redo();
    expect.firstLevelItemsToBe(["One", "Two", "Three"]);
    expect.selectedItem("One");
});

test("Moving item right places it as a last child of previous item", async function () {
    init(["One", "Two"]);

    const oneItem = state.root.children[0];

    await actions.goDown();

    expect.isClosed("One");
    await actions.moveRight();

    expect.isOpen("One");
    expect.firstLevelItemsToBe(["One"]);

    expect.children("One", ["Two"]);

    await actions.moveRight();

    expect.children("One", ["Two"]);

    await actions.moveLeft();
    expect.isClosed("One");
    expect.isTrue(oneItem.children.length == 0);
    expect.firstLevelItemsToBe(["One", "Two"]);

    await actions.moveLeft();
    expect.firstLevelItemsToBe(["One", "Two"]);

    await actions.undo();

    expect.firstLevelItemsToBe(["One"]);
    expect.children("One", ["Two"]);
    await actions.undo();

    expect.firstLevelItemsToBe(["One", "Two"]);
    expect.selectedItem("Two");
});

test("Moving items inside one another", async function () {
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
});
