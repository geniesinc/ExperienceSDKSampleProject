import { CloudSaveStorage } from "Genies.Experience.CloudSave";
import { GeniesExperienceSdk } from "Genies.Experience.Sdk";
import { Color, GameObject, MonoBehaviour, RectTransform, Vector2, Vector3, WaitForSeconds } from "UnityEngine";
import { Button, GridLayoutGroup, Image } from "UnityEngine.UI";

/**
 * Community Painting
 * Uses CloudSaveStorage to save a persistent grid of pixels
 * Users can change the color of a pixel
 * The grid data is shared for all users
 * //TODO: Fix some clicks getting wiped by storage refresh
 */

export default class GameManager extends MonoBehaviour {

    @Header("UI Elements")
    public gridPanel: GameObject;
    public pixelPrefab: GameObject;

    public selectColorButtons: Button[];

    public currentColorImage: Image;

    @Header("Grid Settings")
    public gridSize: number = 16;
    public secondsBetweenUpdate: number = 1;

    private pixels: GameObject[] = [];
    private GRID_STORAGE_KEY = "GridStorageKey";
    private GRID_DATA_KEY = "GridDataKey";
    private storage: CloudSaveStorage;

    async Start() {
        await GeniesExperienceSdk.InitializeAsync();
        this.storage = new CloudSaveStorage(this.GRID_STORAGE_KEY, true);
        this.GenerateGrid();
        this.ConnectButtons();
        this.StartCoroutine(this.UpdateGrid());
    }

    /** Coroutine to update the grid after X seconds */
    private *UpdateGrid() {
        while(true) {
            this.LoadGridData();
            yield new WaitForSeconds(this.secondsBetweenUpdate);
        }
    }

    /** Generate the grid of pixels given a specific size */
    private GenerateGrid() {

        let panelSize = this.gridPanel.GetComponent<RectTransform>().rect.width;
        let pixelSize = panelSize / this.gridSize;
        let pixelVector = new Vector2(pixelSize, pixelSize);
        this.gridPanel.GetComponent<GridLayoutGroup>().cellSize = pixelVector;

        let index = 0;

        for(let i = 0; i < this.gridSize; i++) {
            for(let j = 0; j < this.gridSize; j++) {
                let pixel = GameObject.Instantiate(this.pixelPrefab, this.gridPanel.transform) as GameObject;
                let rt = pixel.GetComponent<RectTransform>();
                rt.localPosition =new Vector3(i * pixelSize, j * pixelSize, 0);
                rt.sizeDelta = pixelVector;
                this.pixels[index++] = pixel;
            }
        }
    }

    /** Connect the buttons for the pixel grid and color selection to listener methods */
    private ConnectButtons() {
        for(let selectColorButton of this.selectColorButtons){
            let color = selectColorButton.gameObject.GetComponent<Image>().color;
            selectColorButton.onClick.AddListener(()=> {
                this.ChangeCurrentColor(color);
            });
        }
        for (let pixel of this.pixels) {
            pixel.GetComponent<Button>().onClick.AddListener(() => {
                this.ChangePixelColor(pixel);
            });
        }
    }

    /** Listener method to change the current selected color */
    private ChangeCurrentColor(color: Color) {
        this.currentColorImage.color = color;
    }

    /** Listener method to change a specific color */
    private ChangePixelColor(pixel:GameObject) {
        pixel.GetComponent<Image>().color = this.currentColorImage.color;
        this.SaveGridData();
    }

    /** Load the grid data from Cloud Storage and color the grid with the data */
    private async LoadGridData() {
        await this.storage.Load();

        let gridData: string;
    
        if (this.storage.Has(this.GRID_DATA_KEY)) {
            gridData = this.storage.GetString(this.GRID_DATA_KEY);
            console.log("Grid Data: " + gridData);

        } else {
            console.log("No grid data yet");
            gridData = this.InitializeGridData(); 
            this.storage.SetString(this.GRID_DATA_KEY, gridData);
            await this.storage.Save();
        }

        this.ColorGridWithData(gridData);
    }

    /** Create a initial grid data using a stringified Json object */
    private InitializeGridData(): string {
        
        let data = [];
        
        for(let i = 0; i < this.pixels.length; i++) {
            let pixel: GameObject = this.pixels[i];
            let color: Color = pixel.GetComponent<Image>().color;
            data.push({
                index: i,
                r: color.r,
                g: color.g,
                b: color.b,
            });
        }
        
        const jsonObject = {
            data: data
        }
        
        const jsonString = JSON.stringify(jsonObject)

        console.log("Initial Data:" + jsonString);
        
        return jsonString;
    }

    /** Color the grid given a stringified Json object */
    private ColorGridWithData(data: string) {
        const jsonObject = JSON.parse(data);
        if (jsonObject.data && jsonObject.data.length == this.pixels.length) {
            for(let obj of jsonObject.data) {
                let pixel = this.pixels[obj.index];
                let color = new Color(obj.r, obj.g, obj.b);
                pixel.GetComponent<Image>().color = color;
            }
        }
    }

    /** Save the current grid to the stored data */
    private async SaveGridData() {
       await this.storage.Load();

        let gridData: string;
    
        if (this.storage.Has(this.GRID_DATA_KEY)) {
            gridData = this.storage.GetString(this.GRID_DATA_KEY);
            const jsonObject = JSON.parse(gridData);
            if (jsonObject.data && jsonObject.data.length == this.pixels.length) {
                for(let obj of jsonObject.data) {
                    let pixel = this.pixels[obj.index];
                    let color = pixel.GetComponent<Image>().color;
                    obj.r = color.r;
                    obj.g = color.g;
                    obj.b = color.b;
                }
            }
            const jsonString = JSON.stringify(jsonObject);
            console.log("Saving Data:" + jsonString);
            this.storage.SetString(this.GRID_DATA_KEY, jsonString);
            await this.storage.Save();
        }
    }
}