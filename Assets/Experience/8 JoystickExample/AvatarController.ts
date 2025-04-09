
import { Animator, AudioClip, AudioSource, CharacterController, Color, GameObject, Gizmos, Input, LayerMask, Mathf, MonoBehaviour, Physics, Quaternion, QueryTriggerInteraction, Random, Time, Vector3 } from "UnityEngine";
import AnimatorEventBridge, { AnimEventType } from "./AnimatorEventBridge";
import { InputSystem, PlayerInput } from "UnityEngine.InputSystem";
import CustomInput from "./CustomInput";
export default class AvatarController extends MonoBehaviour {
    public MoveSpeed: number = 2.0;
    public SprintSpeed: number = 5.335;
    public RotationSmoothTime: number = 0.12;
    public SpeedChangeRate: number = 10.0;
    public LandingAudioClip: AudioClip | null = null;
    public FootstepAudioClips: AudioClip[] = [];
    public FootstepAudioVolume: number = 0.5;
    public JumpHeight: number = 1.2;
    public Gravity: number = -15.0;
    public JumpTimeout: number = 0.50;
    public FallTimeout: number = 0.15;
    public Grounded: boolean = true;
    public GroundedOffset: number = -0.14;
    public GroundedRadius: number = 0.28;
    public GroundLayers: LayerMask | null = null;
    public CinemachineCameraTarget: GameObject | null = null;
    public TopClamp: number = 70.0;
    public BottomClamp: number = -30.0;
    public CameraAngleOverride: number = 0.0;
    public LockCameraPosition: boolean = false;
    private _cinemachineTargetYaw: number = 0.0;
    private _cinemachineTargetPitch: number = 0.0;
    private _speed: number = 0.0;
    private _targetSpeed: number = 0.0;
    private _animationBlend: number = 0.0;
    private _targetRotation: number = 0.0;
    private _rotationVelocity: { value: number } = { value: 0.0 };
    private _verticalVelocity: number = 0.0;
    private _terminalVelocity: number = 53.0;
    private _jumpTimeoutDelta: number = 0.0;
    private _fallTimeoutDelta: number = 0.0;
    private _animIDSpeed: number = 0;
    private _animIDGrounded: number = 0;
    private _animIDJump: number = 0;
    private _animIDFreeFall: number = 0;
    private _animIDMotionSpeed: number = 0;
    private _playerInput: PlayerInput | null = null;
    private _animator: Animator | null = null;
    private _geniesAnimatorEventBridge: AnimatorEventBridge ;
    private _controller: CharacterController;
    private _input: CustomInput;
    private _mainCamera: GameObject | null = null;
    private readonly _threshold: number = 0.01;
    private _hasAnimator: boolean = false;

    private Awake(): void {
        if (this._mainCamera === null) {
            this._mainCamera = GameObject.FindGameObjectWithTag("MainCamera");
        }
    }

    private Start(): void {
        if (this.CinemachineCameraTarget && this.CinemachineCameraTarget.transform) {
            this._cinemachineTargetYaw = this.CinemachineCameraTarget.transform.rotation.eulerAngles.y;
        }


        this.GetGenieAnimator();
        this._controller = this.GetComponent<CharacterController>();
        //this._input = this.GetComponent(GeniesInputs);

        this.AssignAnimationIDs();

        this._jumpTimeoutDelta = this.JumpTimeout;
        this._fallTimeoutDelta = this.FallTimeout;
    }

    private Update(): void {
        if (!this._hasAnimator) {
            this.GetGenieAnimator();
        }

        this.JumpAndGravity();
        this.GroundedCheck();
        this.Move();
    }

    private LateUpdate(): void {
        this.CameraRotation();
    }

    private OnDestroy(): void {
        if (this._geniesAnimatorEventBridge !== null) {
            this._geniesAnimatorEventBridge.Unsubscribe(AnimEventType.OnFootstep, this.OnFootstep);
            this._geniesAnimatorEventBridge.Unsubscribe(AnimEventType.OnLand, this.OnLand);
        }
    }

    private GetGenieAnimator(): void {
        this._animator = this.GetComponentInChildren<Animator>();
        if (this._animator) {
            this._hasAnimator = true;
        }
    }

