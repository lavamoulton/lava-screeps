import { Traveler } from "utils/Traveler";
import { profile } from "../Profiler";

@profile
export class Combat implements ICombat {

    attackers: Creep[];
    defenders: Creep[];
    private _targetRooms: string[];

    constructor() {
        this.attackers = [];
        this.defenders = [];
        this._targetRooms = [];
    }

    init(): void {
        const targetRooms = ['E7S11'];
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
        this._runDefenders();
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
                                if (attacker.pos.getRangeTo(tower) > 1) {
                                    Traveler.travelTo(attacker, tower);
                                }
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
                                if (attacker.pos.getRangeTo(hostile) > 1) {
                                    Traveler.travelTo(attacker, hostile);
                                }
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
                                if (attacker.pos.getRangeTo(structure) > 1) {
                                    Traveler.travelTo(attacker, structure);
                                }
                                continue;
                            }
                        }
                    }
                }
            } else {
                if (this.attackers.length < 1) {
                    return;
                }
                for (let i in this.attackers) {
                    let attacker = this.attackers[i];
                    if (!attacker) {
                        return;
                    }
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

    private _runDefenders(): void {
        if (!this.defenders) {
            return;
        }
        if (this.defenders.length > 0) {
            for (let i in this.defenders) {
                let defender = this.defenders[i];
                if (!defender) {
                    return;
                }
                let hostileTarget = null;
                for (let i in Game.rooms) {
                    let hostiles = Game.rooms[i].find(FIND_HOSTILE_CREEPS);
                    if (hostiles.length > 0) {
                        hostileTarget = hostiles[0];
                        break;
                    }
                }
                if (hostileTarget) {
                    if (defender.pos.getRangeTo(hostileTarget) > 1) {
                        Traveler.travelTo(defender, hostileTarget);
                        continue;
                    } else {
                        defender.attack(hostileTarget);
                        continue;
                    }
                }
                let colony = global.empire.colonies[defender.memory.colonyName];
                if (colony) {
                    if (colony.defcon = 5) {
                        Traveler.travelTo(defender, new RoomPosition(15, 20, 'E7S12'));
                        continue;
                    } else {
                        let target: Creep | null = null;
                        if (colony.taskData.enemies.length > 0) {
                            target = colony.taskData.enemies[0];
                        } else {
                            for (let i in colony.outpostTaskData) {
                                if (target) {
                                    continue;
                                }
                                let data = colony.outpostTaskData[i];
                                if (data.enemies.length > 0) {
                                    target = data.enemies[0];
                                    continue;
                                }
                            }
                        }
                        if (target) {
                            if (defender.pos.getRangeTo(target) > 1) {
                                Traveler.travelTo(defender, target);
                                continue;
                            } else {
                                defender.attack(target);
                                continue;
                            }
                        }
                    }
                }
            }
        }
    }
}
