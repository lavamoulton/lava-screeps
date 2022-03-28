import { profile } from "../Profiler";
import { Task } from './Task';

@profile
export class TaskWithdraw extends Task {

    constructor(target: withdrawType, creep: Creep) {
        super('withdraw', target, creep);
    }

    isValidTask() {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as withdrawType;
        return target.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }

    work() {
        const target = this.target as withdrawType;
        return this.creep.withdraw(target, RESOURCE_ENERGY);
    }
}
