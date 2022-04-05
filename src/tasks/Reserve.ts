import { profile } from "../Profiler";
import { Task } from './Task';

@profile
export class TaskReserve extends Task {
    constructor(target: StructureController, creep: Creep) {
        super('reserve', target, creep);
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
        if (target.sign) {
            if (target.sign.username !== 'Lava') {
                this.creep.signController(target, 'Hold the door - Hodor');
            }
        } else {
            this.creep.signController(target, 'Hold the door - Hodor');
        }
        return this.creep.reserveController(target);
    }
}
