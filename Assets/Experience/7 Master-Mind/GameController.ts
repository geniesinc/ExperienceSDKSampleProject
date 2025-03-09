import { GeniesAvatar, GeniesAvatarsSdk } from "Genies.Avatars.Sdk";
import { TMP_Text } from "TMPro";
import { Animator, Color, GameObject, MonoBehaviour, Random, Mathf, Vector3, Quaternion, WaitForSeconds, RuntimeAnimatorController } from "UnityEngine";
import { Button, Image } from "UnityEngine.UI";

/**
 * Master Mind
 * A classic game where the player must guess a code
 * Similar to Wordle, except it uses colors
 * The Avatar will animate if they win or lose
 */

export default class GameController extends MonoBehaviour {

    @Header("UI Objects")
    @SerializeField private decoderPanel: GameObject;
    @SerializeField private resultsPanel: GameObject;
    @SerializeField private resultsText: TMP_Text;
    @SerializeField private retryButton: Button;
    @SerializeField private titlePanel: GameObject;
    @SerializeField private playButton: Button;

    @Header("Player Animations")
    @SerializeField playerAnimator: RuntimeAnimatorController;

    private userAvatar: GeniesAvatar;

    private colors: Color[] = [
        Color.white,   //0
        Color.red,     //1
        Color.green,   //2
        Color.blue,    //3
        Color.magenta, //4
        Color.cyan     //5
    ];
    private rowsAmount: number = 10;

    private currentGuess: number;

    private correctGuess: bool;

    private solution: number[];
    
    async Start() {
        //Reset game at Start and deactivate Play button
        this.ResetGame();
        this.playButton.interactable = false;
        //Load the Genies Avatar and then activate Play button
        await GeniesAvatarsSdk.InitializeAsync();
        this.userAvatar = await GeniesAvatarsSdk.LoadUserAvatarAsync("UserAvatar", this.transform, this.playerAnimator);
        this.userAvatar.Root.transform.eulerAngles = new Vector3(0, 180, 0);
        this.retryButton.onClick.AddListener(this.ResetGame);
        this.playButton.onClick.AddListener(this.HideTitle);
        this.playButton.interactable = true;
    }

    /** Hide title screen when the play button is pressed */
    private HideTitle() {
        this.titlePanel.SetActive(false);
    }

    /** Reset the game to title screen with new board and solution */
    private ResetGame() {
        if (this.userAvatar) {
            this.userAvatar.Animator.SetTrigger("Idle");
        }
        
        this.decoderPanel.SetActive(true);
        this.resultsPanel.SetActive(false);
        this.titlePanel.SetActive(true);

        this.currentGuess = 0;
        this.correctGuess = false;
        this.solution = [];

        for (let i = 0; i < 4; i++) {
            this.solution[i] = Mathf.Floor(Random.Range(0, this.colors.length));
        }

        console.log("Solution: ", this.solution.toString());

        for (let i = 0; i < this.rowsAmount; i++) {
            let row = this.decoderPanel.transform.GetChild(i);
            let guessImages = row.GetChild(0).GetComponentsInChildren<Image>();
            for(let j = 0; j < guessImages.length; j++) {
                guessImages[j].color = this.colors[0];
            }
            let feedbackImages = row.GetChild(1).GetComponentsInChildren<Image>();
            for(let j = 0; j < feedbackImages.length; j++) {
                feedbackImages[j].color = this.colors[0];
            }
            let submitButton = row.GetChild(2).GetComponentInChildren<Button>();
            submitButton.gameObject.SetActive(true);
            row.gameObject.SetActive(false);
        }

        this.DisplayRow(this.currentGuess);
    }

