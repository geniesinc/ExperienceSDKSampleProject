
import { Cursor, CursorLockMode, MonoBehaviour, Vector2 } from "UnityEngine";
import { InputValue } from "UnityEngine.InputSystem";
export default class CustomInput extends MonoBehaviour {
    
    public move: Vector2 = Vector2.zero;
    public look: Vector2 = Vector2.zero;
    public jump: boolean = false;
    public sprint: boolean = false;

    // [Header("Movement Settings")]
    public analogMovement: boolean = false;

    // [Header("Mouse Cursor Settings")]
    public cursorLocked: boolean = true;
    public cursorInputForLook: boolean = true;


    constructor() {
        super();
        this.OnMove = this.OnMove.bind(this);
        this.OnLook = this.OnLook.bind(this);
        this.OnJump = this.OnJump.bind(this);
        this.OnSprint = this.OnSprint.bind(this);
        this.MoveInput = this.MoveInput.bind(this);
        this.LookInput = this.LookInput.bind(this);
        this.JumpInput = this.JumpInput.bind(this);
        this.SprintInput = this.SprintInput.bind(this);
        this.OnApplicationFocus = this.OnApplicationFocus.bind(this);
        this.SetCursorState = this.SetCursorState.bind(this);
    }

    //#if ENABLE_INPUT_SYSTEM
    public OnMove(value: InputValue): void {
        this.MoveInput(value.Get<Vector2>());
    }

    public OnLook(value: InputValue): void {
        if (this.cursorInputForLook) {
            this.LookInput(value.Get<Vector2>());
        }
    }

    public OnJump(value: InputValue): void {
        this.JumpInput(value.isPressed);
    }

    public OnSprint(value: InputValue): void {
        this.SprintInput(value.isPressed);
    }
    //#endif


    public MoveInput(newMoveDirection: Vector2): void {
        this.move = newMoveDirection;
    }

    public LookInput(newLookDirection: Vector2): void {
        this.look = newLookDirection;
    }

    public JumpInput(newJumpState: boolean): void {
        this.jump = newJumpState;
    }

    public SprintInput(newSprintState: boolean): void {
        this.sprint = newSprintState;
    }

    private OnApplicationFocus(hasFocus: boolean): void {
        this.SetCursorState(this.cursorLocked);
    }

    private SetCursorState(newState: boolean): void {
        Cursor.lockState = newState ? CursorLockMode.Locked : CursorLockMode.None;
    }
}
