import { profile } from "./Profiler";
import { ColonyManager } from './managers/ColonyManager';
import { Spawner } from './structures/Spawner';
import { Mine } from 'structures/Mine';
import { ColonyVisualizer } from "visuals/ColonyVisualizer";
import { DataLoader } from "managers/DataLoader";
import { globalAgent } from "http";

@profile
export class Colony implements IColony {
    name: string;
    room: Room;
    defcon: number;
    baby: boolean;
    parent: boolean;
    outposts: Room[];
    controller: StructureController;
    storage?: StructureStorage;
    creeps: Creep[];
    creepsByRole: { [roleName: string]: Creep[] };
    spawner: ISpawner | null;
    mines?: { [sourceID: Id<Source>]: IMine };
    outpostMines?: { [sourceID: Id<Source>]: IMine };
    towers?: StructureTower[];
    manager: IColonyManager;
    visualizer: IColonyVisualizer;
    taskData: roomTaskData;
    outpostTaskData: { [name: string]: roomTaskData };
    colonyTaskData: colonyTaskData;
    private _dataLoader: IDataLoader;

    constructor(name: string, room: Room) {
        if (!Memory.colonies[name]) {
            Memory.colonies[name] = {};
        }
        this.name = name;
        this.room = room;
        this.defcon = 5;
        this.outposts = this._loadOutposts();
        this.controller = this.room.controller!;
        if (Object.values(global.empire.colonies).length > 1 && this.controller.level < 3) {
            this.baby = true;
        } else {
            this.baby = false;
        }
        this.parent = false;
        this.creeps = [];
        this.creepsByRole = {};
        this._dataLoader = new DataLoader(this);
        this._dataLoader.init();
        this.taskData = this._loadTaskData();
        this.outpostTaskData = this._loadOutpostTaskData();
        this.colonyTaskData = this._loadColonyTaskData();
        this.spawner = this._initSpawner();
        this.manager = this._initColonyManager();
        this.visualizer = this._initColonyVisualizer();
    }

    get memory(): any {
        return Memory.colonies[this.name];
    }

    get maxEnergy(): number {
        let result = 0;
        if (this.mines) {
            result += (2000*Object.keys(this.mines).length)
        }
        result += this.spawner!.maxEnergy;
        if (this.towers) {
            result += (1000*this.towers.length);
        }
        return result;
    }

    private _loadOutposts(): Room[] {
        let result = [];
        for (let roomName in this.memory.outposts) {
            let outpost = Game.rooms[roomName];
            if (outpost) {
                result.push(outpost);
            }
        }
        return result;
    }

    private _loadTaskData(): roomTaskData {
        return this._dataLoader.getColonyRoomData();
    }

    private _loadOutpostTaskData(): { [name: string]: roomTaskData } {
        return this._dataLoader.getRemoteRoomData();
    }

    private _loadColonyTaskData(): colonyTaskData {
        return this._dataLoader.getColonyTaskData();
    }

    private _findOutposts(): { [name: string]: number } {
        if (!this.memory['outposts']) {
            this.memory['outposts'] = {};
        }
        let outposts: { [name: string]: number } = {};
        let outpostRanges = [];
        let numSources = 0;
        let maxSources = 5;
        for (let i in Memory.mapper) {
            let roomMemoryData = Memory.mapper[i];
            if (this.name === roomMemoryData.colony) {
                if (roomMemoryData.threatLevel < 1) {
                    if (!roomMemoryData.owner) {
                        if (roomMemoryData.range < 300) {
                            roomMemoryData.outpost = true;
                            outpostRanges.push(roomMemoryData);
                        }
                    }
                }
            }
        }
        let sortedOutposts = _.sortBy(outpostRanges, (outpost) => {
            return outpost.range;
        });
        for (let i in sortedOutposts) {
            const outpostData = sortedOutposts[i];
            if (numSources < maxSources) {
                outposts[outpostData.name] = outpostData.sources;
                numSources += outpostData.sources;
            }
        }
        this.memory['outposts'] = outposts;
        return outposts;
    }

    private _initSpawner(): ISpawner | null {
        let spawn: StructureSpawn = this.room.find(FIND_STRUCTURES, {filter: (s) =>
            s.structureType == STRUCTURE_SPAWN})[0] as StructureSpawn;
        if (!spawn) {
            return null;
        }
        let spawner = new Spawner(spawn.id, this.room, this);
        //spawner.init();
        return spawner;
    }

