import {
    checkRootItems,
    checkSelected,
    enterTextAndExit,
    init,
    pressKey,
} from "./utils";

export async function testUndoRedo() {
    await testUndoRedoForAddRemove();
    await testUndoRedoForRename();
}
//TODO turn comments into code. those comments should be strings, which will drive assertions
async function testUndoRedoForAddRemove() {
    init("One Two Three".split(" "));

    await pressKey("J");
    await pressKey("J");
    checkSelected("Three");
    // One
    // Two
    // Three << selected

    await pressKey("D");
    checkSelected("Two");
    // One
    // Two << selected (-Three)

    await pressKey("D");
    checkSelected("One");
    // One << selected (-Three -Two)

    await pressKey("U");
    checkRootItems(["One", "Two"]);
    checkSelected("Two");
    // One
    // Two << selected (-Three | -Two)

    await pressKey("O");
    await enterTextAndExit("Four");
    checkRootItems(["One", "Two", "Four"]);

    // One
    // Two
    // Four << selected (-Three +Four | )

    await pressKey("U");
    checkRootItems(["One", "Two"]);
    checkSelected("Two");

    // One
    // Two << selected (-Three | +Four)

    await pressKey("U");
    checkRootItems(["One", "Two", "Three"]);
    checkSelected("Three");
    // One
    // Two
    // Three << selected (| -Three +Four)

    await pressKey("U", { shift: true });
    checkRootItems(["One", "Two"]);
    checkSelected("Two");
    // One
    // Two << selected (-Three | +Four)

    await pressKey("U", { shift: true });
    checkRootItems(["One", "Two", "Four"]);
    checkSelected("Four");
    // One
    // Two
    // Four << selected (-Three +Four |)
}

async function testUndoRedoForRename() {
    init("One Two".split(" "));

    await pressKey("R");
    await enterTextAndExit("New One");

    checkRootItems(["New One", "Two"]);
    checkSelected("New One");

    await pressKey("J");
    await pressKey("W");
    await pressKey("I");
    await enterTextAndExit(" and Three");

    checkRootItems(["New One", "Two and Three"]);
    checkSelected("Two and Three");

    await pressKey("U");
    checkRootItems(["New One", "Two"]);
    checkSelected("Two");

    await pressKey("U");
    checkRootItems(["One", "Two"]);
    checkSelected("One");

    await pressKey("U", { shift: true });
    checkRootItems(["New One", "Two"]);
    checkSelected("New One");

    await pressKey("U", { shift: true });
    checkRootItems(["New One", "Two and Three"]);
    checkSelected("Two and Three");
}
