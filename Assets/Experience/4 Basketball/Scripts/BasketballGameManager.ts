import { Debug, GameObject, MonoBehaviour, Vector3 } from "UnityEngine";

/** This is an enumerator to describe a game state. */
export enum GameState {
    INITIAL,
    LOADING,
    GAME_PLAY,
    GAME_OVER
}

export default class BasketballGameManager extends MonoBehaviour {

    /** This is an event triggered when the current GameState changes. */
    @NonSerialized public OnGameStateChange: GeniesEvent<[GameState]> = new GeniesEvent<[GameState]>();
    /** This is an event triggered when the player has made a shot. */
    @NonSerialized public OnShotMade: GeniesEvent<[]> = new GeniesEvent<[]>();
    /** This is an event when the player is attempting a shot. */
    @NonSerialized public OnShotAttempted: GeniesEvent<[Vector3, Vector3]> = new GeniesEvent<[Vector3, Vector3]>();

    /** This is an instance of the GameManager singleton. */
    @NonSerialized public static Instance: BasketballGameManager;

    /** The game's current GameState value. */
    private gameState: GameState;

    Awake() {
        //Create a singleton static instance reference
        if(BasketballGameManager.Instance == null) {
            BasketballGameManager.Instance = this;
        }else{
            GameObject.Destroy(this.gameObject);
        }
    }

    Start() {
        //Set the game state to LOADING at the Start
        this.ChangeGameState(GameState.LOADING);
        Debug.Log("Game Manager Started");
    }

    /** @returns the game's current GameState value */
    public GetGameState(): GameState {
        return this.gameState;
    }

    /**
     * This will set the current GameState value to a new value and trigger an event.
     * @param newState the new GameState value
     * @returns will return early if the new value equals the current value
     */
    public ChangeGameState(newState: GameState) {
        if (newState == this.gameState) {
            return;
        }
        //console.log("New Game State Change: ", newState)
        this.OnGameStateChange.trigger(newState);
        this.gameState = newState;
    }
}
