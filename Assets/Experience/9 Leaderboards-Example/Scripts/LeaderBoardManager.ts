import {GameObject, MonoBehaviour} from "UnityEngine";
import {GeniesExperienceSdk} from "Genies.Experience.Sdk";
import {GeniesLeaderboardSdk} from "Genies.Leaderboard";
import {TypeEnum} from "Genies.SDKServices.Model.LeaderboardSubmitUserScoreRequest";
import {Button} from "UnityEngine.UI";
import LeaderboardView from "./LeaderboardView";
import {LeaderboardUserRank} from "Genies.SDKServices.Model";

export default class LeaderboardManager extends MonoBehaviour {
    public leaderboard: GameObject
    public showButton: Button;
    public hideButton: Button;
    public incrementScore: Button;
    public leaderboardId: string;

    private async Awake() {
        
        const leaderboard = this.leaderboard.GetComponent<LeaderboardView>();
        
        this.showButton.gameObject.SetActive(false);
        this.hideButton.gameObject.SetActive(false);
        this.incrementScore.gameObject.SetActive(false);

        this.showButton.onClick.RemoveAllListeners();
        this.hideButton.onClick.RemoveAllListeners();
        this.incrementScore.onClick.RemoveAllListeners();
        
        this.showButton.onClick.AddListener(() => leaderboard.Show());
        this.hideButton.onClick.AddListener(() => leaderboard.Hide());
        this.incrementScore.onClick.AddListener(() => this.IncrementScore(leaderboard));

        await GeniesExperienceSdk.InitializeAsync();

        this.showButton.gameObject.SetActive(true);
        this.hideButton.gameObject.SetActive(true);
        this.incrementScore.gameObject.SetActive(true);

        leaderboard.SetDataAndInitialize(this.leaderboardId);
    }
    
    private async IncrementScore(leaderboard: LeaderboardView) {
        let currentScore  = await GeniesLeaderboardSdk.GetCurrentUserRankAsync(this.leaderboardId);
        if (currentScore != null) {
            GeniesLeaderboardSdk.SubmitCurrentUserScoreAsync(this.leaderboardId, currentScore.GameScore + 20, TypeEnum.DIRECT);
        }
        else {
            GeniesLeaderboardSdk.SubmitCurrentUserScoreAsync(this.leaderboardId, 20, TypeEnum.DIRECT);
        }
        leaderboard.SetDataAndInitialize(this.leaderboardId);
    }
}    