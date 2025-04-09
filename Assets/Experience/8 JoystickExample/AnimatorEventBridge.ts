
import { MonoBehaviour } from "UnityEngine";

export enum AnimEventType {
    OnFootstep,
    OnLand
}

export default class AnimatorEventBridge extends MonoBehaviour {
    private _eventDict: { [key in AnimEventType]: ((animationEvent: AnimationEvent) => void) | null } = {
        [AnimEventType.OnFootstep]: null,
        [AnimEventType.OnLand]: null,
    };

    public Subscribe(type: AnimEventType, callback: (animationEvent: AnimationEvent) => void): void {
        this._eventDict[type] = (this._eventDict[type] || ((_) => {})) as (animationEvent: AnimationEvent) => void; //ensure it is not null before adding, if null, create a dummy function.
        this._eventDict[type] = (animationEvent) => {
            if(this._eventDict[type]){
                this._eventDict[type](animationEvent);
            }
            callback(animationEvent);
        };
    }

    public Unsubscribe(type: AnimEventType, callback: (animationEvent: AnimationEvent) => void): void {
        if (this._eventDict[type]) {
            let originalCallback = this._eventDict[type];
            this._eventDict[type] = (animationEvent) => {
                if(originalCallback){
                    originalCallback(animationEvent);
                }
            };
        }
    }

    private OnFootstep(animationEvent: AnimationEvent): void {
        this._eventDict[AnimEventType.OnFootstep]?.(animationEvent);
    }

    private OnLand(animationEvent: AnimationEvent): void {
        this._eventDict[AnimEventType.OnLand]?.(animationEvent);
    }
     
}
