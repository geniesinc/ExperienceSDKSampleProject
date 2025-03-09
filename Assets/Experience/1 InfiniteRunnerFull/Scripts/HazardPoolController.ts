import { GameObject, MonoBehaviour, Object, Vector3, Random, Time, WaitForSeconds, Mathf, Coroutine } from "UnityEngine";
import GameManager, { GameState } from "./GameManager";

export default class HazardPoolController extends MonoBehaviour {

    @Header("Enemy Settings")
    @SerializeField private prefab: GameObject;
    @SerializeField private amountToPool: int = 25;
    @SerializeField private enemySpeed: float = 20;
    @SerializeField private enemySpawnDelay: float = 1;
    
    private poolList: GameObject[] = [];
    private spawnPosition: Vector3 = new Vector3(0, 0.5, 100);

    private gameManager: GameManager;

    private canMove: bool = false;

    /** This coroutine will spawn enemies over time. */
    private coroutine: Coroutine;

    Start() {
        //Get GameManager singleton and add a listener to OnGameStateChange event
        this.gameManager = GameManager.Instance;
        this.gameManager.OnGameStateChange.addListener(this.CheckGameState);
        //Spawn the pool of enemies
        this.SpawnPool();
    }

    Update() {
        //Move enemies if playing
        if(this.canMove) {
            this.MoveEnemies();
        }
    }

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

    /** This will manage the enemies once the game starts. */
    private OnGamePlay() {
        this.ResetEnemies();
        this.coroutine = this.StartCoroutine(this.SpawnEnemies());
        this.canMove = true;
    }

    /** Resets all the enemies back to deactivated. */
    private ResetEnemies() {
        this.poolList.forEach ((enemy) => {
            enemy.SetActive(false);
        });
    }

    /** Moves all activated enemies. It also deactivates the offscreen ones. */
    private MoveEnemies() {
        this.poolList.forEach ((enemy) => {
            if(enemy.activeInHierarchy) {
                if (enemy.transform.position.z < -10) {
                    enemy.SetActive(false);
                }else{
                    enemy.transform.position = new Vector3(
                        enemy.transform.position.x, 
                        enemy.transform.position.y, 
                        enemy.transform.position.z - this.enemySpeed * Time.deltaTime);
                }
            }
        }); 
    }
    
    /** Spawns the initial pool of GameObjects and deactivates them. */
    private SpawnPool() {
        for(let i = 0; i < this.amountToPool; i++) {
            let temp = Object.Instantiate(this.prefab, this.transform) as GameObject;
            temp.SetActive(false);
            this.poolList[i] = temp;
        }
    }

    /** Coroutine that spawns a new enemy from the pool. */
    private *SpawnEnemies() {
        while(true) {
            yield null;
            //Get a deactivated enemy from the pool
            let enemy = this.GetPooledObject();
            if (enemy) {
                //Spawn in a random lane and activate
                let lane = Mathf.Floor(Random.Range(-1, 2));
                enemy.transform.position = new Vector3(
                    lane,
                    this.spawnPosition.y,
                    this.spawnPosition.z);
                enemy.SetActive(true);
            }
            yield new WaitForSeconds(this.enemySpawnDelay);
        }
    }
    
    /** @returns a deactivated GameObject from the pool. */
    private GetPooledObject() : GameObject {
        let result = null;
    
        for(let i = 0; i < this.amountToPool; i++) {
            let temp = this.poolList[i];
            if(!temp.activeInHierarchy) {
                result = temp;
                break;
            }
        }
    
        return result;
    }

    /** This will manage the enemies once the game ends. */
    private OnGameOver() {
        if(this.coroutine) {
            this.StopCoroutine(this.coroutine);
        }
        this.canMove = false;
    }
}