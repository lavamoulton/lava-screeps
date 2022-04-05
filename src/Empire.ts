import { profile } from "./Profiler";
import { Colony } from "./Colony";
import { Mapper } from "./mapper/Mapper";
import { Combat } from "./combat/Combat";

@profile
export class Empire implements IEmpire {
    colonies: { [colName: string]: IColony };
    mapper: IMapper;
    combat: ICombat;

    constructor() {
        this.colonies = {};
        this.mapper = new Mapper();
        this.combat = new Combat();
    }

    private _initMemory(): void {
        if (!Memory.colonies) {
            Memory.colonies = {};
        }
        if (!Memory.mapper) {
            Memory.mapper = {};
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
            this.combat.attackers = colony.creepsByRole['attacker'];
            this.combat.defenders = colony.creepsByRole['defender'];
        }
    }

    init(): void {
        this._initMemory();
        this._initColonies();
        this._initCreeps();
        this.mapper.init();
        this.combat.init();
    }

    run(): void {
        this.mapper.run();
        this.combat.run();
    }
}
