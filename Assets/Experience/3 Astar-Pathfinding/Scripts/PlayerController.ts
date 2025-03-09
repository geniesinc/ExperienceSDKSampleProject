import { Animator, Camera, GameObject, Input, MonoBehaviour, Physics, RaycastHit, RuntimeAnimatorController, WaitForSeconds } from "UnityEngine";
import MapController from "./MapController";
import { GeniesAvatar, GeniesAvatarsSdk } from "Genies.Avatars.Sdk";

export default class PlayerController extends MonoBehaviour {
    @SerializeField private mapGenerator: MapController;
    @SerializeField private walkSpeed: number = 1;
    @SerializeField private playerAnimatorController: RuntimeAnimatorController;

    private canMove = false;

    private userAvatar: GeniesAvatar;

    async Start() {
        this.mapGenerator.OnPathFound.addListener((path: GameObject[])=> {
            console.log("Path received!");
            this.canMove = false;
            this.StartCoroutine(this.WalkPath(path));
            path.forEach((tile: GameObject) => {
                console.log(tile.name);
            });
        })
        await GeniesAvatarsSdk.InitializeAsync();
        this.userAvatar = await GeniesAvatarsSdk.LoadUserAvatarAsync("UserAvatar", this.transform, this.playerAnimatorController);
        this.canMove = true;
    }

    private *WalkPath(path: GameObject[]) {
        this.userAvatar.Animator.SetFloat("idle_run_walk", 0.5);

        for(let i = 0; i < path.length; i++) {
            this.transform.LookAt(path[i].transform.position);
            this.transform.DOMove(path[i].transform.position, this.walkSpeed);
            yield new WaitForSeconds(this.walkSpeed);
        }

        this.userAvatar.Animator.SetFloat("idle_run_walk", 0);
        this.canMove = true;
    }

    Update() {
        if(this.canMove && Input.touchCount > 0) {
            let ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            //Create a reference for the Raycast method parameter
            let ref = $ref<RaycastHit>();
            if (Physics.Raycast(ray, ref)) {
                //Release the reference to obtain the value
                let hitInfo = ref.value;
                let obj = hitInfo.collider.gameObject;
                console.log(`Hit ${obj.name}`);
                if(obj.tag == "Tile") {
                    this.mapGenerator.CheckTargetPath(this.gameObject, obj);
                }
            } else {
                console.log(`Failed to Detect Collision`);
            }
        }
    }
}