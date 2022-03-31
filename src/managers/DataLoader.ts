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
                resources: outpost.find(FIND_DROPPED_RESOURCES),
                supplyTasks: [],
                towerSupplyTasks: [],
                buildTasks: outpost.find(FIND_CONSTRUCTION_SITES),
                repairTasks: outpost.find(FIND_STRUCTURES, { filter: (s) =>
                    ((s.hits+200) < s.hitsMax) &&
                    (s.structureType !== STRUCTURE_RAMPART &&
                        s.structureType !== STRUCTURE_WALL
                )}),
                tombstones: outpost.find(FIND_TOMBSTONES, { filter: (t) =>
                    t.store.getUsedCapacity(RESOURCE_ENERGY) > 0}),
                rampartTasks: outpost.find(FIND_STRUCTURES, { filter: (s) =>
                    (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && s.hits < 100000}),
            }
        }
        return result;
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
        if (room) {
            return {
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
                rampartTasks: room.find(FIND_STRUCTURES, { filter: (s) =>
                    (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && s.hits < 100000
                }),
            }
        } else {
            return {
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
