import { profile } from "../Profiler";
import { Task } from './Task';

@profile
export class TaskClaim extends Task {
    constructor(target: StructureController, creep: Creep) {
        super('claim', target, creep);
        this.taskRange = 1;
    }

    isValidTask() {
        return this.creep.getActiveBodyparts(CLAIM) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        return true;
    }

    work() {
        const target = this.target as StructureController;
        return this.creep.claimController(target);
    }
}
