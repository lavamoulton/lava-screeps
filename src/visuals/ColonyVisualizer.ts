import { profile } from "../Profiler";

@profile
export class ColonyVisualizer implements IColonyVisualizer {

    colony: IColony;
    private _taskData: roomTaskData;
    private _remoteTaskData: { [name: string]: roomTaskData };

    constructor(colony: IColony, taskData: roomTaskData, remoteTaskData: { [name: string]: roomTaskData }) {
        this.colony = colony;
        this._taskData = taskData;
        this._remoteTaskData = remoteTaskData;
    }

    init(): void {

    }

    run(): void {
        this._visualizeColony();
    }

    private _visualizeColony(): void {
        let anchor = new RoomPosition(2, 2, this.colony.room.name);
        this.colony.room.visual.text(`Colony: ${this.colony.name}`, anchor, {
            align: 'left', font: 1
        });
        const colRoomData = this._taskData;
        this.colony.room.visual.text(`${this.colony.room.name}: Resources: ${colRoomData.resources.length}
            Supply tasks: ${colRoomData.supplyTasks.length}
            Tower supply tasks: ${colRoomData.towerSupplyTasks.length}
            Repair tasks: ${colRoomData.repairTasks.length}
            Build tasks: ${colRoomData.buildTasks.length}
            Rampart tasks: ${colRoomData.rampartTasks.length}`,
            new RoomPosition(anchor.x, anchor.y+1, this.colony.room.name),
            {align: 'left', font: 0.5});
        let counter = 2;
        const rData = this._remoteTaskData;
        for (let i in rData) {
            const roomData = rData[i];
            this.colony.room.visual.text(`${i}: Resources: ${roomData.resources.length}
                Repair tasks: ${roomData.repairTasks.length}
                Build tasks: ${roomData.buildTasks.length}
                Rampart tasks: ${roomData.rampartTasks.length}`,
                new RoomPosition(anchor.x, anchor.y+counter, this.colony.room.name),
                {align: 'left', font: 0.5});
            counter++;
        }
        for (let role in this.colony.creepsByRole) {
            const creeps = this.colony.creepsByRole[role];
            let tasks: { [task: string]: number } = {};
            _.forEach(creeps, (creep) => {
                let splitTask = creep.memory.task.split('.');
                let type = splitTask[0];
                if (!tasks[type]) {
                    tasks[type] = 0;
                }
                tasks[type] += 1;
            });
            let result = `${role} (${creeps.length}) | `;
            for (let task in tasks) {
                const taskNumber = tasks[task];
                result += `${task}: ${taskNumber} | `;
            }
            this.colony.room.visual.text(`${result}`,
            new RoomPosition(anchor.x, anchor.y+counter, this.colony.room.name),
            {align: 'left', font: 0.5});
            counter++;
        }
    }
}
