import { profile } from "../Profiler";

@profile
export class ColonyVisualizer implements IColonyVisualizer {

    colony: IColony;
    visual: RoomVisual;
    anchor: RoomPosition;
    private _taskData: roomTaskData;
    private _remoteTaskData: { [name: string]: roomTaskData };
    private _colonyTaskData: colonyTaskData;

    constructor(colony: IColony, taskData: roomTaskData, remoteTaskData: { [name: string]: roomTaskData }, colonyTaskData: colonyTaskData) {
        this.colony = colony;
        this.visual = new RoomVisual(this.colony.name);
        this.anchor = new RoomPosition(1, 1, this.colony.room.name);
        this._taskData = taskData;
        this._remoteTaskData = remoteTaskData;
        this._colonyTaskData = colonyTaskData;
    }

    init(): void {
    }

    run(): void {
        let table = this._createTable();
        this._drawTable(table);
    }

    private _createTable(): visualTable {
        const cellWidth = 5;
        const cellHeight = 2;
        const colCount = 7;
        const tableWidth = cellWidth * colCount;
        let rowCounter = 0;

        const titleRow = [this.colony.name, 'Enemies', 'Reservations', 'Claims', 'Outputs', 'Defense', 'Offense'];
        let titleVisuals: visualCell[] = [];
        for (let i=0; i<titleRow.length; i++) {
            titleVisuals.push({
                'x': this.anchor.x + (i * cellWidth),
                'y': this.anchor.y,
                'width': cellWidth,
                'height': cellHeight,
                'text': titleRow[i],
            });
        }
        rowCounter++;

        const cData = this._colonyTaskData;
        const colDataRow = ['', cData.enemies.length, cData.reservations.length, cData.claims.length, cData.outpostOutputs.length, cData.defenseRooms.length, cData.offenseRooms.length];
        let colDataVisuals: visualCell[] = [];
        for (let i=0; i<colDataRow.length; i++) {
            colDataVisuals.push({
                'x': this.anchor.x + (i * cellWidth),
                'y': this.anchor.y + rowCounter,
                'width': cellWidth,
                'height': cellHeight,
                'text': colDataRow[i] as string,
            });
        }
        rowCounter++;

        const roomDataTitleRow = ['Room', 'Repair', 'Build', 'Supply', 'Tower', 'Rampart', ''];
        let roomTitleVisuals: visualCell[] = [];
        for (let i=0; i<roomDataTitleRow.length; i++) {
            roomTitleVisuals.push({
                'x': this.anchor.x + (i * cellWidth),
                'y': this.anchor.y + rowCounter,
                'width': cellWidth,
                'height': cellHeight,
                'text': roomDataTitleRow[i],
            });
        }
        rowCounter++;

        const rData = this._taskData
        const roomDataRow = [this.colony.name, rData.repairTasks.length, rData.buildTasks.length, rData.supplyTasks.length, rData.towerSupplyTasks.length, rData.rampartTasks.length, ''];
        let roomDataVisuals: visualCell[] = [];
        for (let i=0; i<roomDataRow.length; i++) {
            roomDataVisuals.push({
                'x': this.anchor.x + (i * cellWidth),
                'y': this.anchor.y + rowCounter,
                'width': cellWidth,
                'height': cellHeight,
                'text': roomDataRow[i] as string,
            });
        }
        rowCounter++;

        let result: visualTable = [
            titleVisuals,
            colDataVisuals,
            roomTitleVisuals,
            roomDataVisuals,
        ]

        for (let i in this._remoteTaskData) {
            const data = this._remoteTaskData[i];
            const dataRow = [i, data.repairTasks.length, data.buildTasks.length, data.supplyTasks.length, data.towerSupplyTasks.length, data.rampartTasks.length, ''];
            let temp: visualCell[] = [];
            for (let i=0; i<dataRow.length; i++) {
                temp.push({
                    'x': this.anchor.x + (i*cellWidth),
                    'y': this.anchor.y + rowCounter,
                    'width': cellWidth,
                    'height': cellHeight,
                    'text': dataRow[i] as string,
                });
            }
            result.push(temp);
            rowCounter++;
        }

        return result;
    }

    private _drawTable(table: visualTable): void {
        const fontSize = 1;

        for (let row of table) {
            for (let cell of row) {
                this.visual.rect(cell.x, cell.y, cell.width, cell.height, {
                    stroke: '#666',
                    fill: 'transparent',
                });
                this.visual.text(cell.text, cell.x + (cell.width/2), cell.y + (cell.height/2), {
                    font: fontSize,
                });
            }
        }
    }

