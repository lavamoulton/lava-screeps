import { profile } from "../Profiler";
import { Task } from './Task';

@profile
export class TaskSupply extends Task {
    constructor(target: StructureSpawn | StructureExtension | StructureTower | StructureStorage, creep: Creep) {
        super('supply', target, creep);
    }

    isValidTask() {
        if (this.creep.memory.role === 'miner') {
            return true;
        }
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as StructureSpawn | StructureExtension | StructureTower | StructureStorage;
        console.log(`Target: ${target}, ${target.id}`);
        if (typeof target === typeof StructureTower) {
            return target.store.getFreeCapacity(RESOURCE_ENERGY) > 50;
        }
        return target.store.getFreeCapacity(RESOURCE_ENERGY) !== 0;
    }

    work() {
        const target = this.target as StructureSpawn | StructureExtension | StructureTower | StructureStorage;
        return this.creep.transfer(target, RESOURCE_ENERGY);
    }
}
