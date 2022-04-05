import { profile } from "../Profiler";
import { Manager } from "./Manager";
import { creepTemplates } from "../templates/creepTemplates";

@profile
export class SpawnerManager extends Manager {

    private _creepPriorities: { [name: string]: number } | null;
    private _roleTemplates: { [name: string]: BodyPartConstant[] } | null;
    private _roleBodyTemplates: { [name: string]: roleTemplate } | null;

    constructor(colony: IColony) {
        super(colony);
        this._creepPriorities = null;
        this._roleTemplates = null;
        this._roleBodyTemplates = null;
    }

    init(): void {
        this._creepPriorities = this._loadCreepPriorities();
        this._roleTemplates = this._loadRoleTemplates();
        this._roleBodyTemplates = this._loadRoleBodyTemplates();
        for (let role in this._creepPriorities) {
            if (!this.colony.creepsByRole[role]) {
                this.colony.creepsByRole[role] = [];
            }
        }
    }

    run(): void {
        if (!this.colony.creeps) {
            this._spawnEmergencyWorker();
            return;
        }
        if (this.colony.creepsByRole['worker'].length < 1) {
            this._spawnEmergencyWorker();
            return;
        }
        this._queueCreeps();
    }

    private _loadCreepPriorities(): { [name: string]: number } {
        return creepTemplates.CREEP_PRIORITIES;
    }

    private _loadRoleTemplates(): { [name: string]: BodyPartConstant[] } {
        return creepTemplates.ROLE_TEMPLATES;
    }

    private _loadRoleBodyTemplates(): { [name: string]: roleTemplate } {
        return creepTemplates.ROLE_BODY_TEMPLATES;
    }

    private _spawnEmergencyWorker(): void {
        let emerTemplate = {
            name: "emerWorker" + Game.time,
            body: [WORK, WORK, CARRY, MOVE],
            memory: {
                role: 'worker',
                room: this.colony.room,
                task: 'none',
                colonyName: this.colony.name,
            }
        }
        this.colony.spawner?.queueCreep(emerTemplate, 1);
    }

    private _queueCreeps(): void {
        if (this.colony.creepsByRole['worker'].length < 3) {
            const workerTemplate = this._getCreepTemplate('worker');
            this.colony.spawner?.queueCreep(workerTemplate, 1);
        }
        if (this.colony.mines) {
            let numMines = Object.keys(this.colony.mines).length;
            if (this.colony.creepsByRole['miner'].length < numMines) {
                const minerTemplate = this._getCreepTemplate('miner');
                console.log(`Attempting to spawn miner`);
                this.colony.spawner?.queueCreep(minerTemplate, 2);
            }
            if (this.colony.storage) {
                if (this.colony.creepsByRole['hauler'].length < numMines) {
                    const haulerTemplate = this._getCreepTemplate('hauler');
                    this.colony.spawner.queueCreep(haulerTemplate, 5);
                }
            }
            if (this.colony.outpostMines) {
                let numOutpostMines = Object.keys(this.colony.outpostMines).length;
                if (this.colony.creepsByRole['miner'].length < numMines + numOutpostMines) {
                    const minerTemplate = this._getCreepTemplate('miner');
                    this.colony.spawner.queueCreep(minerTemplate, 6);
                }
                if (this.colony.creepsByRole['hauler'].length < (numMines + numOutpostMines - 1)) {
                    const haulerTemplate = this._getCreepTemplate('hauler');
                    this.colony.spawner.queueCreep(haulerTemplate, 7);
                }
            }
        }
        const colonyRoomData = this.colony.taskData;
        const numConstructionSites = colonyRoomData.buildTasks.length;
        const numRepairSites = colonyRoomData.repairTasks.length;
        const numRampartSites = colonyRoomData.rampartTasks.length;
        const builderTarget = 2;
        //const builderTarget = (numConstructionSites / 10) + (numRepairSites / 20) + (numRampartSites / 100) + 1;
        if (this.colony.creepsByRole['builder'].length < builderTarget) {
            const builderTemplate = this._getCreepTemplate('builder');
            this.colony.spawner?.queueCreep(builderTemplate, 4);
        }
        if (this.colony.creepsByRole['upgrader'].length < 1) {
            const upgraderTemplate = this._getCreepTemplate('upgrader');
            this.colony.spawner?.queueCreep(upgraderTemplate, 3);
        }
        if (this.colony.creepsByRole['miner'].length < 7) {
            const minerTemplate = this._getCreepTemplate('miner');
            this.colony.spawner.queueCreep(minerTemplate, 6);
        }
        if (this.colony.creepsByRole['scout'].length < 2) {
            const scoutTemplate = this._getCreepTemplate('scout');
            this.colony.spawner?.queueCreep(scoutTemplate, 7);
        }
        if (this.colony.creepsByRole['melee'].length < 0) {
            const meleeTemplate = this._getCreepTemplate('melee');
            //this.colony.spawner.queueCreep(meleeTemplate, 8);
        }
        if (this.colony.creepsByRole['attacker'].length < 0) {
            const attackerTemplate = this._getCreepTemplate('attacker');
            this.colony.spawner.queueCreep(attackerTemplate, 9);
        }
        if (this.colony.defcon < 5 || this.colony.creeps.length > 14) {
            if (this.colony.creepsByRole['defender'].length < 0) {
                const defenderTemplate = this._getCreepTemplate('defender');
                this.colony.spawner.queueCreep(defenderTemplate, 1);
            }
        }
        if (this.colony.creepsByRole['defender'].length < 0) {
            const defenderTemplate = this._getCreepTemplate('defender');
            this.colony.spawner.queueCreep(defenderTemplate, 5)
        }
    }