    private _designTable(): void {
        const titleWidth = 5;
        const dataWidth = 4;
        const dataCount = 6;
        const fontSize = 0.5;
        const tableWidth = titleWidth + (dataWidth * dataCount);
        let rowCounter = 0;
        this.visual.text(`Colony: ${this.colony.name}`, new RoomPosition(this.anchor.x+1, this.anchor.y+1, this.anchor.roomName), {
            align: 'center', font: fontSize
        });
        rowCounter++;
        this.visual.text(this._formatColonyTaskData(),
            new RoomPosition(this.anchor.x+1, this.anchor.y+rowCounter+1, this.anchor.roomName),
            {align: 'center', font: fontSize});
        rowCounter++;
        let remoteVisualText = this._formatRemoteRoomData();
        for (let text of remoteVisualText) {
            this.colony.room.visual.text(text,
                new RoomPosition(this.anchor.x+1, this.anchor.y+rowCounter+1, this.colony.room.name),
                {align: 'center', font: 0.5});
            rowCounter++;
        }
        this.visual.rect(this.anchor.x, this.anchor.y, tableWidth, rowCounter);
        this.visual.line(this.anchor.x+titleWidth, this.anchor.y, this.anchor.x+titleWidth, this.anchor.y+rowCounter);
        for (let i=0; i<dataCount; i++) {
            this.visual.line(this.anchor.x+titleWidth+(i*dataWidth), this.anchor.y, this.anchor.x+titleWidth+(i*dataWidth), this.anchor.y+rowCounter);
        }
        for (let y=0; y<rowCounter; y++) {
            this.visual.line(this.anchor.x, this.anchor.y+y, this.anchor.x+tableWidth, this.anchor.y+y);
        }
    }

    private _visualizeColony(): void {
        let name = this.colony.name;
        let roomData: roomTaskData[] = [this._taskData];

        let anchor = new RoomPosition(2, 2, this.colony.room.name);
        this.colony.room.visual.text(`Colony: ${this.colony.name}`, anchor, {
            align: 'left', font: 1
        });
        let counter = 1;
        this.colony.room.visual.text(this._formatColonyTaskData(),
            new RoomPosition(anchor.x + 0.25, anchor.y+counter, anchor.roomName),
            {align: 'left', font: 0.5});
        counter++;
        this.colony.room.visual.text(this._formatColonyRoomData(),
            new RoomPosition(anchor.x + 0.25, anchor.y+counter, this.colony.room.name),
            {align: 'left', font: 0.5});
        counter++;
        let remoteVisualText = this._formatRemoteRoomData();
        for (let text of remoteVisualText) {
            this.colony.room.visual.text(text,
                new RoomPosition(anchor.x + 0.5, anchor.y+counter, this.colony.room.name),
                {align: 'left', font: 0.5});
            counter++;
        }
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

    private _formatColonyTaskData(): string {
        const data = this._colonyTaskData;
        let result = `Colony task data: `;
        result += `Enemies: ${data.enemies.length} `;
        result += `Reservations: ${data.reservations.length} `;
        result += `Claims: ${data.claims.length} `;
        result += `Outpost outputs: ${data.outpostOutputs.length} `;
        result += `Defense rooms: ${data.defenseRooms.length} `;
        result += `Offense rooms: ${data.offenseRooms.length}`;
        return result;
    }

    private _formatColonyRoomData(): string {
        const data = this._taskData;
        let result = `${this.colony.room.name}: `;
        result += `Resources: ${data.resources.length} `;
        result += `Supply: ${data.supplyTasks.length} `;
        result += `Tower: ${data.towerSupplyTasks.length} `;
        result += `Repair: ${data.repairTasks.length} `;
        result += `Build: ${data.buildTasks.length} `;
        result += `Rampart: ${data.rampartTasks.length}`;
        return result;
    }

    private _formatRemoteRoomData(): string[] {
        const remoteData = this._remoteTaskData;
        const result: string[] = [];
        for (let i in remoteData) {
            const data = remoteData[i];
            let temp = `${i}: `;
            temp += `Resources: ${data.resources.length} `;
            temp += `Repair: ${data.repairTasks.length} `;
            temp += `Build: ${data.buildTasks.length} `;
            result.push(temp);
        }
        return result;
    }
}
