import { init, expect, actions } from "./utils";

export async function runCursorTests() {
    await testCursorMovementLeftRight();
    await jumpWordsBackAndForth();
}

async function testCursorMovementLeftRight() {
    init(["One", "Two"]);

    expect.cursorPosition(0);

    await actions.moveCursorLeft();
    expect.cursorPosition(0);

    await actions.moveCursorRight();
    expect.cursorPosition(1);

    await actions.moveCursorRight();
    expect.cursorPosition(2);

    await actions.moveCursorRight();
    expect.cursorPosition(3);

    await actions.moveCursorRight();
    expect.selectedItem("Two");
    expect.cursorPosition(0);

    await actions.moveCursorRight();
    await actions.moveCursorRight();
    await actions.moveCursorRight();
    await actions.moveCursorRight();
    await actions.moveCursorRight();
    await actions.moveCursorRight();
    await actions.moveCursorRight();
    expect.selectedItem("Two");
    expect.cursorPosition(3);
}

async function jumpWordsBackAndForth() {
    const text = "Word1.Word2 Word3(Word4";
    init([text]);

    await actions.jumpWordForward();
    expect.cursorPosition(text.indexOf("Word2"));

    await actions.jumpWordForward();
    expect.cursorPosition(text.indexOf("Word3"));

    await actions.jumpWordForward();
    expect.cursorPosition(text.indexOf("Word4"));

    await actions.jumpWordForward();
    expect.cursorPosition(text.length);

    await actions.jumpWordForward();
    expect.cursorPosition(text.length);

    await actions.jumpWordBack();
    expect.cursorPosition(text.indexOf("Word4"));

    await actions.jumpWordBack();
    expect.cursorPosition(text.indexOf("Word3"));

    await actions.jumpWordBack();
    expect.cursorPosition(text.indexOf("Word2"));

    await actions.jumpWordBack();
    expect.cursorPosition(0);

    await actions.jumpWordBack();
    expect.cursorPosition(0);
}
