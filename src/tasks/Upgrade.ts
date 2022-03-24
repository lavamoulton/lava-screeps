import { Task } from './Task';

export class TaskUpgrade extends Task {
    constructor(target: StructureController, creep: Creep) {
        super('upgrade', target, creep);
        this.taskRange = 3;
    }

    isValidTask() {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as StructureController;
        return target.my;
    }

    work() {
        const target = this.target as StructureController;
        return this.creep.upgradeController(target);
    }
}
