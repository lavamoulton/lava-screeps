import { profile } from "../Profiler";
import { Traveler } from "../utils/Traveler";
import { Task } from "./Task";

@profile
export class TaskMove extends Task {
    constructor(target: string, creep: Creep) {
        super('move', target, creep);
        let room = Game.rooms[target];
        this.taskRange = 5;
        if (room) {
            let source = room.find(FIND_SOURCES)[0];
            if (source) {
                this.targetPos = new RoomPosition(source.pos.x, source.pos.y, target);
            }
        } else {
            this.targetPos = new RoomPosition(25, 25, target);
        }
    }

    isValidTask() {
        if (Traveler.isExit(this.creep.pos)) {
            return true;
        }
        if (!this.targetPos) {
            return false;
        }
        return true;
    }

    isValidTarget() {
        if (this.target && this.targetPos) {
            return true;
        }
        return false;
    }

    move(): number {
        if (!this.targetPos) {
            return -1;
        }
        if (Traveler.isExit(this.creep.pos)) {
            if (this.creep.pos.y > 48) {
                this.creep.move(TOP);
            }
            if (this.creep.pos.y < 1) {
                this.creep.move(BOTTOM);
            }
            if (this.creep.pos.x < 1) {
                this.creep.move(RIGHT);
            }
            if (this.creep.pos.x > 48) {
                this.creep.move(LEFT);
            }
        }
        return Traveler.travelTo(this.creep, this.targetPos);
        //return this.creep.moveTo(this.targetPos?.x, this.targetPos?.y);
    }

    work(): number {
        return 1;
    }
}
