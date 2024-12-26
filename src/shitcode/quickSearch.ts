import { removeChar } from "../actions";
import { AppState } from "../index";
import { scrollToItemView } from "../scroll";
import { ctx, view } from "../utils/canvas";
import { View } from "../view";
import { colors } from "../consts";

export const quickSearchState = {
    isActive: false,
    term: "",
    results: [] as View[],
    focusedAt: 0,
};

function updateResults(state: AppState) {
    const { results } = state.quickSearch;
    results.splice(0, results.length);

    const term = state.quickSearch.term.toLocaleLowerCase();
    for (let i = 0; i < state.views.length; i++) {
        const view = state.views[i];
        if (view.item.title.toLocaleLowerCase().indexOf(term) >= 0)
            results.push(view);
    }

    state.quickSearch.focusedAt = 0;
    scrollIntoFocusedAt(state);
}

function scrollIntoFocusedAt(state: AppState) {
    const { results, focusedAt } = state.quickSearch;
    if (results.length > 0) {
        scrollToItemView(results[focusedAt]);
        state.selectedItem = results[focusedAt].item;
    }
}

export function quickSearchKeyPress(state: AppState, e: KeyboardEvent) {
    const { quickSearch } = state;
    if (e.code == "Escape") {
        quickSearch.isActive = false;
        quickSearch.term = "";
        quickSearch.results = [];
    } else if (e.code == "KeyJ" && e.metaKey) {
        if (quickSearch.focusedAt == quickSearch.results.length - 1)
            quickSearch.focusedAt = 0;
        else quickSearch.focusedAt++;

        scrollIntoFocusedAt(state);
        e.preventDefault();
    } else if (e.code == "KeyK" && e.metaKey) {
        if (quickSearch.focusedAt > 0) quickSearch.focusedAt--;
        else quickSearch.focusedAt = quickSearch.results.length - 1;

        scrollIntoFocusedAt(state);
        e.preventDefault();
    } else if (e.code == "Backspace") {
        const term = quickSearch.term;
        quickSearch.term = removeChar(term, term.length - 1);
        updateResults(state);
    } else if (e.key.length == 1) {
        quickSearch.term += e.key;
        updateResults(state);
    }
}

export function showQuickSearch(state: AppState) {
    state.quickSearch.isActive = true;
}

export function viewQuickSearch(state: AppState) {
    const { quickSearch } = state;
    if (!quickSearch.isActive) return;

    ctx.save();

    const height = 30;
    const width = 300;
    ctx.fillStyle = colors.modalBg;
    const left = view.x - width - 100;
    ctx.fillRect(left, 0, width, height);

    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(quickSearch.term, left + 10, height / 2);

    if (quickSearch.term.length > 0) {
        ctx.textAlign = "right";
        ctx.fillStyle = "red";
        ctx.fillText(
            `${quickSearch.focusedAt + 1} / ${quickSearch.results.length}`,
            left + width - 10,
            height / 2
        );
    }

    ctx.restore();
}
