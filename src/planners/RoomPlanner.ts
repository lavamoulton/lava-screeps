import { Traveler } from "utils/Traveler";
import { bunker } from "../templates/roomBunker";

export class RoomPlanner implements IRoomPlanner {
    colony: IColony;

    constructor(colony: IColony) {
        this.colony = colony;
    }

    init(): void {
        this._setBunkerLayout();
        this._setMineRoadLayout();
    }

    run(): void {
        this._checkBuildings();
        this._checkMineRoads();
    }

    private _setBunkerLayout(): void {
        const colMemory = this.colony.memory;
        if (!colMemory.layout) {
            colMemory.layout = {
                spawns: [],
                extensions: [],
                bunkerRoads: [],
                connections: [],
                ramparts: [],
            }
        }
        if (this.colony.spawner) {
            let spawn = this.colony.spawner.spawns[0];
            let anchor = spawn.pos;
            let rcl = this.colony.controller.level;
            let bunkerLayout = this._getBunkerLayout(rcl);
            let layoutAnchor = bunkerLayout.buildings.spawn.pos[0];
            let dx = layoutAnchor.x - anchor.x;
            let dy = layoutAnchor.y - anchor.y;
            colMemory.layout.spawns = this._getBuildingPositions('spawn', dx, dy, bunkerLayout);
            colMemory.layout.extensions = this._getBuildingPositions('extension', dx, dy, bunkerLayout);
            colMemory.layout.bunkerRoads = this._getBuildingPositions('road', dx, dy, bunkerLayout);
            colMemory.layout.towers = this._getBuildingPositions('tower', dx, dy, bunkerLayout);
            colMemory.layout.connections = this._getBuildingPositions('connections', dx, dy, bunkerLayout);
            colMemory.layout.ramparts = this._getBuildingPositions('rampart', dx, dy, bunkerLayout);
        }
    }

    private _setMineRoadLayout(): void {
        const colMemory = this.colony.memory;
        if (this.colony.mines) {
            _.forEach(this.colony.mines, (mine) => {
                if (mine.output) {
                    console.log(`mineRoad${mine.source.id}`);
                    if (!colMemory[`mineRoad${mine.source.id}`]) {
                        colMemory[`mineRoad${mine.source.id}`] = [];
                        colMemory[`mineRoad${mine.source.id}`] = this._getMineRoad(mine);
                    }
                }
            })
        }
    }

    private _getMineRoad(mine: IMine): posTemplate[] {
        const connections: posTemplate[] = this.colony.memory.layout.connections;
        const outputPos = mine.output!.pos;

        const travelPaths = _.sortBy(_.map(connections, (connection) => {
                return Traveler.findTravelPath(outputPos,
                    new RoomPosition(connection.x, connection.y, connection.room),
                    { ignoreCreeps: true });
            }), (path) => {
                return path.cost;
            }
        )

        let result: posTemplate[] = [];
        _.forEach(travelPaths[0].path, (pos) => {
            result.push({
                'x': pos.x,
                'y': pos.y,
                'room': pos.roomName,
            });
        });

        return result;
    }

    private _getBunkerLayout(rcl: number) {
        switch(rcl) {
            case 2:
                return bunker[2];
            case 3:
                return bunker[3];
            default:
                return bunker[2];
        }
    }

    private _getBuildingPositions(building: string, dx: number, dy: number, bunker: any): posTemplate[] {
        let buildings = bunker.buildings[building];
        let spawnPositions = buildings.pos;
        let result = [];
        for (let i in spawnPositions) {
            let pos = spawnPositions[i];
            result.push({'x': pos.x - dx, 'y': pos.y - dy, 'room': this.colony.room.name});
        }
        return result;
    }

    private _checkBuildings(): void {
        let colMemory = this.colony.memory;
        if (!colMemory.layout) {
            return;
        }
        for (let building in colMemory.layout) {
            if (building === 'connections') {
                continue;
            }
            let positions: posTemplate[] = colMemory.layout[building];
            let mappedPos = _.map(positions, pos => new RoomPosition(pos.x, pos.y, pos.room));
            mappedPos.forEach((pos) => {
                let buildingType = this._getBuildingType(building);
                if (buildingType) {
                    this.colony.room.createConstructionSite(pos.x, pos.y, buildingType);
                }
            })
        }
    }

    private _checkMineRoads(): void {
        let colMemory = this.colony.memory;
        if (this.colony.mines) {
            _.forEach(this.colony.mines, (mine) => {
                if (mine.output) {
                    if (!colMemory[`mineRoad${mine.source.id}`]) {
                        colMemory[`mineRoad${mine.source.id}`] = [];
                    } else {
                        const positions: posTemplate[] = colMemory[`mineRoad${mine.source.id}`];
                        const mappedPos = _.map(positions, pos => new RoomPosition(pos.x, pos.y, pos.room));
                        mappedPos.forEach((pos => {
                            this.colony.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                        }));
                    }
                    colMemory[`mineRoad${mine.source.id}`] = this._getMineRoad(mine);
                }
            })
        }
    }

    private _getBuildingType(buildingName: string): BuildableStructureConstant | null {
        if (buildingName === 'spawns') {
            return STRUCTURE_SPAWN;
        }
        if (buildingName === 'extensions') {
            return STRUCTURE_EXTENSION;
        }
        if (buildingName === 'bunkerRoads') {
            return STRUCTURE_ROAD;
        }
        if (buildingName === 'towers') {
            return STRUCTURE_TOWER;
        }
        if (buildingName === 'storage') {
            return STRUCTURE_STORAGE;
        }
        if (buildingName === 'ramparts') {
            return STRUCTURE_RAMPART;
        }
        return null;
    }
}
