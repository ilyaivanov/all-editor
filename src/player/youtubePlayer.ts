import { state } from "../index";
import { Item } from "../tree/tree";
import { loadVideoInfo } from "../youtube/video";

export const youtubeIframeId = "youtubeIframe";

var player: YoutubePlayer;
var videoRequested: string | undefined;
var requestedTimeline: number | undefined;
var isLoadingPlayer = false;
var isReady = false;

//taken from https://developers.google.com/youtube/iframe_api_reference#playing-a-video
interface YoutubePlayer {
    //queries
    getCurrentTime(): number;
    getVideoLoadedFraction(): number;
    getDuration(): number;
    getVolume(): number;
    getPlayerState(): PlayerState;

    //actions
    loadVideoById(videoId: string): void;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;

    //Accepts an integer between 0 and 100.
    setVolume(volume: number): void;

    //The allowSeekAhead parameter determines whether the player will make a new request to the server
    //if the seconds parameter specifies a time outside of the currently buffered video data.
    //
    //We recommend that you set this parameter to false while the user drags the mouse along a video progress bar
    //and then set it to true when the user releases the mouse.
    //This approach lets a user scroll to different points of a video without requesting new video streams
    //by scrolling past unbuffered points in the video. When the user releases the mouse button,
    //the player advances to the desired point in the video and requests a new video stream if necessary.
    seekTo(seconds: number, allowSeekAhead: boolean): void;
}

enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PLAUSED = 2,
    BUFFERING = 3,
    VIDEO_CUED = 5,
}
declare const YT: any;

export function play(videoId: string, at?: number) {
    requestedTimeline = at;
    if (!player && !isLoadingPlayer) init();
    else if (isReady) {
        if (videoRequested != videoId) player.loadVideoById(videoId);
        else if (typeof requestedTimeline == "number")
            player.seekTo(requestedTimeline, true);
    }
    videoRequested = videoId;
}

function init() {
    isLoadingPlayer = true;
    const tag = document.createElement("script");

    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    //@ts-ignore
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

//@ts-ignore
global.onYouTubeIframeAPIReady = () => {
    isLoadingPlayer = false;
    if (!document.getElementById(youtubeIframeId))
        throw new Error(
            `Can't find Youtube IFrame element with id "${youtubeIframeId}". Check that you added that element into the DOM`
        );
    player = new YT.Player(youtubeIframeId, {
        height: "100%",
        width: "100%",
        videoId: videoRequested,
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            // enablejsapi: 1,
            // origin: "localhost:8080",
        },
        events: {
            onReady: () => {
                if (typeof requestedTimeline == "number")
                    player.seekTo(requestedTimeline, true);

                progressInterval = setInterval(onTick, 200);
                isReady = true;
            },
            onStateChange: onPlayerStateChange,
        },
    });

    (document as any).player = player;
};

let progressInterval: NodeJS.Timeout | undefined;
function onPlayerStateChange(event: any) {
    const playerState: PlayerState = event.data;
    if (playerState === PlayerState.ENDED) {
        document.dispatchEvent(new CustomEvent("video-ended"));
    }

    if (playerState === PlayerState.PLAYING) {
        if (state.itemPlaying) {
            const duration = player.getDuration();

            // remove application specific code from the player
            if (typeof state.itemPlaying.timeline != "number") {
                updateVideoDuration(state.itemPlaying, duration);
                if (!state.itemPlaying.videoInfoLoaded)
                    loadVideoInfo(state.itemPlaying);
            }
        }

        if (!progressInterval) progressInterval = setInterval(onTick, 200);
    } else {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = undefined;
        }
    }
}

const onTick = () => document.dispatchEvent(new CustomEvent("video-progress"));

export type PlayerProgressState = {
    duration: number;
    loadedFraction: number;
    currentTime: number;
};

export const getPlayerProgressState = (): PlayerProgressState => {
    return {
        currentTime: player.getCurrentTime(),
        loadedFraction: player.getVideoLoadedFraction(),
        duration: player.getDuration(),
    };
};
export const getVolume = () => player.getVolume();
export const setVolume = (v: number) => player.setVolume(v);

export const getDuration = (): number => player.getDuration();
export const hasVideo = (): boolean => isReady;
export const seek = (time: number, allowSeekAhead: boolean) =>
    player.seekTo(time, allowSeekAhead);
export const pause = () => player.pauseVideo();
export const resume = () => player.playVideo();

export function updateVideoDuration(item: Item, duration: number) {
    item.durationTime = duration;
    item.durationFormattted = formatDuration(duration);
}
export function formatDuration(t: number) {
    const oneHour = 60 * 60;
    if (t < oneHour) return formatTimeOmitHour(t);
    return formatTime(t);
}

export const formatTimeOmitHour = (t: number) => {
    let minutes = Math.floor(t / 60);
    let seconds = Math.round(t % 60);
    return pad(minutes, 2) + ":" + pad(seconds, 2);
};

export const formatTime = (t: number) => {
    let hours = Math.floor(t / 60 / 60);
    let minutes = Math.floor(t / 60) - 60 * hours;
    let seconds = Math.round(t % 60);
    return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
};

function pad(n: any, max: number): string {
    const str = n.toString();
    return str.length < max ? pad("0" + str, max) : str;
}
