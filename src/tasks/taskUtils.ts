import { TaskHarvest } from "./Harvest";
import { TaskSupply } from "./Supply";
import { TaskUpgrade } from "./Upgrade";
import { TaskBuild } from "./Build";
import { TaskWithdraw } from "./Withdraw";
import { TaskPickup } from "./Pickup";
import { TaskRepair } from "./Repair";

const split = '.';

function taskTemplateToString(taskTemplate: TaskTemplate): string {
    return `${taskTemplate.type}${split}${taskTemplate.creep.name}${split}${taskTemplate.targetID}`;
}


function taskStringToTemplate(taskString: string): TaskTemplate {
    const splitString = taskString.split(split);
    return {
        type: splitString[0],
        creep: Game.creeps[splitString[1]],
        targetID: splitString[2] as Id<RoomObject>,
    }
}

function taskToString(task: ITask, targetID: string): string {
    return `${task.type}${split}${task.creep.name}${split}${targetID}`
}

function createTask(taskTemplate: TaskTemplate): ITask | null {
    const target = Game.getObjectById(taskTemplate.targetID);
    if (!target) {
        if (!taskTemplate.creep) {
            return null;
        }
        console.log(`Task template creep: ${taskTemplate.creep.name}`);
        taskTemplate.creep.memory.task = 'none';
        return null;
    } else {
        switch(taskTemplate.type) {
            case 'harvest':
                return new TaskHarvest(target as Source, taskTemplate.creep);
            case 'supply':
                return new TaskSupply(target as StructureSpawn | StructureExtension | StructureTower, taskTemplate.creep);
            case 'upgrade':
                return new TaskUpgrade(target as StructureController, taskTemplate.creep);
            case 'build':
                return new TaskBuild(target as ConstructionSite, taskTemplate.creep);
            case 'withdraw':
                return new TaskWithdraw(target as withdrawType, taskTemplate.creep);
            case 'pickup':
                return new TaskPickup(target as Resource, taskTemplate.creep);
            case 'repair':
                return new TaskRepair(target as Structure, taskTemplate.creep);
            default:
                return null;
        }
    }
}

export const taskUtils = {
    taskTemplateToString,
    taskStringToTemplate,
    taskToString,
    createTask,
}
