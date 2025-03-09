import { GameObject, MonoBehaviour } from "UnityEngine";

/** This is an enumerator to describe a game state. */
export enum GameState {
    INITIAL,
    LOADING,
    GAME_PLAY,
    GAME_OVER 
}

export default class SidescrollGameManager extends MonoBehaviour {

    /** This is an event that is triggered when the current GameState changes. */
    @NonSerialized public OnGameStateChange: GeniesEvent<[GameState]> = new GeniesEvent<[GameState]>();
    /** This is an instance of the GameManager singleton. */
    @NonSerialized public static Instance: SidescrollGameManager;
    /** The game's current GameState value. */
    private gameState: GameState;

    Awake() {
        //Establishes the GameManager singleton instance
        if(SidescrollGameManager.Instance == null) {
            SidescrollGameManager.Instance = this;
        }else{
            GameObject.Destroy(this.gameObject);
        }
    }

    Start() {
        //Set the game state to LOADING at the Start
        //this.ChangeGameState(GameState.LOADING);
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
        console.log("New Game State Change: ", newState)
        this.OnGameStateChange.trigger(newState);
        this.gameState = newState;
    }
}
