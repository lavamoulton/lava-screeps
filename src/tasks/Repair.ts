import { Task } from './Task';

export class TaskRepair extends Task {
    constructor(target: Structure, creep: Creep) {
        super('repair', target, creep);
        this.taskRange = 3;
    }

    isValidTask() {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as Structure;
        return target.hits < target.hitsMax;
    }

    work() {
        const target = this.target as Structure;
        return this.creep.repair(target);
    }
}