    private _initMines(): { [sourceID: Id<Source>]: IMine } {
        const sources = this.room.find(FIND_SOURCES);
        const sourceIDs = _.map(sources, source => source.id);
        const mines = _.map(sources, source => new Mine(source.id, source.room, this));
        for (let i in mines) {
            mines[i].init();
        }
        return _.zipObject(sourceIDs, mines) as { [sourceID: string]: IMine };
    }

    private _initOutpostMines(): { [sourceID: Id<Source>]: IMine } {
        let resultSources: Source[] = [];
        let resultSourceIDs: Id<Source>[] = [];
        for (let roomName in this.memory.outposts) {
            const outpostRoom = Game.rooms[roomName];
            if (outpostRoom) {
                const sources = outpostRoom.find(FIND_SOURCES);
                const sourceIDs = _.map(sources, source => source.id);
                resultSources = resultSources.concat(sources);
                resultSourceIDs = resultSourceIDs.concat(sourceIDs);
            }
        }
        const outpostMines = _.map(resultSources, source => new Mine(source.id, source.room, this));
        for (let i in outpostMines) {
            outpostMines[i].init();
        }
        return _.zipObject(resultSourceIDs, outpostMines) as { [sourceID: string]: IMine };
    }

    private _initColonyManager(): IColonyManager {
        let cManager = new ColonyManager(this);
        //cManager.init();
        return cManager;
    }

    private _initColonyVisualizer(): IColonyVisualizer {
        let cVisualizer = new ColonyVisualizer(this, this.taskData, this.outpostTaskData, this.colonyTaskData);
        //cVisualizer.init();
        return cVisualizer;
    }

    private _setDefconLevel(): void {
        if (!this.memory.enemyRooms) {
            this.memory.enemyRooms = [];
        }
        if (this.memory.enemyRooms.length > 0) {
            this.defcon = 4;
            return;
        }
        if (this.taskData.enemies.length > 0) {
            this.defcon = 3;
            return;
        }
        for (let i in this.outpostTaskData) {
            let data = this.outpostTaskData[i];
            if (data.enemies.length > 0) {
                this.memory.enemyRooms.push(i);
                this.defcon = 4;
                return;
            }
        }
    }

    private _checkEnemyRooms(): void {
        for (let i in this.memory.enemyRooms) {
            let roomName = this.memory.enemyRooms[i];
            let room = Game.rooms[roomName];
            if (room) {
                let enemies = room.find(FIND_HOSTILE_CREEPS);
                if (enemies) {
                    if (enemies.length < 1) {
                        this.memory.enemyRooms.splice(i, 1);
                    }
                }
            }
        }
    }

    init(): void {
        if (Game.time % 360 === 0) {
            this.memory.storage = false;
        }
        let storageCheck: StructureStorage[] = this.room.find(FIND_STRUCTURES, { filter: (s) =>
            s.structureType === STRUCTURE_STORAGE });
        if (storageCheck.length > 0) {
            this.storage = storageCheck[0];
        }
        console.log(`${this.spawner}`);
        if (!this.spawner) {
            return;
        }
        this.spawner.init();
        this.manager.init();
        this._setDefconLevel();
        this.mines = this._initMines();
        if (!this.baby) {
            this._findOutposts();
            this.outpostMines = this._initOutpostMines();
        }
        this.towers = this.room.find(FIND_MY_STRUCTURES, { filter: (s) =>
            (s.structureType === STRUCTURE_TOWER)
        });
        this.visualizer.init();
        for (let i in global.empire.colonies) {
            let colony = global.empire.colonies[i];
            if (colony.baby && this.controller.level > 4) {
                this.parent = true;
            }
        }
    }

    run(): void {
        if (!this.spawner) {
            return;
        }
        this.manager.run();
        this.spawner.run();
        if (this.mines) {
            _.forEach(this.mines, (mine) => {
                mine.run();
            });
        }
        if (this.outpostMines) {
            _.forEach(this.outpostMines, (mine) => {
                mine.run();
            });
        }
        this._checkEnemyRooms();
        /*if (Game.cpu.getUsed() < 10) {
            this.visualizer?.run();
        }*/
        this.visualizer?.run();
    }
}
