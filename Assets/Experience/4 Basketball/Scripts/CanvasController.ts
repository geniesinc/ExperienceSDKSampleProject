import { GameObject, Mathf, MonoBehaviour, WaitForSeconds, Time } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { TMP_Text } from "TMPro";
import BasketballGameManager, { GameState } from "./BasketballGameManager";

export default class CanvasController extends MonoBehaviour {

    @SerializeField private scoreText: TMP_Text;
    @SerializeField private timerText: TMP_Text;

    @SerializeField private topPanel: GameObject;
    @SerializeField private bannerText: TMP_Text;

    @SerializeField private midPanel: GameObject;
    @SerializeField private retryButton: Button;

    @SerializeField private timeAmount = 10;
    
    private score = 0;
    private timer = 0;
    private startTime = false;

    private gameManager: BasketballGameManager;

    Start() {
        //Get GameManager singleton and add listeners to events
        this.gameManager = BasketballGameManager.Instance;
        this.gameManager.OnGameStateChange.addListener(this.CheckGameState);
        this.gameManager.OnShotMade.addListener(this.ShotMade);
        this.retryButton.onClick.AddListener(() => {this.gameManager.ChangeGameState(GameState.GAME_PLAY)});
    }
    
    Update() {
        //If the timer has started, run the timer
        if(this.startTime) {
            this.RunTimer();
        }
    }

    /** Runs the timer down and checks if time runs out */
    private RunTimer() {
        this.timer -= Time.deltaTime;
        if(this.timer <= 0) {     
            this.gameManager.ChangeGameState(GameState.GAME_OVER);
        }
        this.DisplayTimer();
    }

    /** Manages the player logic when the game state changes. @param newState */
    private CheckGameState(newState: GameState) {
        switch(newState) {
            case GameState.GAME_PLAY:
                this.OnGamePlay();
                break;
            case GameState.GAME_OVER:
                this.OnGameOver();
                break;
        }
    }

    /** Resets the UI for the start of the game */
    private OnGamePlay() {
        this.topPanel.SetActive(false);
        this.midPanel.SetActive(false);
        this.score = 0;
        this.timer = this.timeAmount;
        this.DisplayScore();
        this.DisplayTimer();
        this.startTime = true;
    }

    /** Displays the Game Over UI */
    private OnGameOver() {
        this.timer = 0;
        this.DisplayTimer();
        this.startTime = false;
        this.StartCoroutine(this.DisplayGameOver());
    }

    /** Increases the score by 1 and updates UI */
    private ShotMade() {
        this.score += 1;
        this.DisplayScore();
        this.StartCoroutine(this.DisplayNiceShot())
    }

    /** Displays the timer UI */
    private DisplayTimer() {
        let seconds = Mathf.FloorToInt(this.timer);
        let milliseconds = Mathf.FloorToInt((this.timer * 100) % 100);
        let str1 = seconds.toString().padStart(2, "0");
        let str2 = milliseconds.toString().padStart(2, "0");
        this.timerText.text = str1 + ":" +str2;
    }

    /** Displays the score UI */
    private DisplayScore() {
        let str = this.score.toString();
        str = str.padStart(5, "0");
        this.scoreText.text = str;
    }

    /** Display the "nice shot" UI */
    private *DisplayNiceShot() {
        this.topPanel.SetActive(true);
        this.bannerText.text = "nice shot";
        yield new WaitForSeconds(0.5);
        this.topPanel.SetActive(false);
    }

    /** Displays the "game over" UI */
    private *DisplayGameOver() {
        yield new WaitForSeconds(1.5);
        this.topPanel.SetActive(true);
        this.bannerText.text = "game over";
        yield new WaitForSeconds(1.5);
        this.midPanel.SetActive(true);
    }
}
