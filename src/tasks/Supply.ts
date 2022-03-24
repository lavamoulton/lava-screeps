import { Task } from './Task';

export class TaskSupply extends Task {
    constructor(target: StructureSpawn | StructureExtension, creep: Creep) {
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
        const target = this.target as StructureSpawn | StructureExtension;
        return target.store.getFreeCapacity(RESOURCE_ENERGY) != 0;
    }

    work() {
        const target = this.target as StructureSpawn | StructureExtension;
        return this.creep.transfer(target, RESOURCE_ENERGY);
    }
}
