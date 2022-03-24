import { ColonyManager } from './managers/ColonyManager';
import { Spawner } from './structures/Spawner';
import { Mine } from 'structures/Mine';

export class Colony implements IColony {
    name: string;
    room: Room;
    controller: StructureController;
    creeps: Creep[];
    creepsByRole: { [roleName: string]: Creep[] };
    spawner: ISpawner | null;
    mines: { [sourceID: Id<Source>]: IMine } | null;
    manager: IManager | null;

    constructor(name: string, room: Room) {
        if (!Memory.colonies[name]) {
            Memory.colonies[name] = {};
        }
        this.name = name;
        this.room = room;
        this.controller = this.room.controller!;
        this.creeps = [];
        this.creepsByRole = {};
        this.spawner = null;
        this.mines = null;
        this.manager = null;
    }

    get memory(): any {
        return Memory.colonies[this.name];
    }

    private _initSpawner(): ISpawner {
        let spawn: StructureSpawn = this.room.find(FIND_STRUCTURES, {filter: (s) =>
            s.structureType == STRUCTURE_SPAWN})[0] as StructureSpawn;
        let spawner = new Spawner(spawn.id, this.room, this);
        spawner.init();
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

    private _initColonyManager(): IManager {
        let cManager: IManager = new ColonyManager(this);
        cManager.init();
        return cManager;
    }

    init(): void {
        this.spawner = this._initSpawner();
        this.manager = this._initColonyManager();
        this.mines = this._initMines();
    }

    run(): void {
        this.manager?.run();
        this.spawner?.run();
        if (this.mines) {
            _.forEach(this.mines, (mine) => {
                mine.run();
            });
        }
    }
}
