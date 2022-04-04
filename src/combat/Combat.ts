import { Traveler } from "utils/Traveler";
import { profile } from "../Profiler";

@profile
export class Combat implements ICombat {

    attackers: Creep[];
    private _targetRooms: string[];

    constructor() {
        this.attackers = [];
        this._targetRooms = [];
    }

    init(): void {
        const targetRooms = ['E7S12'];
        for (let i in targetRooms) {
            this._targetRooms.push(targetRooms[i]);
        }
    }

    run(): void {
        /*if (this.attackers.length < 2) {
            this.attackers.forEach((attacker) => {
                Traveler.travelTo(attacker, new RoomPosition(43, 7, 'E6S12'));
            });
            return;
        }*/
        if (this._targetRooms.length > 0) {
            let room = Game.rooms[this._targetRooms[0]];
            if (room) {
                let eTowers = room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_TOWER});
                let eHostiles = room.find(FIND_HOSTILE_CREEPS);
                let eStructures = room.find(FIND_HOSTILE_STRUCTURES);
                if (eTowers.length > 0 || eHostiles.length > 0 || eStructures.length > 0) {
                    for (let i in this.attackers) {
                        let attacker = this.attackers[i];
                        if (attacker.spawning) {
                            continue;
                        }
                        if (eTowers.length > 0) {
                            let tower = eTowers[0];
                            if (attacker.pos.getRangeTo(tower) > 3) {
                                Traveler.travelTo(attacker, tower);
                                continue;
                            } else {
                                attacker.rangedAttack(tower);
                                continue;
                            }
                        }
                        if (eHostiles.length > 0) {
                            let hostile = eHostiles[0];
                            if (attacker.pos.getRangeTo(hostile) > 3) {
                                Traveler.travelTo(attacker, hostile);
                                continue;
                            } else {
                                attacker.rangedAttack(hostile);
                                continue;
                            }
                        }
                        if (eStructures.length > 0) {
                            let structure = eStructures[0];
                            if (attacker.pos.getRangeTo(structure) > 3) {
                                Traveler.travelTo(attacker, structure);
                                continue;
                            } else {
                                attacker.rangedAttack(structure);
                                continue;
                            }
                        }
                    }
                }
            } else {
                for (let i in this.attackers) {
                    let attacker = this.attackers[i];
                    if (attacker.spawning) {
                        continue;
                    }
                    /*
                    if (Traveler.isExit(attacker.pos)) {
                        if (attacker.pos.y > 48) {
                            attacker.move(TOP);
                        }
                        if (attacker.pos.y < 1) {
                            attacker.move(BOTTOM);
                        }
                        if (attacker.pos.x < 1) {
                            attacker.move(RIGHT);
                        }
                        if (attacker.pos.x > 48) {
                            attacker.move(LEFT);
                        }
                    } else {*/
                        Traveler.travelTo(attacker, new RoomPosition(25, 25, this._targetRooms[0]));
                    //}
                }
            }
        }
    }
}
