import { render, state } from "../index";
import { saveItemsToLocalStorage } from "../persistance.storage";
import { item, Item } from "../tree/tree";
import { findPlaylistVideos, PageInfo } from "./youtubeApi";

function createLoadModeItem(base: Item, nextPageToken: string) {
    const loadMore = item("Load more... ");
    loadMore.nextPageToken = nextPageToken;

    loadMore.playlistId = base.playlistId;

    loadMore.channelTitle = base.channelTitle;
    loadMore.channelId = base.channelId;
    loadMore.nextPageForPlaylist = base;

    return loadMore;
}

function updatePlaylistItemsCount(playlistItem: Item, pageInfo: PageInfo) {
    playlistItem.playlistCount = pageInfo.totalResults;
    playlistItem.playlistLoaded = Math.min(
        (playlistItem.playlistLoaded || 0) + pageInfo.resultsPerPage,
        playlistItem.playlistCount
    );
}

export async function loadPlaylist(playlistItem: Item) {
    if (playlistItem.playlistId) {
        playlistItem.isLoading = true;
        const vids = await findPlaylistVideos(playlistItem.playlistId);
        playlistItem.isLoading = false;

        updatePlaylistItemsCount(playlistItem, vids.pageInfo);

        const newItems = [...vids.items];

        if (vids.pageInfo.nextPageToken)
            newItems.push(
                createLoadModeItem(playlistItem, vids.pageInfo.nextPageToken)
            );

        playlistItem.children.push(...newItems);
        newItems.forEach((i) => (i.parent = playlistItem));
        playlistItem.isOpen = true;

        // saveItemsToLocalStorage(state);
        render();
    }
}

export async function loadNextPage(loadMoreItem: Item) {
    if (loadMoreItem.playlistId && loadMoreItem.nextPageToken) {
        const playlistItem = loadMoreItem.nextPageForPlaylist;

        loadMoreItem.isLoading = true;
        const vids = await findPlaylistVideos(
            loadMoreItem.playlistId,
            loadMoreItem.nextPageToken
        );
        loadMoreItem.isLoading = false;

        if (playlistItem) {
            updatePlaylistItemsCount(playlistItem, vids.pageInfo);
        }

        const index = loadMoreItem.parent.children.indexOf(loadMoreItem);

        const newItems = [...vids.items];

        if (vids.pageInfo.nextPageToken && playlistItem)
            newItems.push(
                createLoadModeItem(playlistItem, vids.pageInfo.nextPageToken)
            );

        loadMoreItem.parent.children.splice(index, 1, ...newItems);
        newItems.forEach((i) => (i.parent = loadMoreItem.parent));

        if (state.selectedItem == loadMoreItem)
            state.selectedItem = newItems[0];

        // saveItemsToLocalStorage(state);
        render();
    }
}
