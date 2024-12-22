import { removeChar } from "./actions";
import { AppState } from "./index";
import { forEachChild, Item } from "./tree/tree";
import { ctx, setFont, view } from "./utils/canvas";
import { colors, typography } from "./view";

type ModalFocus = "unfocus" | "title";

export function showModal(state: AppState) {
    state.searchModal.focusOn = "title";
}

export const searchInit = {
    text: "",
    position: 0,
    focusOn: "unfocus" as ModalFocus,
    selectedIndex: 0,
    results: [] as Item[],
};

function updateSearch(state: AppState) {
    const { searchModal } = state;
    searchModal.results.splice(0, searchModal.results.length);

    const term = searchModal.text.toLocaleLowerCase();
    forEachChild(state.root, (item) => {
        if (item.title.toLocaleLowerCase().indexOf(term) >= 0)
            searchModal.results.push(item);
    });
}
export function handleModalKey(state: AppState, e: KeyboardEvent) {
    const { searchModal } = state;
    if (e.metaKey && e.code == "KeyA") {
        searchModal.position--;
        e.preventDefault();
    } else if (e.metaKey && e.code == "KeyF") {
        searchModal.position++;
        e.preventDefault();
    } else if (e.metaKey && e.code == "KeyJ") {
        searchModal.selectedIndex++;
    } else if (e.metaKey && e.code == "KeyK") {
        searchModal.selectedIndex--;
    } else if (e.metaKey && e.code == "KeyH") {
        searchModal.selectedIndex--;
    } else if (e.code == "Backspace") {
        searchModal.text = removeChar(
            searchModal.text,
            searchModal.position - 1
        );
        searchModal.position--;

        if (searchModal.text.length > 0) updateSearch(state);
    } else if (e.code == "Escape") {
        searchModal.focusOn = "unfocus";
    } else if (e.code == "KeyM" && e.metaKey) {
        state.focused = searchModal.results[searchModal.selectedIndex];
        state.selectedItem = state.focused;
        searchModal.focusOn = "unfocus";
        state.searchModal.text = "";
        e.preventDefault();
    } else if (e.key.length == 1) {
        searchModal.text += e.key;
        searchModal.position++;

        updateSearch(state);
    }
}

export function viewModal(state: AppState) {
    const { searchModal } = state;

    if (searchModal.focusOn == "unfocus") return;

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, view.x, view.y);

    ctx.globalAlpha = 1;
    const width = view.x / 2;
    const height = view.y / 2;

    ctx.fillStyle = "black";
    ctx.filter = "blur(6px)";
    ctx.fillRect(view.x / 2 - width / 2, 0, width, height);
    ctx.fillStyle = colors.modalBg;
    ctx.filter = "blur(0px)";
    ctx.fillRect(view.x / 2 - width / 2, 0, width, height);

    let inputWidth = width - 10;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(view.x / 2 - inputWidth / 2, 5, inputWidth, 30);

    setFont(13);
    const ms = ctx.measureText(
        state.searchModal.text.slice(0, state.searchModal.position)
    );

    const textheight = ms.fontBoundingBoxAscent + ms.fontBoundingBoxDescent;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(
        state.searchModal.text,
        view.x / 2 - inputWidth / 2 + 4,
        7 + 12 / 2 + textheight / 2
    );

    ctx.fillRect(
        view.x / 2 - inputWidth / 2 + 4 + ms.width,
        7 + 12 / 2 + textheight / 2 - 8,
        1,
        textheight
    );

    let y = 35 + 5 + 10;
    let x = view.x / 2 - width / 2 + 10;
    let res = searchModal.results;
    for (let i = 0; i < Math.min(res.length, 10); i++) {
        if (i == searchModal.selectedIndex) {
            ctx.fillStyle = colors.bg;
            ctx.fillRect(x, y - textheight / 2, width, textheight);
        }
        ctx.fillStyle = "white";
        ctx.fillText(res[i].title, x, y);

        y += textheight * typography.lineHeight;
    }
}
