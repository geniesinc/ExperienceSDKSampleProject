
import { MonoBehaviour, RuntimeAnimatorController } from "UnityEngine";
import AvatarController from "./AvatarController";
import { GeniesAvatar, GeniesAvatarsSdk } from "Genies.Avatars.Sdk";
import AnimatorEventBridge from "./AnimatorEventBridge";
export default class CreateGeniesAvatar extends MonoBehaviour {
    
    public animatorController: RuntimeAnimatorController;
    public autoSpawn: boolean = true;

    public DidSpawn: boolean = false;

    private _avatarController: AvatarController;

    async Start(): Promise<void> {
        this._avatarController = this.GetComponent<AvatarController>();
        if (this.autoSpawn) {
            await this.SpawnAvatarAsync();
        }
    }

    public async SpawnAvatarAsync(): Promise<GeniesAvatar> {
        const avatar: GeniesAvatar = await GeniesAvatarsSdk.LoadUserAvatarAsync(
            "User Avatar",
            this.transform,
            this.animatorController,
            false
        );
        this.DidSpawn = true;
        const animatorEventBridge: AnimatorEventBridge = avatar.Root.gameObject.AddComponent<AnimatorEventBridge>() as AnimatorEventBridge;
        if (this._avatarController != null) {
            this._avatarController.SetAnimatorEventBridge(animatorEventBridge);
        }
        return avatar;
    }
}
