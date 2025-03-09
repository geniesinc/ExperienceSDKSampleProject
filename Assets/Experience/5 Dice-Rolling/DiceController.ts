import { GameObject, MonoBehaviour, Rigidbody, Vector3, Random, Input, WaitForSeconds, Mathf, } from "UnityEngine";
import { TMP_Text } from "TMPro";

export default class DiceController extends MonoBehaviour {

    @Header("Dice Properties")
    @SerializeField private die1: Rigidbody;
    @SerializeField private die2: Rigidbody;

    @SerializeField private rollStrength = 20;
    @SerializeField private spinStrength = 10;

    @SerializeField private margin = 0.005;

    @Header("Debug Properties")
    @SerializeField private showDebug: bool;
    @SerializeField private debugPanel: GameObject;
    @SerializeField private debugText: TMP_Text;

    @Space()
    @SerializeField private bannerText: TMP_Text;

    private defaultBannerText = "Tap to Roll";

    private Start() : void {
        //Show debug panel if option is active
        if(this.showDebug){
            this.debugPanel.SetActive(true);
            this.StartCoroutine(this.UpdateDebugText())
        }else{
            this.debugPanel.SetActive(false);
        }
    }

    private Update() : void {
        //If user touches screen and dice are not rolling, roll dice
        if(Input.touchCount > 0 && !this.AreDiceRolling()) {
            this.RollDie(this.die1);
            this.RollDie(this.die2);
            this.bannerText.text = "";
        }

        //If dice are not rolling and result is not shown yet
        if(this.bannerText.text == "" && !this.AreDiceRolling()) {
            //If roll is not clean for both dice, display bad roll
            if(this.TopDieNumber(this.die1) == 0 || this.TopDieNumber(this.die2) == 0) {
                this.bannerText.text = "Bad Roll";
            //else display the sum of the two dice
            }else{
                let sum = this.TopDieNumber(this.die1) + this.TopDieNumber(this.die2);
                this.bannerText.text = sum.toString();
            }
            
        }
    }

    /** Check if a die is planted on the ground within a certain degree of margin */
    private IsDiePlanted(die: Rigidbody) {
        let eulers = die.gameObject.transform.eulerAngles;
        let count = 0;
        if(eulers.x % 90 < this.margin || eulers.x % 90 > 90 - this.margin) {
            count += 1;
        }
        if(eulers.y % 90 < this.margin || eulers.y % 90 > 90 - this.margin) {
            count += 1;
        }
        if(eulers.z % 90 < this.margin || eulers.z % 90 > 90 - this.margin) {
            count += 1;
        }
        return count >= 2;
    }

    /** Deduce what side of a die is facing up and @returns the value of that side */
    private TopDieNumber(die: Rigidbody) {
        let eulers = die.gameObject.transform.eulerAngles;
        let value = 0;
        if(this.equalWithinMargin(eulers.x, 90)) {
            value = 6;
        }
        else if(this.equalWithinMargin(eulers.x, -90) || this.equalWithinMargin(eulers.x, 270)) {
            value = 1;
        }
        else if((this.equalWithinMargin(eulers.x, 0) && this.equalWithinMargin(eulers.z, 0)) ||
                (this.equalWithinMargin(eulers.x, 180) && this.equalWithinMargin(eulers.z, 180))) {
            value = 3;
        }
        else if((this.equalWithinMargin(eulers.x, 180) && this.equalWithinMargin(eulers.z, -90)) ||
                (this.equalWithinMargin(eulers.x, 180) && this.equalWithinMargin(eulers.z, 270)) ||
                (this.equalWithinMargin(eulers.x, 0) && this.equalWithinMargin(eulers.z, 90))) {
            value = 5;
        }
        else if((this.equalWithinMargin(eulers.x, 0) && this.equalWithinMargin(eulers.z, -90)) ||
                (this.equalWithinMargin(eulers.x, 0) && this.equalWithinMargin(eulers.z, 270)) ||
                (this.equalWithinMargin(eulers.x, 180) && this.equalWithinMargin(eulers.z, 90))) {
            value = 2;
        }
        else if((this.equalWithinMargin(eulers.x, 0) && this.equalWithinMargin(eulers.z, 180)) ||
                (this.equalWithinMargin(eulers.x, 180) && this.equalWithinMargin(eulers.z, 0))) {
            value = 4;
        }
        return value;
    }

    /** Helper function to see if a number is within another number's margin */
    private equalWithinMargin(num1: number, num2: number): bool {
        return num1 < num2 + this.margin && num1 > num2 - this.margin
    }

    /** Check if the dice are rolling using their velocity */
    private AreDiceRolling(): bool {
        return  this.die1.velocity.magnitude > 0 || 
                this.die2.velocity.magnitude > 0;
    }

    /** Roll a die with random velocity */
    private RollDie(die: Rigidbody) {
        die.velocity = new Vector3(
            Random.Range(-this.rollStrength, this.rollStrength), 
            this.rollStrength, 
            Random.Range(-this.rollStrength, this.rollStrength)
        );
        die.angularVelocity = new Vector3(
            Random.Range(-this.spinStrength, this.spinStrength), 
            Random.Range(-this.spinStrength, this.spinStrength), 
            Random.Range(-this.spinStrength, this.spinStrength)
        );
    }

    /** A debug panel to see the dice information as they roll and land */
    private *UpdateDebugText() {
        while(true) {
            let str = "Debug Text\n=======\n";
            str += "Dice 1 Vel Mag: " + Mathf.Floor(this.die1.velocity.magnitude).toString() + "\n";
            str += "Dice 2 Vel Mag: " + Mathf.Floor(this.die2.velocity.magnitude).toString() + "\n";
            str += "Dice Rolling: " + this.AreDiceRolling() + "\n";
            str += "Dice 1 Planted: " + this.IsDiePlanted(this.die1) + "\n";
            str += "Dice 2 Planted: " + this.IsDiePlanted(this.die2) + "\n";
            str += "Dice 1 Value: " + this.TopDieNumber(this.die1) + "\n";
            str += "Dice 2 Value: " + this.TopDieNumber(this.die2) + "\n";
            this.debugText.text = str;
            yield new WaitForSeconds(0);
        }
    }
}