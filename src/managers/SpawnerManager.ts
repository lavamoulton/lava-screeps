import { Manager } from "./Manager";
import { creepTemplates } from "../templates/creepTemplates";

export class ColonyManager extends Manager {

    private _creepPriorities: { [name: string]: number } | null;
    private _roleTemplates: { [name: string]: BodyPartConstant[] } | null;

    constructor(colony: IColony) {
        super(colony);
        this._creepPriorities = null;
        this._roleTemplates = null;
    }

    init(): void {
        this._creepPriorities = this._loadCreepPriorities();
        this._roleTemplates = this._loadRoleTemplates();
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
        if (this.colony.creeps.length < 4) {
            this._spawnEmergencyWorker();
            return;
        }
    }

    private _loadCreepPriorities(): { [name: string]: number } {
        return creepTemplates.CREEP_PRIORITIES;
    }

    private _loadRoleTemplates(): { [name: string]: BodyPartConstant[] } {
        return creepTemplates.ROLE_TEMPLATES;
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
        if (this.colony.creepsByRole['worker'].length < 5) {
            this.colony.spawner?.queueCreep({
                name: 'worker' + Game.time,
                body: this._getCreepBody('builder'),
                memory: {
                    role: 'worker',
                    room: this.colony.name,
                    task: 'none',
                    colonyName: this.colony.name,
                }
            })
        }
        if (this.colony.mines) {
            let numMines = Object.keys(this.colony.mines).length;
            if (this.colony.creepsByRole['miner'].length < numMines) {
                this.colony.spawner?.queueCreep({
                    name: 'miner' + Game.time,
                    body: this._getCreepBody('miner'),
                    memory: {
                        role: 'miner',
                        room: this.colony.room.name,
                        task: 'none',
                        colonyName: this.colony.name,
                    }
                });
            }
            let numConstructionSites = this.colony.room.find(FIND_CONSTRUCTION_SITES).length;
            if (this.colony.creepsByRole['builder'].length < ((numConstructionSites / 5) + 1)) {
                this.colony.spawner?.queueCreep({
                    name: 'builder' + Game.time,
                    body: this._getCreepBody('builder'),
                    memory: {
                        role: 'builder',
                        room: this.colony.room.name,
                        task: 'none',
                        colonyName: this.colony.name,
                    }
                });
            }
        }
    }

    private _getCreepBody(role: string) {
        if (role in this._roleTemplates!) {
            return this._roleTemplates![role];
        } else {
            console.log('Error finding creep body, generating default');
            return [WORK, WORK, CARRY, MOVE];
        }
    }
}
