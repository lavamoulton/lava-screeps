import { profile } from "../Profiler";
import { Traveler } from "../utils/Traveler";

@profile
export class Mapper {

    private _scouts: Creep[];

    constructor() {
        this._scouts = [];
    }

    get memory() {
        return Memory.mapper;
    }

    private _getScoutTarget(creep: Creep, roomName: string): string | null {
        console.log(`${creep.name}: Looking for scout target from ${roomName}`);
        const roomExits = Game.map.describeExits(roomName);
        for (let i in roomExits) {
            let exitRoom = roomExits[i as ExitKey];
            if (exitRoom) {
                if (!Memory.mapper[exitRoom]) {
                    return exitRoom;
                }
            }
        }
        for (let i in roomExits) {
            let exitRoom = roomExits[i as ExitKey];
            if (exitRoom) {
                return this._getScoutTarget(creep, exitRoom);
            }
        }
        return null;
    }

    getScoutTarget(creep: Creep): string | null {
        const colonyName = creep.memory.colonyName;
        const colony = global.empire.colonies[colonyName];
        if (colony) {
            const colRoom = colony.room;
            const colRoomExits = Game.map.describeExits(colRoom.name);
            for (let i in colRoomExits) {
                let exitRoom = colRoomExits[i as ExitKey];
                if (exitRoom) {
                    if (!Memory.mapper[exitRoom]) {
                        return exitRoom;
                    }
                }
            }
            for (let exploredRoom in this.memory) {
                const room = Game.rooms[exploredRoom];
                const exploredRoomExits = Game.map.describeExits(exploredRoom);
            }
        }
        return null;
    }

    scoutRoom(creep: Creep): void {
        const room = creep.room;
        if (!Memory.mapper[room.name]) {
            const roomData = this.recordRoomData(room, creep);
            if (roomData) {
                Memory.mapper[room.name] = roomData;
            }
        }
    }

    recordRoomData(room: Room, creep: Creep): RoomMemoryData | undefined {
        let colony = global.empire.colonies[creep.memory.colonyName];
        let owner;
        if (room.controller) {
            owner = room.controller.owner?.username;
        }
        const outpost = false;
        const colonyPosition = new RoomPosition(colony.controller.pos.x, colony.controller.pos.y, colony.name);
        const scoutRoomPosition = new RoomPosition(25, 25, creep.room.name);
        const range = Traveler.findTravelPath(colonyPosition, scoutRoomPosition).cost;
        const threatLevel = room.find(FIND_HOSTILE_CREEPS).length + room.find(FIND_HOSTILE_STRUCTURES).length;
        const controller = room.controller?.id;
        const numSources = room.find(FIND_SOURCES).length;
        const minerals = room.find(FIND_MINERALS);
        let roomMineral;
        if (minerals.length > 0) {
            roomMineral = minerals[0].id;
        }
        if (room) {
            return {
                name: room.name,
                owner: owner,
                colony: colony.name,
                outpost: outpost,
                range: range,
                threatLevel: threatLevel,
                controller: controller,
                sources: numSources,
                mineral: roomMineral,
            }
        }
        return undefined;
    }

    init(): void {
        this._scouts = [];
        for (let i in global.empire.colonies) {
            const colony = global.empire.colonies[i];
            this._scouts = this._scouts.concat(colony.creepsByRole['scout']);
        }
    }

    run(): void {
        if (this._scouts.length < 1) {
            return;
        }
        for (let i in this._scouts) {
            const scout = this._scouts[i];
            if (!scout) {
                return;
            }
            if (scout.spawning) { return; }
            console.log(scout);
            if (this._scouts.length > 0 && !scout) {
                this._scouts.splice(this._scouts.indexOf(scout), 1);
            }
            if (scout.memory.task === 'none') {
                const roomName = this._getScoutTarget(scout, scout.room.name);
                if (roomName) {
                    scout.memory.task = 'explore.' + scout.name + '.' + roomName;
                } else {
                    Traveler.travelTo(scout, new RoomPosition(6, 6, scout.room.name));
                }
            }
            if (scout.memory.task.startsWith('explore')) {
                const splitString = scout.memory.task.split('.');
                const roomName = splitString[2];
                if (Traveler.isExit(scout.pos)) {
                    if (scout.pos.y > 48) {
                        scout.move(TOP);
                    }
                    if (scout.pos.y < 1) {
                        scout.move(BOTTOM);
                    }
                    if (scout.pos.x < 1) {
                        scout.move(RIGHT);
                    }
                    if (scout.pos.x > 48) {
                        scout.move(LEFT);
                    }
                }
                if (roomName !== scout.room.name) {
                    Traveler.travelTo(scout, new RoomPosition(25, 25, roomName));
                    return;
                }
                if (roomName === scout.room.name) {
                    console.log('These are equal wtf game');
                    this.scoutRoom(scout);
                    scout.memory.task = 'none';
                }
            }
        }
    }
}