    private AssignAnimationIDs(): void {
        if (this._animator) {
            this._animIDSpeed = Animator.StringToHash("Speed");
            this._animIDGrounded = Animator.StringToHash("Grounded");
            this._animIDJump = Animator.StringToHash("Jump");
            this._animIDFreeFall = Animator.StringToHash("FreeFall");
            this._animIDMotionSpeed = Animator.StringToHash("MotionSpeed");
        }
    }

    private GroundedCheck(): void {
        if (!this.transform) return;
        const spherePosition = new Vector3(this.transform.position.x, this.transform.position.y - this.GroundedOffset, this.transform.position.z);
        this.Grounded = Physics.CheckSphere(spherePosition, this.GroundedRadius, this.GroundLayers.value, QueryTriggerInteraction.Ignore);

        if (this._hasAnimator && this._animator) {
            this._animator.SetBool(this._animIDGrounded, this.Grounded);
        }
    }

    private CameraRotation(): void {
        if (!this._input || !this.CinemachineCameraTarget || !this.CinemachineCameraTarget.transform) return;
        if (this._input.look.sqrMagnitude >= this._threshold && !this.LockCameraPosition) {
            const deltaTimeMultiplier = this.IsCurrentDeviceMouse ? 1.0 : Time.deltaTime;
            this._cinemachineTargetYaw += this._input.look.x * deltaTimeMultiplier;
            this._cinemachineTargetPitch += this._input.look.y * deltaTimeMultiplier;
        }

        this._cinemachineTargetYaw = this.ClampAngle(this._cinemachineTargetYaw, Number.MIN_VALUE, Number.MAX_VALUE);
        this._cinemachineTargetPitch = this.ClampAngle(this._cinemachineTargetPitch, this.BottomClamp, this.TopClamp);

        this.CinemachineCameraTarget!.transform.rotation = Quaternion.Euler(this._cinemachineTargetPitch + this.CameraAngleOverride, this._cinemachineTargetYaw, 0.0);
    }

    private Move(): void {
        if (!this._input || !this._controller) return;
        this._targetSpeed = this._input.sprint ? this.SprintSpeed : this.MoveSpeed;

        if (this._input.move.x === 0 && this._input.move.y === 0) this._targetSpeed = 0.0;

        const currentHorizontalSpeed = new Vector3(this._controller.velocity.x, 0.0, this._controller.velocity.z).magnitude;

        const speedOffset = 0.1;
        const inputMagnitude = this._input.analogMovement ? this._input.move.magnitude : 1.0;

        if (currentHorizontalSpeed < this._targetSpeed - speedOffset || currentHorizontalSpeed > this._targetSpeed + speedOffset) {
            this._speed = Mathf.Lerp(currentHorizontalSpeed, this._targetSpeed * inputMagnitude, Time.deltaTime * this.SpeedChangeRate);
            this._speed = Mathf.Round(this._speed * 1000.0) / 1000.0;
        } else {
            this._speed = this._targetSpeed;
        }

        this._animationBlend = Mathf.Lerp(this._animationBlend, this._targetSpeed, Time.deltaTime * this.SpeedChangeRate);
        if (this._animationBlend < 0.01) this._animationBlend = 0.0;

        let inputDirection : Vector3 = new Vector3(this._input.move.x, 0.0, this._input.move.y).normalized;

        if (this._input.move.x !== 0 || this._input.move.y !== 0) {
            if (this._mainCamera && this._mainCamera.transform) {
                this._targetRotation = Mathf.Atan2(inputDirection.x, inputDirection.z) * Mathf.Rad2Deg + this._mainCamera.transform.eulerAngles.y;
                const rotation = Mathf.SmoothDampAngle(this.transform.eulerAngles.y, this._targetRotation, this._rotationVelocity, this.RotationSmoothTime);
                this.transform.rotation = Quaternion.Euler(0.0, rotation, 0.0);
            }
        }

        let targetDirection : Vector3 = Quaternion.Euler(0.0, this._targetRotation, 0.0) * Vector3.forward;

        this._controller!.Move(targetDirection.normalized * (this._speed * Time.deltaTime) + (new Vector3(0.0, this._verticalVelocity, 0.0) * (Time.deltaTime)));


        if (this._hasAnimator && this._animator) {
            this._animator.SetFloat(this._animIDSpeed, this._animationBlend);
            this._animator.SetFloat(this._animIDMotionSpeed, inputMagnitude);
        }
    }

