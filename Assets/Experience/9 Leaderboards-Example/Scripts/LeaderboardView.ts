// LeaderboardView.ts

import {Canvas, Color, GameObject, MonoBehaviour, RectTransform, Sprite, Vector2,} from "UnityEngine";
import {Button, ScrollRect} from "UnityEngine.UI";
import {GeniesLeaderboardSdk} from "Genies.Leaderboard";
import {
    LeaderboardGetRanksResponse,
    LeaderboardGetTopNRanksResponse,
    LeaderboardUserRank
} from "Genies.SDKServices.Model";
import {Ease} from "DG.Tweening";
import {GeniesLoginSdk} from "Genies.Login.Native";
import {Ref$1} from "Genies.Refs";
import {GeniesProfilesSdk, IconResolution} from "Genies.Profiles.Sdk";
import LeaderboardEntryView from "./LeaderboardViewEntry";

export default class LeaderboardView extends MonoBehaviour {
    @SerializeField private podiumEntries: LeaderboardEntryView[] = [];

    @SerializeField private firstPlace!: Color;
    @SerializeField private secondPlace!: Color;
    @SerializeField private thirdPlace!: Color;

    @SerializeField private userPlaceColor!: Color;
    @SerializeField private userColorListEntryBackground!: Color;
    @SerializeField private userColorListEntryScoreTextColor!: Color;
    @SerializeField private nonUserColorListEntryScoreTextColor!: Color;

    @SerializeField private noScoresMessaging!: GameObject;
    @SerializeField private scrollRect!: ScrollRect;
    @SerializeField private contentParent!: RectTransform;
    @SerializeField private entryViewPrefab!: LeaderboardEntryView;

    private _leaderboardId: string = "";
    private myUserId: string = "";
    private scrollEntryAnimationOffset: number = 0;

    private userImages: Map<string, Sprite> = new Map();
    private listViewElementLookup: Map<string, LeaderboardEntryView> = new Map();
    private listViewElementsInOrder: LeaderboardEntryView[] = [];
    private downloadsInProgress: Set<string> = new Set();
    
    // We'll hold the podium colors (first/second/third)
    @NonSerialized private podiumColors: Color[] = [];

    public SetDataAndInitialize(leaderboardId: string): void {
        this._leaderboardId = leaderboardId;
        this.podiumColors = [this.firstPlace, this.secondPlace, this.thirdPlace];

        this.FigureOutOffset();
        this.GetInitialDataAndSetup();
    }

    private FigureOutOffset(): void {
        // Calculate how many items fit in the viewport so we can center user’s entry
        const scrollRectTransform = this.scrollRect.GetComponent<RectTransform>();
        const viewportHeight = scrollRectTransform.rect.height;
        const itemHeight = this.entryViewPrefab.RectTransform.rect.height;

        // We'll place the user entry near the vertical center
        const capacity = viewportHeight / itemHeight - 1;
        this.scrollEntryAnimationOffset = (capacity / 2) * itemHeight;
    }

    private async GetInitialDataAndSetup(): Promise<void> {
        this.myUserId = await GeniesLoginSdk.GetUserIdAsync();

        // Top 3 ranks for the podium
        const topNRanks = await this.GetTopNScores(this.podiumEntries.length);

        // Ranks around the user (maybe ~50 above, ~30 below, etc.)
        const ranksAroundUser = await this.GetUserScoresAroundRank();

        // Combine them
        let rawList = topNRanks.UserRanks != null ? topNRanks.UserRanks.ToArray() : [];
        if (ranksAroundUser?.UserRanks) {
            rawList = rawList.concat(ranksAroundUser.UserRanks.ToArray());
        }

        // Filter out invalid user ranks
        const filteredList = rawList.filter((r) => this.IsValidToShowOnTheLeaderboard(r));

        // Remove duplicates by rank
        let finalList = filteredList.reduce((acc: LeaderboardUserRank[], rank) => {
            
            if (!acc.find((x) => x.Rank == rank.Rank)) {
                acc.push(rank);
            }
            return acc;
        }, []);

        // Sort by rank ascending
        finalList = finalList.sort((a, b) => a.Rank - b.Rank);

        this.DrawUserRanks(finalList);
    }

