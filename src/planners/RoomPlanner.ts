import { profile } from "../Profiler";
import { Traveler } from "utils/Traveler";
import { bunker } from "../templates/roomBunker";
import { formatWithOptions } from "util";

@profile
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
        if (!colMemory.layout.spawns) {
            colMemory.layout.spawns = [];
        }
        if (!colMemory.layout.extensions) {
            colMemory.layout.extensions = [];
        }
        if (!colMemory.layout.bunkerRoads) {
            colMemory.layout.bunkerRoads = [];
        }
        if (!colMemory.layout.towers) {
            colMemory.layout.towers = [];
        }
        if (!colMemory.layout.connections) {
            colMemory.layout.connections = [];
        }
        if (!colMemory.layout.ramparts) {
            colMemory.layout.ramparts = [];
        }
        if (!colMemory.layout.storage) {
            colMemory.layout.storage = [];
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
            colMemory.layout.storage = this._getBuildingPositions('storage', dx, dy, bunkerLayout);
        }
    }

    private _setMineRoadLayout(): void {
        const colMemory = this.colony.memory;
        if (this.colony.mines) {
            _.forEach(this.colony.mines, (mine) => {
                if (mine.output) {
                    if (!colMemory[`mineRoad${mine.source.id}`]) {
                        colMemory[`mineRoad${mine.source.id}`] = [];
                        colMemory[`mineRoad${mine.source.id}`] = this._getMineRoad(mine);
                    }
                }
            })
        }
        if (this.colony.outpostMines) {
            _.forEach(this.colony.outpostMines, (mine) => {
                if (mine.output) {
                    if (!colMemory[`outpostMineRoad${mine.source.id}`]) {
                        colMemory[`outpostMineRoad${mine.source.id}`] = [];
                        colMemory[`outpostMineRoad${mine.source.id}`] = this._getMineRoad(mine);
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
                    { ignoreCreeps: true,
                      roomCallback: (roomName, matrix) => {
                          let room = Game.rooms[roomName];
                          if (room) {
                              for (let x=0; x<50; x++) {
                                  for (let y=0; y<50; y++) {
                                      if (room.getTerrain().get(x, y) === TERRAIN_MASK_SWAMP || room.getTerrain().get(x, y) === 0) {
                                          matrix.set(x, y, 3);
                                      }
                                  }
                              }
                              let impassibleStructures: Structure[] = [];
                              for (let structure of room.find(FIND_STRUCTURES)) {
                                  if (structure instanceof StructureRampart) {
                                      if (!structure.my && !structure.isPublic) {
                                          impassibleStructures.push(structure);
                                      }
                                  } else if (structure instanceof StructureContainer) {
                                    matrix.set(structure.pos.x, structure.pos.y, 5);
                                  } else if (structure instanceof StructureRoad) {
                                    matrix.set(structure.pos.x, structure.pos.y, 1);
                                  } else {
                                      impassibleStructures.push(structure);
                                  }
                              }
                              for (let structure of impassibleStructures) {
                                  matrix.set(structure.pos.x, structure.pos.y, 0xff);
                              }
                          }
                          return matrix;
                      } });
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
            case 4:
                return bunker[4];
            case 5:
                return bunker[5];
            case 6:
                return bunker[6];
            case 7:
                return bunker[7];
            case 8:
                return bunker[8];
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
                    if (buildingType === STRUCTURE_ROAD || buildingType === STRUCTURE_RAMPART) {
                        if (this.colony.taskData.buildTasks.length > 2) {
                            return;
                        }
                        if (buildingType === STRUCTURE_RAMPART) {
                            if (this.colony.taskData.rampartTasks.length > 1) {
                                return;
                            }
                        }
                    }
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
                            let room = Game.rooms[pos.roomName];
                            room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                        }));
                    }
                    colMemory[`mineRoad${mine.source.id}`] = this._getMineRoad(mine);
                }
            })
        }
        if (this.colony.outpostMines) {
            _.forEach(this.colony.outpostMines, (mine) => {
                if (mine.output) {
                    if (!colMemory[`outpostMineRoad${mine.source.id}`]) {
                        colMemory[`outpostMineRoad${mine.source.id}`] = [];
                    } else {
                        const positions: posTemplate[] = colMemory[`outpostMineRoad${mine.source.id}`];
                        const mappedPos = _.map(positions, pos => new RoomPosition(pos.x, pos.y, pos.room));
                        mappedPos.forEach((pos => {
                            let room = Game.rooms[pos.roomName];
                            if (room) {
                                console.log(`--- Calling room visual circle ---`);
                                new RoomVisual(room.name).circle(pos.x, pos.y, { radius: .45, fill: "transparent", stroke: "red", strokeWidth: .15, opacity: 1});
                                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                            }
                            //room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                        }));
                    }
                    colMemory[`outpostMineRoad${mine.source.id}`] = this._getMineRoad(mine);
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
        if (buildingName === 'storage') {
            return STRUCTURE_STORAGE;
        }
        return null;
    }
}
