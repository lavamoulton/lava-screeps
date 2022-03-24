import { Structure } from './Structure';

export class Spawner extends Structure implements ISpawner {
    memory: any;
    spawns: StructureSpawn[];
    extensions: StructureExtension[];
    private _spawnQueue: { [priority: number]: creepTemplate[] };

    constructor(id: Id<StructureSpawn>, room: Room, colony: IColony) {
        super(id, room, colony);
        this.spawns = this.room.find(FIND_STRUCTURES, {filter: (s) =>
            s.structureType === STRUCTURE_SPAWN});
        this.extensions = this.room.find(FIND_STRUCTURES, {filter: (s) =>
            s.structureType === STRUCTURE_EXTENSION});
        this._spawnQueue = [];
    }

    get availableSpawns(): StructureSpawn[] {
        return _.filter(this.spawns, (s: StructureSpawn) => !s.spawning);
    }

    get energyNeeded(): number {
        let result = 0;
        for (let spawn in this.spawns) {
            result += this.spawns[spawn].store.getFreeCapacity(RESOURCE_ENERGY);
        }
        for (let extension in this.extensions) {
            result += this.extensions[extension].store.getFreeCapacity(RESOURCE_ENERGY);
        }
        return result;
    }

    queueCreep(creepTemplate: creepTemplate, priority?: number): void {
        if (priority === undefined) {
            priority = 1000;
        }
        if (!this._spawnQueue[priority]) {
            this._spawnQueue[priority] = [];
        }
        this._spawnQueue[priority].push(creepTemplate);
    }

    private _spawnHighestPriorityCreep(): number | void {
        let priorities: number[] = _.map(Object.keys(this._spawnQueue), key => parseInt(key, 10)).sort();
        for (let priority of priorities) {
            let creepTemplate = this._spawnQueue[priority].shift();
            if (creepTemplate) {
                if (this.availableSpawns.length > 0) {
                    let result = this.availableSpawns[0].spawnCreep(creepTemplate.body, creepTemplate.name,
                        { memory: creepTemplate.memory });
                    return result;
                }
            }
        }
    }

    init(): void {

    }

    run(): void {
        this._spawnHighestPriorityCreep();
    }
}