    private isNullOrWhitespace(str: string | null | undefined): boolean {
        return !str || str.trim().length === 0;
    }
    
    private IsValidToShowOnTheLeaderboard(leaderboardUserRank: LeaderboardUserRank): boolean {
        if (this.isNullOrWhitespace(leaderboardUserRank.UserId)) return false;
        if (this.isNullOrWhitespace(leaderboardUserRank.PrefUsername)) return false;
        
        return true;
        
    }

    private async GetTopNScores(limit: number = 10): Promise<LeaderboardGetTopNRanksResponse> {
        return GeniesLeaderboardSdk.GetTopNRanksAsync(this._leaderboardId, limit);
    }

    private async GetUserScoresAroundRank(): Promise<LeaderboardGetRanksResponse | null> {
        return GeniesLeaderboardSdk.GetRanksAroundUserAsync(this._leaderboardId, 50, 30);
    }

    public async DownloadUserImages(userRanks: LeaderboardUserRank[]): Promise<void> {
        let tasks: Array<Promise<string>> = [];

        for (const user of userRanks) {
            if (!this.userImages.has(user.UserId) && !this.downloadsInProgress.has(user.UserId)) {
                // Wrap the promise to remove it when it resolves.
                const promise = this.GetAvatarImageForUser(user).then(userId => {
                    
                    // Update the UI if it still exists
                    if (this.listViewElementLookup.has(userId) && this.userImages.has(userId)) {
                        const entry = this.listViewElementLookup.get(userId)!;
                        entry.AvatarImage.sprite = this.userImages.get(userId)!;
                    }
                    
                    this.downloadsInProgress.delete(userId);

                    // Remove the resolved promise from tasks.
                    tasks = tasks.filter(p => p !== promise);
                    return userId;
                });
                tasks.push(promise);
                this.downloadsInProgress.add(user.UserId);
            } else if (this.userImages.has(user.UserId) && this.listViewElementLookup.has(user.UserId)) {
                // Already loaded, just update the sprite in the UI
                const entry = this.listViewElementLookup.get(user.UserId)!;
                entry.AvatarImage.sprite = this.userImages.get(user.UserId)!;
            } else {
                console.error(
                    `LeaderboardView::DownloadUserImages - Something went wrong with user ID ${user.UserId}: ` +
                    `Is userID in userImages? ${this.userImages.has(user.UserId)} ` +
                    `Is userID in listViewElementLookup? ${this.listViewElementLookup.has(user.UserId)} ` +
                    `Is userID in downloadsInProgress? ${this.downloadsInProgress.has(user.UserId)}`
                );
            }
        }

        // If there are no new downloads required, just exit
        if (tasks.length === 0) return;

        // Wait for all tasks to finish (they're already removing themselves on resolution)
        await Promise.all(tasks);
    }

    private async GetAvatarImageForUser(user: LeaderboardUserRank): Promise<string> {
        const result: Ref$1<Sprite> = await GeniesProfilesSdk.LoadProfileIconAsync(
            user.UserId,
            IconResolution.Ultra
        );

        this.userImages.set(user.UserId, result.Item);
        return user.UserId;
    }

