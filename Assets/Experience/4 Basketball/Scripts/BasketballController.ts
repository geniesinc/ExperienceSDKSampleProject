import { MonoBehaviour, Collider, GameObject, WaitForSeconds } from "UnityEngine";
import BasketballGameManager from "./BasketballGameManager";

export default class BasketballController extends MonoBehaviour {

    @SerializeField private resetTime = 4;

    private goodShot: bool;

    private gameManager: BasketballGameManager;

    Start() {
        ////Get GameManager singleton and reset ball coroutine
        this.gameManager = BasketballGameManager.Instance;
        this.StartCoroutine(this.InvokeReset());
    }

    /** Resets the ball after some time */
    private *InvokeReset() {
        yield new WaitForSeconds(this.resetTime);
        this.gameObject.SetActive(false);
    }

    /** Check if the ball entered the hoop cylinder above the rim */
    OnTriggerEnter(other: Collider) {
        if(other.gameObject.name == "Cylinder") {
            if(this.transform.position.y > other.gameObject.transform.position.y) {
                this.goodShot = true;
            }else{
                this.goodShot = false;
            }
        }
    }

    /** Check if the ball exited the hoop cylinder below the rim */
    OnTriggerExit(other: Collider){
        if(other.gameObject.name == "Cylinder") {
            if(this.transform.position.y < other.gameObject.transform.position.y && this.goodShot) {
                console.log("Good Shot!");
                this.gameManager.OnShotMade.trigger();
            }else{
                console.log("Bad Shot!")
            }
        }
    }
}