    private JumpAndGravity(): void {
        if (!this._controller) return;
        if (this.Grounded) {
            this._fallTimeoutDelta = this.FallTimeout;

            if (this._hasAnimator && this._animator) {
                this._animator.SetBool(this._animIDJump, false);
                this._animator.SetBool(this._animIDFreeFall, false);
            }

            if (this._verticalVelocity < 0.0) {
                this._verticalVelocity = -2.0;
            }

            if (this._input && this._input.jump && this._jumpTimeoutDelta <= 0.0) {
                this._verticalVelocity = Mathf.Sqrt(this.JumpHeight * -2.0 * this.Gravity);

                if (this._hasAnimator && this._animator) {
                    this._animator.SetBool(this._animIDJump, true);
                }
            }

            if (this._jumpTimeoutDelta >= 0.0) {
                this._jumpTimeoutDelta -= Time.deltaTime;
            }
        } else {
            this._jumpTimeoutDelta = this.JumpTimeout;

            if (this._fallTimeoutDelta >= 0.0) {
                this._fallTimeoutDelta -= Time.deltaTime;
            } else {
                if (this._hasAnimator && this._animator) {
                    this._animator.SetBool(this._animIDFreeFall, true);
                }
            }

            if (this._input)
                this._input.jump = false;
        }

        if (this._verticalVelocity < this._terminalVelocity) {
            this._verticalVelocity += this.Gravity * Time.deltaTime;
        }
    }

    private ClampAngle(lfAngle: number, lfMin: number, lfMax: number): number {
        if (lfAngle < -360.0) lfAngle += 360.0;
        if (lfAngle > 360.0) lfAngle -= 360.0;
        return Mathf.Clamp(lfAngle, lfMin, lfMax);
    }

    private OnDrawGizmosSelected(): void {
        const transparentGreen = new Color(0.0, 1.0, 0.0, 0.35);
        const transparentRed = new Color(1.0, 0.0, 0.0, 0.35);

        Gizmos.color = this.Grounded ? transparentGreen : transparentRed;

        if (this.transform)
            Gizmos.DrawSphere(new Vector3(this.transform.position.x, this.transform.position.y - this.GroundedOffset, this.transform.position.z), this.GroundedRadius);
    }

    public GetLatestPlayerTargetSpeed(): number {
        return this._targetSpeed;
    }

    public SetAnimatorEventBridge(geniesAnimatorEventBridge: AnimatorEventBridge | null): void {
        this._geniesAnimatorEventBridge = geniesAnimatorEventBridge;
        if (this._geniesAnimatorEventBridge != null) {
            this._geniesAnimatorEventBridge.Subscribe(AnimEventType.OnFootstep, this.OnFootstep.bind(this));
            this._geniesAnimatorEventBridge.Subscribe(AnimEventType.OnLand, this.OnLand.bind(this));
        }
    }

    private OnFootstep(animationEvent : AnimationEvent)
    {
        /*if (animationEvent.animatorClipInfo.weight > 0.5)
        {
            if (this.FootstepAudioClips.length > 0)
            {
                var index = Random.Range(0, this.FootstepAudioClips.length);
                AudioSource.PlayClipAtPoint(this.FootstepAudioClips[index], this.transform.TransformPoint(this._controller.center),
                    this.FootstepAudioVolume);
            }
        }*/
    }

    private OnLand(animationEvent : AnimationEvent)
    {
        /*if (animationEvent.animatorClipInfo.weight > 0.5)
        {
            AudioSource.PlayClipAtPoint(this.LandingAudioClip, this.transform.TransformPoint(this._controller.center),
                this.FootstepAudioVolume);
        }*/
    }

    private get IsCurrentDeviceMouse(): boolean {
        if (typeof InputSystem !== 'undefined' && this._playerInput) {
            return this._playerInput.currentControlScheme === "KeyboardMouse";
        }
        return false;
    }
}
