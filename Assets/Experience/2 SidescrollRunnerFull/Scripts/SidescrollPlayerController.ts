import { MonoBehaviour, Input, Vector3, Mathf, Time, Animator, Collider, RuntimeAnimatorController, Vector2, Touch, TouchPhase, Debug, WaitForSeconds, Rigidbody, ForceMode, Collision } from 'UnityEngine';

import { GeniesAvatar, GeniesAvatarsSdk } from 'Genies.Avatars.Sdk';
import SidescrollGameManager, { GameState }  from './SidescrollGameManager';

export default class SidescrollPlayerController extends MonoBehaviour {
    
    @Header("Player Settings")
    @SerializeField private playerSpeed: float = 2;
    @SerializeField private jumpForce : float = 5;
    @SerializeField private playerAnimator: RuntimeAnimatorController;
    @SerializeField private swipeThreshold : float = 50.0; // Minimum swipe distance

    private startTouchPosition : Vector2;
    private currentTouchPosition : Vector2;
    private swipeDetected : bool = false;

    private userAvatar : GeniesAvatar;
    private gameManager : SidescrollGameManager;

    private playerRigidbody : Rigidbody;

    private canMove : bool = false;

    async Start() {
        //Get GameManager singleton and add a listener to OnGameStateChange event
        this.gameManager = SidescrollGameManager.Instance;
        this.gameManager.OnGameStateChange.addListener(this.CheckGameState);
        //Initialize the SDK
        await GeniesAvatarsSdk.InitializeAsync();
        //Load the user Avatar
        this.userAvatar = await GeniesAvatarsSdk.LoadUserAvatarAsync("UserAvatar", this.transform, this.playerAnimator);

        this.StartCoroutine(this.WaitForAvatar());

        this.playerRigidbody = this.GetComponent<Rigidbody>();
    }

    Update() {
        //If game is playing, check for touch swipe and move player accordingly
        if(this.canMove) {
            this.CheckSwipe();
        }
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

    /** This will manage the player once the game starts. */
    private OnGamePlay() {
        this.canMove = true;
        this.userAvatar.Animator.SetFloat("idle_run_walk", 1);
    }
    
    /** Determines if the mouse swipes and sets a new target lane based on direction. */
    private CheckSwipe(){
        if (Input.touchCount > 0)
            {
                let touch : Touch = Input.GetTouch(0);
    
                switch (touch.phase)
                {
                    case TouchPhase.Began:
                        this.startTouchPosition = touch.position;
                        this.swipeDetected = false;
                        break;
    
                    case TouchPhase.Moved:
                        this.currentTouchPosition = touch.position;
                        let deltaPosition : Vector2 = this.currentTouchPosition - this.startTouchPosition;
    
                        if ( deltaPosition.magnitude > this.swipeThreshold && !this.swipeDetected)
                        {
                            let x = deltaPosition.x;
                            let y = deltaPosition.y;

                            if (Mathf.Abs(y) > Mathf.Abs(x))
                            {
                                if (y > 0)
                                {
                                    Debug.Log("Swipe Up");
                                    this.OnSwipeUp();
                                }
                                else
                                {
                                    Debug.Log("Swipe Down");
                                    this.OnSwipeDown();
                                }
                            }
                            this.startTouchPosition = this.currentTouchPosition; //prevent multiple swipes from one touch.
                            this.swipeDetected = true;
                        }
                        break;
    
                    case TouchPhase.Ended:
                        this.swipeDetected = false;
                        break;
                    case TouchPhase.Canceled:
                        this.swipeDetected = false;
                        break;
                }
            }
    }

    private OnSwipeUp() {
        this.playerRigidbody.AddForce(Vector3.up * this.jumpForce, ForceMode.Impulse);
    }

    private OnSwipeDown() {
        //Not implemented
    }

    OnCollisionEnter(coll: Collision) {
        //End game if colliding with enemy
        if (coll.gameObject.tag == "Enemy") {
            coll.gameObject.SetActive(false);

            this.canMove = false;
            this.userAvatar.Animator.SetFloat("idle_run_walk", 0);
            this.userAvatar.Animator.SetTrigger("slip");

            this.gameManager.ChangeGameState(GameState.GAME_OVER);
        }
    }
    
    /** This will manage the player once the game ends. */
    private OnGameOver() {
        // Not implemented
    }

    private *WaitForAvatar() {
        while(!this.userAvatar) {
            yield null;
        }
        Debug.Log("Avatar Loaded");
        this.gameManager.ChangeGameState(GameState.LOADING);
    }

    
}