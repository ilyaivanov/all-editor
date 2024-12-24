import { render, state } from "../index";
import { saveItemsToLocalStorage } from "../persistance.storage";
import { item, Item } from "../tree/tree";
import { findPlaylistVideos, getChannelInfo, PageInfo } from "./youtubeApi";

function createLoadModeItem(base: Item, nextPageToken: string) {
    const loadMore = item("Load more... ");
    loadMore.nextPageToken = nextPageToken;

    loadMore.playlistId = base.playlistId;

    loadMore.channelTitle = base.channelTitle;
    loadMore.channelId = base.channelId;
    loadMore.nextPageForItem = base;

    return loadMore;
}

function updatePlaylistItemsCount(playlistItem: Item, pageInfo: PageInfo) {
    playlistItem.remoteTotalItemsCount = pageInfo.totalResults;
    playlistItem.remoteLoadedItemsCount = Math.min(
        (playlistItem.remoteLoadedItemsCount || 0) + pageInfo.resultsPerPage,
        playlistItem.remoteTotalItemsCount
    );
}

export async function loadItem(itemToLoad: Item) {
    const loadingFunction = itemToLoad.playlistId
        ? () => findPlaylistVideos(itemToLoad.playlistId!)
        : () => getChannelInfo(itemToLoad.channelId!);

    itemToLoad.isLoading = true;
    const response = await loadingFunction();
    itemToLoad.isLoading = false;

    updatePlaylistItemsCount(itemToLoad, response.pageInfo);

    const newItems = [...response.items];

    if (response.pageInfo.nextPageToken) {
        const loadMore = createLoadModeItem(
            itemToLoad,
            response.pageInfo.nextPageToken
        );
        newItems.push(loadMore);
    }

    itemToLoad.children.push(...newItems);
    newItems.forEach((i) => (i.parent = itemToLoad));
    itemToLoad.isOpen = true;

    saveItemsToLocalStorage(state);
    render();
}

export async function loadNextPage(loadMoreItem: Item) {
    if (!loadMoreItem.nextPageToken) return;
    const loader = loadMoreItem.playlistId
        ? () =>
              findPlaylistVideos(
                  loadMoreItem.playlistId!,
                  loadMoreItem.nextPageToken
              )
        : () =>
              getChannelInfo(
                  loadMoreItem.channelId!,
                  loadMoreItem.nextPageToken
              );

    const { nextPageForItem } = loadMoreItem;

    loadMoreItem.isLoading = true;
    const vids = await loader();
    loadMoreItem.isLoading = false;

    if (nextPageForItem) {
        updatePlaylistItemsCount(nextPageForItem, vids.pageInfo);
    }

    const index = loadMoreItem.parent.children.indexOf(loadMoreItem);

    const newItems = [...vids.items];

    if (vids.pageInfo.nextPageToken && nextPageForItem)
        newItems.push(
            createLoadModeItem(nextPageForItem, vids.pageInfo.nextPageToken)
        );

    loadMoreItem.parent.children.splice(index, 1, ...newItems);
    newItems.forEach((i) => (i.parent = loadMoreItem.parent));

    if (state.selectedItem == loadMoreItem) state.selectedItem = newItems[0];

    saveItemsToLocalStorage(state);
    render();
}
