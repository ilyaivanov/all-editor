import { actions, expect, initWithItems, test } from "./tests";
import { item } from "../tree/tree";

test("Movement across items", async function () {
    initWithItems([
        //
        item("One"),
        item("Two"),
        item("Three"),
    ]);

    await actions.goDown();
    expect.selectedItem("Two");

    await actions.goDown();
    expect.selectedItem("Three");

    await actions.goDown();
    expect.selectedItem("Three");

    await actions.goUp();
    expect.selectedItem("Two");

    await actions.goUp();
    expect.selectedItem("One");

    await actions.goUp();
    expect.selectedItem("One");
});
