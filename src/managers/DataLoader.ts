import { off } from "process";
import { profile } from "../Profiler";
import { Manager } from "./Manager";

@profile
export class DataLoader extends Manager implements DataLoader {

    taskData?: { [roomName: string]: roomTaskData };

    constructor(colony: IColony) {
        super(colony);
    }

    getColonyRoomData(): roomTaskData {
        return this.taskData![this.colony.room.name];
    }

    getRemoteRoomData(): { [name: string]: roomTaskData } {
        let result: { [name: string]: roomTaskData } = {};
        for (let i in this.colony.outposts) {
            let outpost = this.colony.outposts[i];
            result[outpost.name] = {
                enemies: outpost.find(FIND_HOSTILE_CREEPS),
                resources: outpost.find(FIND_DROPPED_RESOURCES),
                supplyTasks: [],
                towerSupplyTasks: [],
                buildTasks: outpost.find(FIND_CONSTRUCTION_SITES),
                repairTasks: outpost.find(FIND_STRUCTURES, { filter: (s) =>
                    ((s.hits+500) < s.hitsMax) &&
                    (s.structureType !== STRUCTURE_RAMPART &&
                        s.structureType !== STRUCTURE_WALL
                )}),
                tombstones: outpost.find(FIND_TOMBSTONES, { filter: (t) =>
                    t.store.getUsedCapacity(RESOURCE_ENERGY) > 0}),
                rampartTasks: outpost.find(FIND_STRUCTURES, { filter: (s) =>
                    (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && s.hits < 110000}),
            }
        }
        return result;
    }

    getColonyTaskData(): colonyTaskData {
        let rooms: Room[] = [];
        let reservations: StructureController[] = [];
        let defenseRooms: Room[] = [];
        rooms.push(this.colony.room);
        _.forEach(this.colony.outposts, (outpost) => {
            rooms.push(outpost);
            if (outpost.controller) {
                if (outpost.controller.reservation) {
                    if (outpost.controller.reservation.ticksToEnd < 2000) {
                        reservations.push(outpost.controller);
                    }
                } else {
                    reservations.push(outpost.controller);
                }
            }
        });
        let colHostiles: Creep[] = [];
        for (let room of rooms) {
            let hostiles = room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                colHostiles = colHostiles.concat(hostiles);
                if (!defenseRooms.includes(room)) {
                    defenseRooms.push(room);
                }
            }
        }
        let claims: Room[] = [];
        let outpostOutputs: StructureContainer[] = [];
        if (this.colony.outpostMines) {
            _.forEach(this.colony.outpostMines, (mine) => {
                if (mine.remainingOutput > 500) {
                    if (mine.output) {
                        outpostOutputs.push(mine.output);
                    }
                }
            })
        }
        let offenseRooms: Room[] = [];
        return {
            enemies: colHostiles,
            reservations: reservations,
            claims: claims,
            outpostOutputs: outpostOutputs,
            defenseRooms: defenseRooms,
            offenseRooms: offenseRooms,
        }
    }

    init(): void {
        this.taskData = {};
        this.taskData[this.colony.room.name] = this._loadTaskData(this.colony.room.name);
    }

    run(): void {
        this._printTaskData(this.colony.room.name);
    }

    private _loadTaskData(roomName: string): roomTaskData {
        const room = Game.rooms[roomName];
        let ramparts: (StructureRampart | StructureWall)[] = room.find(FIND_STRUCTURES, { filter: (s) =>
            (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL)
        });
        let rampartTasks = _.filter(ramparts, (rampart) => {
            return rampart.hits < 200000;
        });
        /*
        if (rampartTasks.length < 1) {
            let edges: posTemplate[] = this.colony.memory.layout.edges;
            let mappedEdges = _.map(edges, pos => new RoomPosition(pos.x, pos.y, pos.room));
            mappedEdges.forEach((pos) => {
                let room = Game.rooms[pos.roomName];
                if (room) {
                    let structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length > 0) {
                        structures.forEach((structure) => {
                            if (structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_WALL) {
                                if (structure.hits < 200000) {
                                    rampartTasks.push(structure as StructureRampart | StructureWall);
                                }
                            }
                        })
                    }
                }
            });
        }*/
        if (room) {
            return {
                enemies: room.find(FIND_HOSTILE_CREEPS),
                resources: room.find(FIND_DROPPED_RESOURCES),
                supplyTasks: room.find(FIND_STRUCTURES, {filter: (s) =>
                    (s.structureType === STRUCTURE_EXTENSION ||
                    s.structureType === STRUCTURE_SPAWN) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0}),
                towerSupplyTasks: room.find(FIND_STRUCTURES, { filter: (s) =>
                    (s.structureType === STRUCTURE_TOWER) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0}),
                buildTasks: room.find(FIND_CONSTRUCTION_SITES),
                repairTasks: room.find(FIND_STRUCTURES, {filter: (s) =>
                    ((s.hits+200) < s.hitsMax) &&
                    (s.structureType !== STRUCTURE_RAMPART &&
                        s.structureType !== STRUCTURE_WALL
                )}),
                tombstones: room.find(FIND_TOMBSTONES, { filter: (t) =>
                    t.store.getUsedCapacity(RESOURCE_ENERGY) > 0
                }),
                rampartTasks: rampartTasks,
            }
        } else {
            return {
                enemies: [],
                resources: [],
                supplyTasks: [],
                towerSupplyTasks: [],
                buildTasks: [],
                repairTasks: [],
                tombstones: [],
                rampartTasks: [],
            }
        }
    }

    private _printTaskData(roomName: string): void {
        const room = Game.rooms[roomName];
        if (room) {
            const taskData = this.taskData![room.name];
            console.log(`Resources (${taskData.resources.length}): ${taskData.resources}`);
            console.log(`Supply tasks (${taskData.supplyTasks.length}): ${taskData.supplyTasks}`);
            console.log(`Build tasks (${taskData.buildTasks.length}): ${taskData.buildTasks}`);
            console.log(`Repair tasks (${taskData.repairTasks.length}): ${taskData.repairTasks}`);
            console.log(`Rampart tasks (${taskData.rampartTasks.length}): ${taskData.rampartTasks}`);
        }
    }
}
