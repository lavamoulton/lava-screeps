import { profile } from "../Profiler";
import { Traveler } from "../utils/Traveler";
import { taskUtils } from "../tasks/taskUtils";
import { TaskClaim } from "tasks/Claim";
import { TaskReserve } from "tasks/Reserve";
import { globalAgent } from "http";

@profile
export class Observer implements IObserver {

    constructor() {
    }

    get memory() {
        return Memory.map;
    }

    _scoutRoom(room: Room): void {
        const roomData = this._recordRoomData(room);
        Memory.map[room.name] = roomData;
    }

    _recordRoomData(room: Room): RoomMemoryData {
        let owner;
        if (room.controller) {
            owner = room.controller.owner?.username;
        }
        let outpost = false;
        let range = 10000;
        let colonyResult: IColony;
        const scoutRoomPosition = new RoomPosition(25, 25, room.name);
        _.forEach(global.empire.colonies, (colony) => {
            const colonyPosition = new RoomPosition(colony.controller.pos.x, colony.controller.pos.y, colony.name);
            let temp = Traveler.findTravelPath(colonyPosition, scoutRoomPosition).cost;
            if (temp < range) {
                range = temp;
                colonyResult = colony;
            }
        });
        const threatLevel = room.find(FIND_HOSTILE_CREEPS).length + room.find(FIND_HOSTILE_STRUCTURES).length;
        const controller = room.controller?.id;
        const numSources = room.find(FIND_SOURCES).length;
        const minerals = room.find(FIND_MINERALS);
        let roomMineral;
        if (minerals.length > 0) {
            roomMineral = minerals[0].id;
        }
        let time = Game.time;
        return {
            name: room.name,
            owner: owner,
            colony: colonyResult!.name,
            outpost: outpost,
            range: range,
            threatLevel: threatLevel,
            controller: controller,
            sources: numSources,
            mineral: roomMineral,
            time: time,
        }
    }

    _updateRoom(room: Room): void {
        const roomData = this.memory[room.name];
        let owner: string | undefined = 'none';
        if (!roomData.owner) {
            if (room.controller) {
                owner = room.controller.owner?.username;
            }
        }
        if (!roomData.outpost) {
            if (roomData.threatLevel < 1 && roomData.sources > 0 && roomData.range < 300) {
                let colony = global.empire.colonies[roomData.colony];
                if (roomData.name !== colony.name) {
                    roomData.outpost = true;
                }
                if (colony) {
                    colony.memory.outposts[roomData.name] = roomData.sources;
                }
            }
        }
        if (room.find(FIND_HOSTILE_CREEPS)) {
            if (roomData.threatLevel < 1) {
                if (roomData.outpost = true) {
                    let colony = global.empire.colonies[roomData.colony];
                    if (colony) {
                        if (!colony.memory.enemyRooms.includes(roomData.name)) {
                            colony.memory.enemyRooms.push(roomData.name);
                        }
                    }
                }
            }
        }
    }

    init(): void {

    }

    run(): void {
        if (Game.time % 15 === 0) {
            for (let i in Game.rooms) {
                let room = Game.rooms[i];
                if (this.memory[room.name]) {
                    this._updateRoom(room);
                } else {
                    this._scoutRoom(room);
                }
            }
        }
    }
}
