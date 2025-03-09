import { Vector2Int } from "UnityEngine";

class Node {
    position: Vector2Int;
    gCost: number = 0; // Cost from start node
    hCost: number = 0; // Heuristic cost to end node
    get fCost(): number { return this.gCost + this.hCost; } // Total cost
    parent: Node | null = null;

    constructor(position: Vector2Int) {
        this.position = position;
    }
}

export default class PathFinder {
    private grid: number[][];
    private openSet: Node[] = [];
    private closedSet: Set<Node> = new Set();
    private allNodes: Map<string, Node> = new Map();

    constructor(grid: number[][]) {
        this.grid = grid;
    }

    findPath(start: Vector2Int, end: Vector2Int): Vector2Int[] {
        let startNode = this.getNode(start);
        let endNode = this.getNode(end);

        this.openSet.push(startNode);

        while (this.openSet.length > 0) {
            let currentNode = this.getLowestFCostNode(this.openSet);
            if (currentNode.position.x === endNode.position.x && currentNode.position.y === endNode.position.y) {
                return this.retracePath(startNode, endNode);
            }

            this.openSet = this.openSet.filter(n => n !== currentNode);
            this.closedSet.add(currentNode);

            this.getNeighbors(currentNode).forEach(neighbor => {
                if (this.closedSet.has(neighbor) || this.isBlocked(neighbor.position)) return;

                let newCostToNeighbor = currentNode.gCost + this.getDistance(currentNode, neighbor);
                if (newCostToNeighbor < neighbor.gCost || !this.openSet.includes(neighbor)) {
                    neighbor.gCost = newCostToNeighbor;
                    neighbor.hCost = this.getDistance(neighbor, endNode);
                    neighbor.parent = currentNode;

                    if (!this.openSet.includes(neighbor)) {
                        this.openSet.push(neighbor);
                    }
                }
            });
        }

        return []; // No path found
    }

    private getNode(position: Vector2Int): Node {
        const key = `${position.x},${position.y}`;
        if (this.allNodes.has(key)) {
            return this.allNodes.get(key)!;
        }

        const node = new Node(position);
        this.allNodes.set(key, node);
        return node;
    }

    private getNeighbors(node: Node): Node[] {
        const directions = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
        const neighbors: Node[] = [];

        directions.forEach(dir => {
            const neighborPos = new Vector2Int(node.position.x + dir.x, node.position.y + dir.y);
            if (neighborPos.x >= 0 && neighborPos.y >= 0 && neighborPos.x < this.grid.length && neighborPos.y < this.grid[0].length) {
                neighbors.push(this.getNode(neighborPos));
            }
        });

        return neighbors;
    }

    private isBlocked(position: Vector2Int): boolean {
        return this.grid[position.x][position.y] !== 0;
    }

    private getDistance(a: Node, b: Node): number {
        let dstX = Math.abs(a.position.x - b.position.x);
        let dstY = Math.abs(a.position.y - b.position.y);
        return dstX + dstY;
    }

    private getLowestFCostNode(nodes: Node[]): Node {
        return nodes.reduce((acc, curr) => curr.fCost < acc.fCost ? curr : acc);
    }

    private retracePath(startNode: Node, endNode: Node): Vector2Int[] {
        let path: Vector2Int[] = [];
        let currentNode = endNode;

        while (currentNode !== startNode) {
            path.push(currentNode.position);
            currentNode = currentNode.parent!;
        }
        path.push(startNode.position);
        path.reverse();

        return path;
    }
}
