import { createRoot, insertAsLastChild, item, Item } from "./tree/tree";

export const loadFromFile = async (): Promise<Item | undefined> => {
    const openFileFn: any = window.showOpenFilePicker;
    if (openFileFn) {
        try {
            const [fileHandle] = await openFileFn({ types });

            const fileData = await fileHandle.getFile();
            const txt: string = await fileData.text();
            return parseFileText(txt);
        } catch (e) {
            if (!(e instanceof DOMException && e.name == "AbortError")) {
                throw e;
            }
        }
    } else {
        throw new Error("Browser doesn't have showOpenFilePicker");
    }
};

export const saveToFile = async (root: Item) => {
    const saveFileFn: any = window.showSaveFilePicker;
    if (saveFileFn) {
        try {
            const fileHandle = await saveFileFn({
                suggestedName: "viztly.txt",
                types,
            });
            const file = await fileHandle.createWritable();
            await file.write(sarializeToFile(root));
            await file.close();
        } catch (e) {
            if (!(e instanceof DOMException && e.name == "AbortError")) {
                throw e;
            }
        }
    } else {
        throw new Error("Browser doesn't have showSaveFilePicker");
    }
};

const types = [
    { description: "Viztly Text File", accept: { "text/*": [".txt"] } },
];

function parseFileText(text: string): Item {
    const lines = text.split("\n");
    const root = createRoot([]);

    const stack: { item: Item; level: number }[] = [{ item: root, level: -1 }];

    function removeFromStackUntilLevel(level: number) {
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            const i = stack.pop();

            if (i && i.item.children.length > 0 && i.item.isOpen !== false)
                i.item.isOpen = true;
        }
    }

    for (let j = 0; j < lines.length; j++) {
        const line = lines[j];

        const { level, item } = parseLine(line);

        removeFromStackUntilLevel(level);

        insertAsLastChild(stack[stack.length - 1].item, item);

        stack.push({ item, level });
    }

    removeFromStackUntilLevel(-1);

    return root;
}

function parseLine(line: string): { level: number; item: Item } {
    let level = 0;
    while (line[level] == " ") level++;

    const res = item("");

    //settings this to undefined, because I want to know if Item is explicitly /closed in a file
    res.isOpen = undefined;

    let words = line
        .trimStart()
        .split(" ")
        .filter((word) => {
            const [key, value] = word.split(":");
            const action = map[key];
            if (action) {
                action(res, value);
                return false;
            }
            return true;
        });

    res.title = words.join(" ");
    return { level, item: res };
}

const map: Record<string, (item: Item, value: string | undefined) => void> = {
    "/c": (item) => (item.isOpen = false),
    "/vid": (item, value) => (item.videoId = value),
    "/channel": (item, value) => (item.channelId = value),
    "/playlist": (item, value) => (item.playlistId = value),
    "/img": (item, value) => (item.image = value),
    "/chTit": (item, value) => (item.channelTitle = value),
};

function sarializeToFile(root: Item) {
    const stack = root.children.map((item) => ({ item, level: 0 })).reverse();
    const lines: string[] = [];
    while (stack.length > 0) {
        let line = "";
        const { item, level } = stack.pop()!;

        // ignore files and folders and their children during serialization for now
        // if (item.handle) continue;

        line += `${repeat(" ", level * 2)}${item.title.trimStart()}`;

        const attributesFormatted = formatItemAttributes(item);
        if (attributesFormatted.length > 0) line += " " + attributesFormatted;

        lines.push(line);
        if (item.children.length > 0)
            stack.push(
                ...item.children
                    .map((i) => ({ item: i, level: level + 1 }))
                    .reverse()
            );
    }
    return lines.join("\n");
}

function formatItemAttributes(item: Item): string {
    const atrs: string[] = [];

    if (item.children.length > 0 && !item.isOpen) atrs.push("c");
    if (item.videoId) atrs.push("vid:" + item.videoId);
    if (item.channelId) atrs.push("channel:" + item.channelId);
    if (item.playlistId) atrs.push("playlist:" + item.playlistId);
    if (item.image) atrs.push("img:" + item.image);
    if (item.channelTitle) atrs.push("chTit:" + item.channelTitle);

    if (atrs.length > 0) return atrs.map((atr) => "/" + atr).join(" ");
    return "";
}

function repeat(str: string, times: number) {
    let res = "";
    for (let i = 0; i < times; i++) res += str;
    return res;
}
