import { Task } from './Task';

export class TaskBuild extends Task {
    constructor(target: targetType, creep: Creep) {
        super('build', target, creep)
        this.taskRange = 3;
    }

    isValidTask() {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }

    isValidTarget() {
        if (!this.target) {
            return false;
        }
        const target = this.target as ConstructionSite;
        return target.my && target.progress < target.progressTotal;
    }

    work() {
        const target = this.target as ConstructionSite;
        return this.creep.build(target);
    }
}
