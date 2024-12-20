import { runFocusTests } from "./focus.test";
import { runCursorTests } from "./cursor.test";
import { runMovementTests } from "./movement.test";
import { testUndoRedo } from "./undo.test";
import {
    checkMode,
    checkRootItems,
    checkSelected,
    enterTextAndExit,
    init,
    pressKey,
} from "./utils";

export const TEXT_SPEED = 20;
export const SLEEP = 40;
// export const SLEEP = 100;

export async function runTests() {
    try {
        await runFocusTests();
        await runCursorTests();
        await runMovementTests();
        await testEmptyState();
        await testMovement();
        await testEdit();
        await testRemovalWithUndo();
        await testAddingNew();
        await testUndoRedo();
    } catch (e) {
        //I'm doing this so that red screen won't be shown only during test run
        console.error(e);
    }
}

async function testEmptyState() {
    init(["One"]);
    await pressKey("D");

    checkRootItems([]);

    await pressKey("O");
    await enterTextAndExit("Two");
    checkRootItems(["Two"]);
    checkSelected("Two");

    await pressKey("D");

    await pressKey("O", { shift: true });
    await enterTextAndExit("Three");
    checkRootItems(["Three"]);
    checkSelected("Three");
}

async function testMovement() {
    init("One Two Three".split(" "));
    await pressKey("J");
    checkSelected("Two");

    await pressKey("J");
    checkSelected("Three");

    await pressKey("J");
    checkSelected("Three");

    await pressKey("K");
    checkSelected("Two");

    await pressKey("K");
    checkSelected("One");

    await pressKey("K");
    checkSelected("One");
}

async function testEdit() {
    init("One Two Three".split(" "));

    await pressKey("R");
    checkMode("insert");

    await enterTextAndExit("New Name");

    checkRootItems(["New Name", "Two", "Three"]);
}

async function testRemovalWithUndo() {
    init("One Two Three".split(" "));

    await pressKey("D");
    checkRootItems(["Two", "Three"]);
    checkSelected("Two");

    await pressKey("J");
    await pressKey("D");
    checkRootItems(["Two"]);
    checkSelected("Two");

    await pressKey("U");
    checkRootItems(["Two", "Three"]);
    checkSelected("Three");

    await pressKey("U");
    checkRootItems(["One", "Two", "Three"]);
    checkSelected("One");
}

async function testAddingNew() {
    init("One Two Three".split(" "));

    await pressKey("O");
    await enterTextAndExit("Sub 1");
    checkRootItems(["One", "Sub 1", "Two", "Three"]);

    await pressKey("O", { shift: true });
    await enterTextAndExit("Sub 1.1");

    checkRootItems(["One", "Sub 1.1", "Sub 1", "Two", "Three"]);
}