    /** Displays a new row of buttons @param number row number */
    private DisplayRow(rowNumber: number) : void {
        if(rowNumber >= this.rowsAmount || rowNumber < 0) {
            console.log("Invalid row number to display");
            return;
        }
        let row = this.decoderPanel.transform.GetChild(rowNumber);
        row.gameObject.SetActive(true);
        let guessButtons = row.GetChild(0).GetComponentsInChildren<Button>();
        guessButtons.forEach(btn => {
            btn.onClick.AddListener(() => { 
                let colorIndex = this.GetColorIndex(btn.gameObject.GetComponent<Image>().color);
                let nextColorIndex = colorIndex + 1 < this.colors.length ? colorIndex + 1 : 0;
                btn.gameObject.GetComponent<Image>().color = this.colors[nextColorIndex];
            });
        });
        let submitButton = row.GetChild(2).GetComponentInChildren<Button>();
        submitButton.onClick.AddListener(this.CheckResults);
    }

    /** Checks if the player has lost or won when they submit a row */
    private CheckResults() : void {
        this.LockRow(this.currentGuess);
        this.DisplayResults(this.currentGuess);
        if(this.correctGuess) {
            this.resultsPanel.SetActive(true);
            this.resultsText.text = "You Win";
            this.decoderPanel.SetActive(false);
            this.userAvatar.Animator.SetTrigger("Dance");
        }else if(this.currentGuess >= this.rowsAmount - 1) {
            this.resultsPanel.SetActive(true);
            this.resultsText.text = "You Lose";
            this.decoderPanel.SetActive(false);
            this.userAvatar.Animator.SetTrigger("Cry");
        }else {
            this.currentGuess = this.currentGuess + 1;
            this.DisplayRow(this.currentGuess);
        }
    }

    /** Display the results after a row of buttons is submitted */
    private DisplayResults(rowNumber: number) : void {
        if(rowNumber >= this.rowsAmount || rowNumber < 0) {
            console.log("Invalid row number to display results");
            return;
        }
        let row = this.decoderPanel.transform.GetChild(rowNumber);
        let guessImages = row.GetChild(0).GetComponentsInChildren<Image>();
        let solutionIndexes = [];
        let guessIndexes = [];
        for(let i = 0; i < guessImages.length; i++) {
            let img = guessImages[i];
            let colorIndex = this.GetColorIndex(img.color);
            guessIndexes[i] = colorIndex;
            solutionIndexes[i] = this.solution[i];
        }
        let correctPosition = 0;
        let correctColor = 0;
        for(let i = 0; i < guessIndexes.length; i++) {
            if(guessIndexes[i] == solutionIndexes[i]) {
                correctPosition += 1;
                guessIndexes[i] = -1;
                solutionIndexes[i] = -1;
            }
        }
        for(let i = 0; i < guessIndexes.length; i++) {
            if(guessIndexes[i] != -1 && solutionIndexes.includes(guessIndexes[i])) {
                correctColor += 1;
                solutionIndexes[i] = -1;
            }
        }
        if(correctPosition >= 4) {
            this.correctGuess = true;
        }
        let feedbackImages = row.GetChild(1).GetComponentsInChildren<Image>();
        for(let i = 0; i < feedbackImages.length; i++) {
            if(correctPosition > 0) {
                feedbackImages[i].color = Color.green;
                correctPosition -= 1;
            }else if(correctColor > 0) {
                feedbackImages[i].color = Color.red;
                correctColor -= 1;
            }
        }
    }

    /** Once a row is submitted it will be locked and not clickable */
    private LockRow(rowNumber: number) : void {
        if(rowNumber >= this.rowsAmount || rowNumber < 0) {
            console.log("Invalid row number to lock");
            return;
        }
        let row = this.decoderPanel.transform.GetChild(rowNumber);
        let guessButtons = row.GetChild(0).GetComponentsInChildren<Button>();
        guessButtons.forEach(btn => {
            btn.onClick.RemoveAllListeners();
        });
        let submitButton = row.GetChild(2).GetComponentInChildren<Button>();
        submitButton.onClick.RemoveAllListeners();
        submitButton.gameObject.SetActive(false);
    }

    /** @returns the index of a certain color */
    private GetColorIndex(color: Color) : number {
        for(let i = 0; i < this.colors.length; i++) {
            let c = this.colors[i];
            if(c == color) {
                return i;
            }
        }
        return 0;
    }
}