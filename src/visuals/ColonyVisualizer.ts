import { profile } from "../Profiler";

@profile
export class ColonyVisualizer implements IColonyVisualizer {

    colony: IColony

    constructor(colony: IColony) {
        this.colony = colony;
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
        const colRoomData = this.colony.manager!.dataLoader!.getColonyRoomData();
        this.colony.room.visual.text(`${this.colony.room.name}: Resources: ${colRoomData.resources.length}
            Supply tasks: ${colRoomData.supplyTasks.length}
            Repair tasks: ${colRoomData.repairTasks.length}
            Build tasks: ${colRoomData.buildTasks.length}
            Rampart tasks: ${colRoomData.rampartTasks.length}`,
            new RoomPosition(anchor.x, anchor.y+1, this.colony.room.name),
            {align: 'left', font: 0.5});
        let counter = 2;
        for (let role in this.colony.creepsByRole) {
            const creeps = this.colony.creepsByRole[role];
            this.colony.room.visual.text(`${role}: ${creeps.length}`,
            new RoomPosition(anchor.x, anchor.y+counter, this.colony.room.name),
            {align: 'left', font: 0.5});
            counter++;
        }
    }
}
