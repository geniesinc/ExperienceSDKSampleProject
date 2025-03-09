import { Color, GameObject, MeshRenderer, MonoBehaviour, Quaternion, Random, Vector2Int, Vector3 } from "UnityEngine";
import PathFinder from "./PathFinder";

enum TileType {
    DEFAULT = 0,
    PATH = 1,
    OBSTACLE = 2
}

class Tile {
    type: TileType;
    obj: GameObject;
    pos: Vector2Int;
    constructor(type: TileType, obj: GameObject, row: int, col: int) {
        this.type = type;
        this.obj = obj;
        this.pos = new Vector2Int(row, col);
    }
}

export default class MapController extends MonoBehaviour {

    @SerializeField private tilePrefab: GameObject;
    @SerializeField private rowAmount: int = 11;
    @SerializeField private columnAmount: int = 5;
    @SerializeField private obstacleChance: float = 0.2;
    @SerializeField private playerSpawn: Vector2Int = new Vector2Int(0, 0);

    private obstacleColor: Color = Color.black;
    private pathColor: Color = Color.white;

    private grid: Tile[][];

    public OnPathFound : GeniesEvent<[GameObject[]]> = new GeniesEvent<[GameObject[]]>();

    Start() {
        this.GenerateGrid();
    }

    private GenerateGrid() {
        this.grid = new Array(this.rowAmount);

        for (let i = 0; i < this.rowAmount; i++) {

            this.grid[i] = new Array(this.columnAmount);

            for (let j = 0; j < this.columnAmount; j++) {
                
                let type = Random.Range(0.0, 1.0) < this.obstacleChance ? TileType.OBSTACLE : TileType.PATH;
                if(this.playerSpawn.x == i && this.playerSpawn.y == j) {
                    type = TileType.PATH;
                }
                let pos = new Vector3(j, 0, i);
                let obj = GameObject.Instantiate(this.tilePrefab, pos, Quaternion.identity) as GameObject;
                obj.transform.parent = this.transform;
                obj.name = "Tile (" + i.toString() + "," + j.toString() + ")";
                if(type == TileType.OBSTACLE) {
                    obj.GetComponent<MeshRenderer>().material.color = this.obstacleColor;
                }else if(type == TileType.PATH) {
                    obj.GetComponent<MeshRenderer>().material.color = this.pathColor;
                }

                this.grid[i][j] = new Tile(type, obj, i, j);
            }
        }
    }

    public CheckTargetPath(player: GameObject, target: GameObject) {
        let startTile: Tile = this.GetClosestTileToObject(player);
        let finishTile: Tile = this.GetTileFromObject(target);
        console.log("Start Tile: " + startTile.pos.ToString());
        console.log("Finish Tile: " + finishTile.pos.ToString());
        console.log("Checking path!");
        let grid: number[][] = this.GetNumberGrid(this.grid);
        let pathFinder: PathFinder = new PathFinder(grid);
        let path = pathFinder.findPath(startTile.pos, finishTile.pos);
        if(path) {
            console.log("Found a path!")
            this.OnPathFound.trigger(this.GetObjectPath(path));
        }else{
            console.log("Did not find a path!")
        }
    }

    private GetObjectPath(path: Vector2Int[]): GameObject[] {
        let result = new Array(path.length);
        for(let i = 0; i < path.length; i++) {
            result[i] = this.GetTileFromPosition(path[i]).obj;
        }
        return result;
    }

    private GetClosestTileToObject(obj: GameObject): Tile {
        let leastDistance: number;
        let closesTile: Tile;

        for (let i = 0; i < this.rowAmount; i++) {
            for (let j = 0; j < this.columnAmount; j++) {
                let tile: Tile = this.grid[i][j];
                let offset: Vector3 = Vector3.op_Subtraction(obj.transform.position, tile.obj.transform.position);
                let distance = offset.magnitude;
                if(closesTile == null || distance < leastDistance) {
                    leastDistance = distance;
                    closesTile = tile;
                }
            }
        }

        return closesTile;
    }

    private GetTileFromObject(obj: GameObject): Tile {
        for (let i = 0; i < this.rowAmount; i++) {
            for (let j = 0; j < this.columnAmount; j++) {
                if(this.grid[i][j].obj == obj) {
                    return this.grid[i][j];
                }
            }
        }
    }

    private GetTileFromPosition(pos: Vector2Int): Tile {
        for (let i = 0; i < this.rowAmount; i++) {
            for (let j = 0; j < this.columnAmount; j++) {
                if(this.grid[i][j].pos.x == pos.x && this.grid[i][j].pos.y == pos.y) {
                    return this.grid[i][j];
                }
            }
        }
    }

    private GetNumberGrid(grid: Tile[][]): number[][] {
        let result: number[][];
        result = new Array(this.rowAmount);
        for (let i = 0; i < this.rowAmount; i++) {
            result[i] = new Array(this.columnAmount);
            for (let j = 0; j < this.columnAmount; j++) {
                result[i][j] = this.grid[i][j].type == TileType.PATH ? 0 : 1;
            }
        }
        return result;
    }
}
