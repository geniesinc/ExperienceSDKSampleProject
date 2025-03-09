import { Coroutine, GameObject, MonoBehaviour, WaitForSeconds } from "UnityEngine";
import { CloudSaveStorage } from "Genies.Experience.CloudSave";
import { Button } from "UnityEngine.UI";
import { TMP_Text } from "TMPro";
import GameManager, { GameState } from "./GameManager";

export default class CanvasController extends MonoBehaviour {
    
    @Header("Main Menu UI References")
    @SerializeField private loadingPanel: GameObject;
    @SerializeField private playButton: Button;
    @SerializeField private globalHighScoreText: TMP_Text;

    @Header("Game Scene UI References")
    @SerializeField private scorePanel: GameObject;
    @SerializeField private scoreText: TMP_Text;


    @Header("Game Over UI References")
    @SerializeField private gameOverPanel: GameObject;
    @SerializeField private replayButton: Button;
    @SerializeField private menuButton: Button;
    @SerializeField private personalHighScoreText: TMP_Text;
    @SerializeField private gameOverScoreText: TMP_Text;
    @SerializeField private gameOverGlobalHighScoreText: TMP_Text;

    private score: float = 0;

    private personalStorageKey: string = "PersonalStorageKey";
    private globalStorageKey: string = "GlobalStorageKey";
    private floatHighScoreKey: string = "FloatHighScoreKey";

    private personalString: string = "Personal Best: ";
    private globalString: string = "Global Best: ";

    private personalStorage: CloudSaveStorage;
    private globalStorage: CloudSaveStorage;

    private gameManager: GameManager;

    /** This coroutine will increase and update the score over time. */
    private scoreCoroutine: Coroutine;
    private gameOverCoroutine: Coroutine;

    Start() {
        //Get GameManager singleton and add a listener to OnGameStateChange event
        this.gameManager = GameManager.Instance;
        this.gameManager.OnGameStateChange.addListener(this.CheckGameState);

        //Add listeners to the Button click events
        this.replayButton.onClick.AddListener(this.OnReplayButtonPressed);
        this.menuButton.onClick.AddListener(this.OnMenuButtonPressed);
        this.playButton.onClick.AddListener(this.OnGamePlayButtonPressed);
        
        //Initialize both high scores
        this.InitializeHighScores();

        //Disable the play button until the avatar is loaded
        this.playButton.interactable = false;
    }

    /** Manages the enemy logic when the game state changes. @param newState */
    private CheckGameState(newState: GameState) {
        switch(newState) {
            case GameState.LOADING:
                this.OnLoading();
                break;
            case GameState.GAME_PLAY:
                this.OnGamePlay();
                break;
            case GameState.GAME_OVER:
                this.OnGameOver();
                break;
        }
    }

    /** This will manage the canvas once the Avatar is loading. */
    private OnLoading() {
        this.scorePanel.SetActive(false);
        this.gameOverPanel.SetActive(false);
        this.loadingPanel.SetActive(true);
        this.playButton.interactable = true;
    }

    private OnGamePlay() {
        this.gameOverPanel.SetActive(false);
        this.scorePanel.SetActive(true);
        this.loadingPanel.SetActive(false);
        this.score = 0;
        this.scoreCoroutine = this.StartCoroutine(this.StartScore());
    }

    /** This will manage the canvas once the game ends. */
    private OnGameOver() {
        this.gameOverCoroutine = this.StartCoroutine(this.WaitForGameOver());
        this.gameOverScoreText.text = "Score: " + this.score;
        this.CheckHighScore(this.personalStorage, this.personalHighScoreText, this.personalString);
        this.CheckHighScore(this.globalStorage, this.globalHighScoreText, this.globalString);
        if(this.scoreCoroutine) {
            this.StopCoroutine(this.scoreCoroutine);
        }
        this.LoadHighScore(this.globalStorage, this.gameOverGlobalHighScoreText, this.globalString);
    }

    /** This will manage the canvas once the game starts. */
    private OnGamePlayButtonPressed() {
        this.gameManager.ChangeGameState(GameState.GAME_PLAY);
    }

    /** Set the game state back to replay the game. */
    private OnReplayButtonPressed() {
        this.gameManager.ChangeGameState(GameState.GAME_PLAY);
        if(this.gameOverCoroutine) {
            this.StopCoroutine(this.gameOverCoroutine);
        }
    }

    /** Set the game state back to replay the game. */
    private OnMenuButtonPressed() {
        this.gameManager.ChangeGameState(GameState.LOADING);
        if(this.gameOverCoroutine) {
            this.StopCoroutine(this.gameOverCoroutine);
        }
    }

    /** Initialize and load both the personal and global high scores. */
    private InitializeHighScores() {
        //Initialize Personal High Score
        this.personalStorage = new CloudSaveStorage(this.personalStorageKey, false);
        this.LoadHighScore(this.personalStorage, this.personalHighScoreText, this.personalString);
        //Initialize Global High Score
        this.globalStorage = new CloudSaveStorage(this.globalStorageKey, true);
        this.LoadHighScore(this.globalStorage, this.globalHighScoreText, this.globalString);
        this.LoadHighScore(this.globalStorage, this.gameOverGlobalHighScoreText, this.globalString);
    }

    /** This coroutine will increase and update the score every hundredths of a second. */
    private *StartScore() {
        while(true) {
            this.score += 1;
            this.scoreText.text = "Score: " + this.score;
            yield new WaitForSeconds(0.01);
        }
    }

    /**
     * This loads a high score from storage and then displays it to a text object.
     * * It will also create a new stored high score if it does not find a stored one.
     * @param storage the CloudSaveStorage to load from
     * @param textObj  the text object to change the text
     * @param highScoreString the leading string to prepend to the text
     */
    private async LoadHighScore(storage: CloudSaveStorage, textObj: TMP_Text, highScoreString: string) {
        await storage.Load();
        if (storage.Has(this.floatHighScoreKey)) {
            let highScore = storage.GetFloat(this.floatHighScoreKey);
            textObj.text = highScoreString + highScore.toString();
        }else{
            storage.SetFloat(this.floatHighScoreKey, 0);
            textObj.text = highScoreString + "0";
            await storage.Save();
        }
    }

    /**
     * This checks if a stored high score is less than the current score.
     * * If it is, then the high score is updated in storage and text.
     * @param storage the CloudSaveStorage storing the high score
     * @param textObj the high score text object
     * @param highScoreString the leading string to prepend to the text
     */
    private async CheckHighScore(storage: CloudSaveStorage, textObj: TMP_Text, highScoreString: string) {
        await storage.Load();
        if (storage.Has(this.floatHighScoreKey)) {
            let highScore = storage.GetFloat(this.floatHighScoreKey);
            if(this.score > highScore) {
                storage.SetFloat(this.floatHighScoreKey, this.score);
                textObj.text = highScoreString + this.score.toString();
                await storage.Save();
            }
        }
    }

    private *WaitForGameOver() {
        while(true) {
            yield new WaitForSeconds(2);

            this.gameOverPanel.SetActive(true);
            this.loadingPanel.SetActive(false);
            this.scorePanel.SetActive(false);
        }
    }
}