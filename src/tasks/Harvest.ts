import { profile } from "../Profiler";
import { Task } from './Task';

@profile
export class TaskHarvest extends Task {
    constructor(target: Source, creep: Creep) {
        super('harvest', target, creep);
    }

    isValidTask() {
        return this.creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as Source;
        return target.energy > 0;
    }

    work() {
        const target = this.target as Source;
        return this.creep.harvest(target);
    }
}