    private _getCreepTemplate(name: string): creepTemplate {
        return {
            name: name + Game.time,
            body: this._getCreepBody(name),
            memory: {
                role: name,
                room: this.colony.room,
                task: 'none',
                colonyName: this.colony.name,
            }
        }
    }

    private _getCreepBody(role: string): BodyPartConstant[] {
        const defaultBody = [WORK, WORK, CARRY, MOVE];
        if (!this._roleBodyTemplates) {
            return defaultBody;
        }
        if (role in this._roleBodyTemplates) {
            const roleTemplate = this._roleBodyTemplates[role];
            if (!roleTemplate) {
                return defaultBody;
            }
            const prefix = roleTemplate.prefix;
            const body = roleTemplate.body;
            const suffix = roleTemplate.suffix;
            const prefixCost = this._getBodyCost(prefix);
            const bodyCost = this._getBodyCost(body);
            const suffixCost = this._getBodyCost(suffix);
            let maxEnergy = 0;
            if (this.colony.spawner?.maxEnergy) {
                maxEnergy = this.colony.spawner.maxEnergy;
            }
            if (prefixCost > maxEnergy || bodyCost > maxEnergy) {
                return defaultBody;
            } else {
                let result: BodyPartConstant[] = [];
                let remainingEnergy = maxEnergy;
                result = result.concat(prefix);
                remainingEnergy -= prefixCost;

                if (bodyCost > 0) {
                    while (remainingEnergy > bodyCost) {
                        result = result.concat(body);
                        remainingEnergy -= bodyCost;
                    }
                }

                return result;
            }
        }
        if (role in this._roleTemplates!) {
            return this._roleTemplates![role];
        } else {
            console.log('Error finding creep body, generating default');
            return [WORK, WORK, CARRY, MOVE];
        }
    }

    private _getBodyCost(body: BodyPartConstant[]) {
        const partCosts: { [bodyPart: string]: number } = {
            move: 50,
            work: 100,
            carry: 50,
            attack: 50,
            ranged_attack: 150,
            heal: 250,
            claim: 600,
            tough: 10,
        };
        let result = 0;
        for (let part of body) {
            result += partCosts[part];
        }
        return result;
    }
}
