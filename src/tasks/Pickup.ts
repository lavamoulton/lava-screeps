import { Task } from './Task';

export class TaskPickup extends Task {

    constructor(target: Resource, creep: Creep) {
        super('pickup', target, creep);
    }

    isValidTask() {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as Resource;
        return target.amount > 0;
    }

    work() {
        const target = this.target as Resource;
        return this.creep.pickup(target);
    }
}
