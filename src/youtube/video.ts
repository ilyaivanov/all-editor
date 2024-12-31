import { getVideoComments, getVideoInfo } from "../player/youtubeApi";
import { updateVideoDuration } from "../player/youtubePlayer";
import { Item, itemVideo } from "../tree/tree";

const timeStamp = new RegExp("(\\d+:)?\\d+:\\d+");

export async function loadVideoInfo(videoItem: Item) {
    const videoId = videoItem.videoId;
    if (videoId && !videoItem.videoInfoLoaded) {
        const res = await getVideoInfo(videoId);
        videoItem.videoInfoLoaded = true;

        const snippet = res?.items[0]?.snippet;
        if (snippet) {
            if (!videoItem.channelTitle)
                videoItem.channelTitle = snippet.channelTitle;
            if (!videoItem.channelId) videoItem.channelId = snippet.channelId;

            const timelineFromDescription = findVideoTimeline(
                snippet.description
            );
            if (timelineFromDescription) {
                console.log(
                    "Adding timeline from description",
                    snippet.description
                );
                addChildrenFromTimeline(videoItem, timelineFromDescription);
            } else if (
                videoItem.durationTime &&
                videoItem.durationTime > 20 * 60
            ) {
                const comments = await getVideoComments(videoId);
                for (let i = 0; i < comments.items.length; i++) {
                    const commentText =
                        comments.items[i].snippet.topLevelComment.snippet
                            .textOriginal;

                    const commentTimeline = findVideoTimeline(commentText);
                    if (commentTimeline) {
                        console.log(
                            "Adding timeline from a comment",
                            commentTimeline
                        );
                        addChildrenFromTimeline(videoItem, commentTimeline);
                        break;
                    }
                }
            }
        }
    }
}

function addChildrenFromTimeline(item: Item, timeline: TimelineInfo[]) {
    const items = timeline.map((info) => {
        const res = itemVideo(info.label, item.videoId!);
        res.channelId = item.channelId;
        res.channelTitle = item.channelTitle;
        return res;
    });

    //TODO: assumes videoItem has a duration, which is a race condition.
    // I need to sync iframe player and youtube API

    for (let i = 0; i < timeline.length - 1; i++) {
        const duration = timeline[i + 1].time - timeline[i].time;

        updateVideoDuration(items[i], duration);
    }

    for (let i = 0; i < timeline.length; i++) {
        items[i].timeline = timeline[i].time;
    }

    if (item.durationTime)
        updateVideoDuration(
            items[items.length - 1],
            item.durationTime - timeline[timeline.length - 1].time
        );

    item.children.push(...items);
    items.forEach((i) => (i.parent = item));
}

type TimelineInfo = { label: string; time: number };
function findVideoTimeline(text: string): TimelineInfo[] | undefined {
    const lines = text.split("\n");

    const lineLines = lines.map((line) => ({
        line,
        hasTimeline: timeStamp.test(line),
    }));

    let longestCommonTimelineStart = 0;
    let longestCommonTimelineEnd = 0;
    let currentSequenceStart = 0;
    let currentSequenceEnd = 0;
    let isInsideSequence = false;
    for (let i = 0; i < lineLines.length; i++) {
        const { hasTimeline } = lineLines[i];
        if (!isInsideSequence && hasTimeline) {
            currentSequenceStart = i;
            currentSequenceEnd = i;
            isInsideSequence = true;
        } else if (isInsideSequence && hasTimeline) {
            currentSequenceEnd = i;
        } else if (isInsideSequence && !hasTimeline) {
            if (
                longestCommonTimelineEnd - longestCommonTimelineStart <
                currentSequenceEnd - currentSequenceStart
            ) {
                longestCommonTimelineStart = currentSequenceStart;
                longestCommonTimelineEnd = currentSequenceEnd;
            }
            isInsideSequence = false;
        }
    }

    if (
        longestCommonTimelineEnd - longestCommonTimelineStart <
        currentSequenceEnd - currentSequenceStart
    ) {
        longestCommonTimelineStart = currentSequenceStart;
        longestCommonTimelineEnd = currentSequenceEnd;
    }

    if (longestCommonTimelineEnd - longestCommonTimelineStart < 2)
        return undefined;

    const itemsInfos = lineLines
        .slice(longestCommonTimelineStart, longestCommonTimelineEnd + 1)
        .map(({ line: l }) => {
            const res = timeStamp.exec(l)!;
            const time = res[0];
            const label =
                l.slice(0, res.index) + l.slice(res.index + time.length);

            return { label: trimTimeline(label), time: parseTime(time) };
        });

    return itemsInfos;
}

function parseTime(time: string) {
    const parts = time.split(":");
    let totalTime = 0;
    let multiplier = 1;
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.trim().length > 0) {
            const val = Number.parseInt(part);
            totalTime += val * multiplier;
            multiplier *= 60;
        }
    }
    return totalTime;
}

function trimTimeline(label: string) {
    let start = 0;
    while (label[start] == " " || label[start] == "\t" || label[start] == "-")
        start++;

    label = label.slice(start);
    return label.trimEnd();
}
