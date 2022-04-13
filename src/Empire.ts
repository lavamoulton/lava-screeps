import { profile } from "./Profiler";
import { Colony } from "./Colony";
import { Mapper } from "./mapper/Mapper";
import { Combat } from "./combat/Combat";
import { Observer } from "mapper/Observer";

@profile
export class Empire implements IEmpire {
    colonies: { [colName: string]: IColony };
    mapper: IMapper;
    combat: ICombat;
    observer: IObserver;

    constructor() {
        this.colonies = {};
        this.mapper = new Mapper();
        this.combat = new Combat();
        this.observer = new Observer();
    }

    private _initMemory(): void {
        if (!Memory.colonies) {
            Memory.colonies = {};
        }
        if (!Memory.mapper) {
            Memory.mapper = {};
        }
        if (!Memory.map) {
            Memory.map = {};
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
        this.combat.attackers = [];
        this.combat.defenders = [];
        let creepsByColony = _.groupBy(Game.creeps, creep => creep.memory.colonyName) as { [colonyName: string]: Creep[] };
        for (let colName in this.colonies) {
            let colony = this.colonies[colName];
            let colCreeps: Creep[] = creepsByColony[colName];
            colony.creeps = colCreeps;
            if (!colony.creeps) {
                continue;
            }
            colony.creepsByRole = _.groupBy(colCreeps, creep => creep.memory.role) as { [roleName: string]: Creep[] };
            this.combat.attackers = this.combat.attackers.concat(colony.creepsByRole['attacker']);
            this.combat.defenders = this.combat.defenders.concat(colony.creepsByRole['defender']);
        }
    }

    init(): void {
        this._initMemory();
        this._initColonies();
        this._initCreeps();
        this.mapper.init();
        this.combat.init();
        this.observer.init();
    }

    run(): void {
        this.mapper.run();
        this.observer.run();
        this.combat.run();
    }
}
