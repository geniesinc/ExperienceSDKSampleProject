import {MonoBehaviour, RectTransform} from "UnityEngine";
import {TextMeshProUGUI} from "TMPro";
import {Image} from "UnityEngine.UI";

export default class LeaderboardEntryView extends MonoBehaviour {
    public AvatarImage: Image;
    public NameText: TextMeshProUGUI;
    public ScoreText: TextMeshProUGUI;
    public RankText: TextMeshProUGUI;

    public RectTransform: RectTransform;

    // These are colored dynamically sometimes...
    public BackgroundImage: Image
    public ScoreBackgroundImage: Image
}