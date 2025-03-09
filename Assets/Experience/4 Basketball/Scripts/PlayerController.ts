import { Animator, Input, Mathf, MonoBehaviour, Vector3, Rigidbody, Time, WaitForSeconds, RuntimeAnimatorController } from "UnityEngine";
import { GeniesAvatar, GeniesAvatarsSdk } from "Genies.Avatars.Sdk";
import BasketballGameManager, { GameState } from "./BasketballGameManager";

/**
 * //TODO: Fix the ShootBall method so the swipe actually shoots the ball correctly
 */

export default class PlayerController extends MonoBehaviour {

    @SerializeField private playerAnimatorController: RuntimeAnimatorController;

    @Header("Shoot Properties")
    @SerializeField private MinSwipeDist = 30;
    @SerializeField private MaxSwipeTime = 0.5;
    @SerializeField private ForceMult = 0.25;

    /** A cheat code to have a "perfect" shot and make it every time */
    @Header("Debug Properties")
    @SerializeField private PerfectShot: bool;
    @SerializeField private PerfectForce: Vector3 = new Vector3(0, 420, 350);

    private startTime: number;
    private startPos: Vector3;

    private swipeTime: number;
    private swipeVector: Vector3;

    private basketballSpawnPos = new Vector3(0, 1.5, 12.15);

    private touching: bool = false;
    private throwing: bool = false;

    private gameManager: BasketballGameManager;

    private canShoot = false;

    private userAvatar: GeniesAvatar;

    async Start() {
        //Get GameManager singleton and add a listener to OnGameStateChange event
        this.gameManager = BasketballGameManager.Instance;
        this.gameManager.OnGameStateChange.addListener(this.CheckGameState);
        //Load user Avatar
        await GeniesAvatarsSdk.InitializeAsync();
        this.userAvatar = await GeniesAvatarsSdk.LoadUserAvatarAsync("UserAvatar", this.transform, this.playerAnimatorController);
        //Start Game
        this.gameManager.ChangeGameState(GameState.GAME_PLAY);
    }

    Update() {
        //Check if the user swipes when it can shoot
        if(this.canShoot) {
            this.CheckSwipe();
        }
    }

    /** Manages the player logic when the game state changes. @param newState */
    private CheckGameState(newState: GameState) {
        switch(newState) {
            case GameState.GAME_PLAY:
                this.canShoot = true;
                break;
            case GameState.GAME_OVER:
                this.canShoot = false;
                break;
        }
    }

    /** Check if the user is starting or ending a swipe */
    private CheckSwipe() {
        if(Input.touchCount > 0) {
            if(this.touching == false && this.throwing == false) {
                this.touching = true;
                this.startTime = Time.time;
                this.startPos = Input.mousePosition;
            }
        }else{
            if(this.touching) {
                this.touching = false;
                this.swipeVector = Vector3.op_Subtraction(Input.mousePosition, this.startPos);
                this.swipeTime = Time.time - this.startTime;
                if (this.swipeTime < this.MaxSwipeTime && this.swipeVector.magnitude > this.MinSwipeDist){
                    this.StartCoroutine(this.ShootAnimation());
                } 
            }
        }
    }

    /** Manage the shooting animation and triggering the ball launch */
    private *ShootAnimation() {
        this.throwing = true;
        this.userAvatar.Animator.SetTrigger("Throw");
        yield new WaitForSeconds(0.92);
        this.ShootBall();
        yield new WaitForSeconds(1.38);
        this.throwing = false;
    }

    /** Launch the ball based on the direction of the swipe */
    private ShootBall() {
        let swipeVelocity = Vector3.op_Division(this.swipeVector, this.swipeTime);
        let forceVector = new Vector3(swipeVelocity.x, swipeVelocity.y, swipeVelocity.magnitude)
        let force = Vector3.op_Multiply(forceVector, this.ForceMult);
        let x = this.ReLerp(force.x, -1000, 1000, -150, 150);
        let y = this.ReLerp(force.y, 0, 2000, 100, 750);
        let z = this.ReLerp(force.z, 0, 2000, 100, 750);
        let forceCapped = this.PerfectShot ? this.PerfectForce : new Vector3(x, y, z);

        this.gameManager.OnShotAttempted.trigger(this.basketballSpawnPos, forceCapped);
    }

    /** Helper function to relerp a value from one range to another */
    private ReLerp(value: number, a: number, b: number, c: number, d: number): number {
        return Mathf.Lerp(c, d, Mathf.InverseLerp(a, b, value));
    }
}