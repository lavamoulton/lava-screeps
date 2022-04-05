import { profile } from "../Profiler";
import { Traveler } from "../utils/Traveler";

@profile
export abstract class Task implements ITask {
    type: string;
    creep: Creep;
    target?: targetType | string;
    targetPos?: RoomPosition;
    taskRange: number;
    /*
    private _creep: {
        name: string;
    };
    private _target: {
        id: Id<RoomObject>,
        _pos: RoomPosition,
    } | null;
    private _taskRange: number;*/

    public constructor(type: string, target: targetType | string, creep: Creep) {
        this.type = type;
        this.creep = creep;
        this.target = target;
        if (this.type === 'move') {
            this.targetPos = new RoomPosition(25, 25, this.target as string);
        } else {
            let target = this.target as targetType;
            this.targetPos = target.pos;
        }
        this.taskRange = 1;
    }

    /*
    get creep(): Creep {
        return Game.creeps[this._creep.name];
    }

    get target(): RoomObject | null {
        if (!this._target) {
            return null;
        }
        return Game.getObjectById(this._target.id);
    }

    get targetPos(): RoomPosition | null {
        if (!this._target) {
            return null;
        }
        return this._target?._pos;
    }

    get taskRange(): number {
        return this._taskRange;
    }

    set taskRange(range: number) {
        this._taskRange = range;
    }*/

    remove(): void {
        if (this.creep) {
            this.creep.memory.task = 'none';
        }
    }

    abstract isValidTask(): boolean;

    abstract isValidTarget(): boolean;

    move(): number {
        if (!this.targetPos) {
            return -1;
        }
        return Traveler.travelTo(this.creep, this.targetPos);
        //return this.creep.moveTo(this.targetPos?.x, this.targetPos?.y);
    }

    step(): number | void {
        if (!this.target || !this.targetPos) {
            return -1;
        }
        if (this.creep.pos.inRangeTo(this.targetPos, this.taskRange)) {
            const workResult = this.work();
            if (workResult != OK) {
                console.log('Error executing task ', workResult);
                this.remove();
            }
            return workResult;
        } else {
            let colName = this.creep.memory.colonyName;
            let colony = global.empire.colonies[colName];
            if (colony) {
                if (colony.memory.enemyRooms.length > 0) {
                    if (this.targetPos.roomName in colony.memory.enemyRooms) {
                        this.remove();
                    }
                }
            }
            this.move();
        }
    }

    abstract work(): number;
}
