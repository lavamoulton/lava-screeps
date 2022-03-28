import { profile } from "./Profiler";
import { Colony } from "./Colony";

@profile
export class Empire implements IEmpire {
    colonies: { [colName: string]: IColony };

    constructor() {
        this.colonies = {};
    }

    private _initMemory(): void {
        if (!Memory.colonies) {
            Memory.colonies = {};
        }
    }

    private _initColonies(): void {
        for (let roomName in Game.rooms) {
            if (Game.rooms[roomName].controller?.my) {
                this.colonies[roomName] = new Colony(roomName, Game.rooms[roomName]);
            }
        }
    }

    private _initCreeps(): void {
        let creepsByColony = _.groupBy(Game.creeps, creep => creep.memory.colonyName) as { [colonyName: string]: Creep[] };
        for (let colName in this.colonies) {
            let colony = this.colonies[colName];
            let colCreeps: Creep[] = creepsByColony[colName];
            colony.creeps = colCreeps;
            colony.creepsByRole = _.groupBy(colCreeps, creep => creep.memory.role) as { [roleName: string]: Creep[] };
        }
    }

    init(): void {
        this._initMemory();
        this._initColonies();
        this._initCreeps();
    }

    run(): void {

    }
}
