import { Traveler } from "../utils/Traveler";

export abstract class Task implements ITask {
    type: string;
    private _creep: {
        name: string;
    };
    private _target: {
        id: Id<RoomObject>,
        _pos: RoomPosition,
    } | null;
    private _taskRange: number;

    constructor(type: string, target: targetType, creep: Creep) {
        this.type = type;
        this._creep = {
            name: creep.name,
        };
        this._target = {
            id: target.id as Id<RoomObject>,
            _pos: target.pos,
        };
        this._taskRange = 1;
    }

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
    }

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
            this.move();
        }
    }

    abstract work(): number;
}
