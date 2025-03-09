import { Debug, GameObject, MonoBehaviour, Rigidbody, Vector3 } from "UnityEngine";
import BasketballGameManager, { GameState } from "./BasketballGameManager";

export default class BasketballPoolController extends MonoBehaviour {
    @SerializeField private prefab: GameObject;
    @SerializeField private amount: number;
    
    private objects: GameObject[] = [];

    private gameManager: BasketballGameManager;

    private Awake() {
        //Get GameManager singleton
        this.gameManager = BasketballGameManager.Instance;
        //Add listeners to GameManager events
        this.gameManager.OnGameStateChange.addListener(this.CheckGameState);
        this.gameManager.OnShotAttempted.addListener(this.ShootBall);
    }

    /** Manages the player logic when the game state changes. @param newState */
    private CheckGameState(newState: GameState) {
        switch(newState) {
            case GameState.LOADING:
                console.log("Loading");
                this.SpawnObjects();
                break;
            case GameState.GAME_PLAY:
                this.OnGamePlay();
                break;
            case GameState.GAME_OVER:
                this.OnGameOver();
                break;
        }
    }

    /** When a game starts, deactivate all the balls */
    private OnGamePlay() {
        this.DeactivateAll();
    }

    /** Once the time runs out, the balls should pause mid air */
    private OnGameOver() {
        for(let i = 0; i < this.objects.length; i++) {
            this.objects[i].GetComponent<Rigidbody>().useGravity = false;
        }
    }

    /** Shoots a new basketball @param Vector3 position to spawn ball @param Vector3 the force applied to ball */
    private ShootBall(position: Vector3, force: Vector3) {
        let basketball = this.GetBasketball();
        basketball.SetActive(true);
        basketball.transform.position = position;
        let rb = basketball.GetComponent<Rigidbody>();
        rb.useGravity = true;
        rb.AddForce(force);
    }

    /** Spawns the initial pool of objects */
    private SpawnObjects() {
        Debug.Log("Spawning Objects");
        for (let i = 0; i < this.amount; i++) {
            let temp = GameObject.Instantiate(this.prefab, this.transform) as GameObject;
            this.objects[i] = temp;
            temp.SetActive(false);
        }
    }

    /** Gets a deactivated object from the pool */
    private GetBasketball(): GameObject {
        let result = null;
    
        for(let i = 0; i < this.objects.length; i++) {
            if(!this.objects[i].activeInHierarchy) {
                result = this.objects[i];
                break;
            }
        }
    
        return result;
    }

    /** Sets all the objects as deactivated */
    private DeactivateAll(): void {
        for(let i = 0; i < this.objects.length; i++) {
            this.objects[i].SetActive(false);
        }
    }
}