    private DrawUserRanks(userRanks: LeaderboardUserRank[]): void {
        // Clear the old references
        this.listViewElementLookup.clear();

        const topCount = Math.min(userRanks.length, this.podiumEntries.length);

        // 1. Handle top N (podium) ranks
        const topThree = userRanks.slice(0, topCount);
        this.SetupPodium(topThree);

        // Remaining ranks for the scrolling list
        const remainder = userRanks.slice(topCount);

        // If no remainder, show "no scores" messaging
        if (remainder.length === 0) {
            this.noScoresMessaging.SetActive(true);
            return;
        }
        this.noScoresMessaging.SetActive(false);

        // Make sure our listViewElementsInOrder has the same count as `remainder`
        if (this.listViewElementsInOrder.length > remainder.length) {
            // We have more elements than needed, remove extras
            for (let i = this.listViewElementsInOrder.length - 1; i >= remainder.length; i--) {
                const view = this.listViewElementsInOrder[i];
                GameObject.Destroy(view.gameObject);
                this.listViewElementsInOrder.splice(i, 1);
            }
        } else if (this.listViewElementsInOrder.length < remainder.length) {
            // We have fewer elements than needed, add new ones
            for (let i = this.listViewElementsInOrder.length; i < remainder.length; i++) {
                const entry = GameObject.Instantiate<LeaderboardEntryView>(this.entryViewPrefab, this.contentParent.transform);
                this.listViewElementsInOrder.push(entry);
            }
        }

        let indexOfUserEntry = 0;

        // Assign data to each row
        for (let i = 0; i < this.listViewElementsInOrder.length; i++) {
            const rankData = remainder[i];
            const entryView = this.listViewElementsInOrder[i];

            entryView.NameText.text = rankData.PrefUsername;
            entryView.RankText.text = rankData.Rank.toString();

            // current score or highest score
            const displayScore =
                rankData.GameScore != null ? rankData.GameScore : rankData.HighestScore;
            entryView.ScoreText.text = displayScore?.toString() || "0";

            // Color for user vs non-user
            entryView.ScoreText.color =
                rankData.UserId === this.myUserId
                    ? this.userColorListEntryScoreTextColor
                    : this.nonUserColorListEntryScoreTextColor;

            entryView.BackgroundImage.color =
                rankData.UserId === this.myUserId
                    ? this.userColorListEntryBackground
                    : entryView.BackgroundImage.color;

            entryView.ScoreBackgroundImage.color =
                rankData.UserId === this.myUserId
                    ? this.userPlaceColor
                    : entryView.ScoreBackgroundImage.color;

            this.listViewElementLookup.set(rankData.UserId, entryView);

            if (rankData.UserId === this.myUserId) {
                indexOfUserEntry = i;
            }
        }

        // Start the avatar image downloads
        this.DownloadUserImages(remainder);

        // Scroll to the user’s row if we have any rows
        if (this.listViewElementsInOrder.length > 0) {
            this.SnapTo(this.listViewElementsInOrder[indexOfUserEntry], indexOfUserEntry);
        }
    }

    private SetupPodium(userRanks: LeaderboardUserRank[]): void {
        
        for (let i = 0; i < userRanks.length; i++) {
            const rankData = userRanks[i];
            const podiumEntry = this.podiumEntries[i];

            podiumEntry.NameText.text = rankData.PrefUsername;
            podiumEntry.RankText.text = rankData.Rank.toString();

            // current or highest
            const displayScore =
                rankData.GameScore != null ? rankData.GameScore : rankData.HighestScore;
            podiumEntry.ScoreText.text = displayScore?.toString() || "0";

            // Color the text or background if it’s the local user
            podiumEntry.ScoreText.color =
                rankData.UserId === this.myUserId
                    ? this.userColorListEntryScoreTextColor
                    : this.nonUserColorListEntryScoreTextColor;

            const colorForRank = rankData.UserId === this.myUserId
                ? this.userPlaceColor
                : this.podiumColors[i];

            podiumEntry.BackgroundImage.color = colorForRank;
            podiumEntry.ScoreBackgroundImage.color = colorForRank;

            // Track so we can update the avatar
            this.listViewElementLookup.set(rankData.UserId, podiumEntry);
        }

        this.DownloadUserImages(userRanks);
    }
    
    private SnapTo(entryView: LeaderboardEntryView, index: number): void {
        // Force layout so we can get correct positions
        Canvas.ForceUpdateCanvases();
        
        const itemHeight = entryView.RectTransform.rect.height;
        let pos = index * itemHeight;
        pos -= this.scrollEntryAnimationOffset;

        // If the user is near the top, no need to scroll at all:
        if (pos > 0) {
            // Move the contentParent with a tween
            const target = new Vector2(this.contentParent.localPosition.x, this.contentParent.localPosition.y);
            target.y = pos;
            this.contentParent.DOAnchorPos(target, 1.0).SetEase(Ease.InOutQuad);
        }
    }

    public Show(): void {
        this.gameObject.SetActive(true);
    }
    
    public Hide(): void {
        this.gameObject.SetActive(false);
    }
}
