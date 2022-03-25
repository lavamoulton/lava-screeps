import { Manager } from "./Manager";
import { creepTemplates } from "../templates/creepTemplates";
import { taskUtils } from "../tasks/taskUtils";
import { TaskHarvest } from "tasks/Harvest";
import { TaskSupply } from "tasks/Supply";
import { TaskUpgrade } from "tasks/Upgrade";
import { TaskBuild } from "tasks/Build";
import { TaskWithdraw } from "tasks/Withdraw";
import { RoomPlanner } from "../planners/RoomPlanner";
import { TaskRepair } from "tasks/Repair";

export class ColonyManager extends Manager {

    private _creepPriorities: { [name: string]: number } | null;
    private _roleTemplates: { [name: string]: BodyPartConstant[] } | null;
    private _roomPlanner: IRoomPlanner | null;

    constructor(colony: IColony) {
        super(colony);
        this._creepPriorities = null;
        this._roleTemplates = null;
        this._roomPlanner = null;
    }

    init(): void {
        this._creepPriorities = this._loadCreepPriorities();
        this._roleTemplates = this._loadRoleTemplates();
        for (let role in this._creepPriorities) {
            if (!this.colony.creepsByRole[role]) {
                this.colony.creepsByRole[role] = [];
            }
        }
        this._roomPlanner = new RoomPlanner(this.colony);
        this._roomPlanner.init();
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
        this._queueCreeps();
        this._runCreeps();
        this._roomPlanner?.run();
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

    private _runCreeps(): void {
        for (let i in this.colony.creeps) {
            let creep = this.colony.creeps[i];
            if (creep.memory.task === 'none') {
                this._getCreepTask(creep);
            }
            let creepTaskTemplate = taskUtils.taskStringToTemplate(creep.memory.task);
            if (creepTaskTemplate.creep === undefined) {
                creep.memory.task = 'none';
            }
            let task = taskUtils.createTask(creepTaskTemplate);
            if (!task) {
                creep.memory.task = 'none';
            } else {
                if (!task.isValidTarget() || !task.isValidTask() && creep.memory.role !== 'miner') {
                    task.remove();
                } else {
                    if (creep.memory.role === 'miner') {
                        const source = task.target as Source;
                        if (!this.colony.mines) {
                            return;
                        }
                        this.colony.mines[source.id].miner = creep;
                    }
                    task.step();
                }
            }
        }
    }

    private _getCreepTask(creep: Creep): ITask | null {
        if (creep.memory.role === 'miner') {
            if (!this.colony.mines) {
                return null;
            }
            const openMine = _.filter(this.colony.mines, (mine) => {
                return !mine.miner;
            })[0];
            if (!openMine) {
                return null;
            }
            const task = new TaskHarvest(openMine.source, creep);
            creep.memory.task = taskUtils.taskToString(task, openMine.source.id);
            return task;
        } else {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                const openMineOutputs = _.filter(this.colony.mines!, (mine) => {
                    return (mine.output && mine.remainingOutput > creep.store.getFreeCapacity(RESOURCE_ENERGY))});
                if (openMineOutputs.length > 0) {
                    const task = new TaskWithdraw(openMineOutputs[0].output!, creep);
                    creep.memory.task = taskUtils.taskToString(task, openMineOutputs[0].output!.id);
                    return task;
                }
                const source = this.colony.room.find(FIND_SOURCES_ACTIVE)[0];
                const task = new TaskHarvest(source, creep);
                creep.memory.task = taskUtils.taskToString(task, source.id);
                return task;
            }
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.memory.role === 'builder') {
                    const repairSite = this.colony.room.find(FIND_STRUCTURES, { filter: (s) => {
                        s.hits < s.hitsMax;
                    }})[0];
                    if (repairSite) {
                        const task = new TaskRepair(repairSite, creep);
                        creep.memory.task = taskUtils.taskToString(task, repairSite.id);
                        return task;
                    }
                    const constructionSite = this.colony.room.find(FIND_CONSTRUCTION_SITES)[0];
                    if (constructionSite) {
                        const task = new TaskBuild(constructionSite, creep);
                        creep.memory.task = taskUtils.taskToString(task, constructionSite.id);
                        return task;
                    }
                }
                if (this.colony.spawner!.energyNeeded < 271) {
                    const task = new TaskSupply(this.colony.spawner!.spawns[0], creep);
                    creep.memory.task = taskUtils.taskToString(task, this.colony.spawner!.spawns[0].id);
                    return task;
                }
                const repairSite = this.colony.room.find(FIND_STRUCTURES, { filter: (s) => {
                    s.hits < s.hitsMax;
                }})[0];
                if (repairSite) {
                    const task = new TaskRepair(repairSite, creep);
                    creep.memory.task = taskUtils.taskToString(task, repairSite.id);
                    return task;
                }
                const task = new TaskUpgrade(this.colony.controller, creep);
                creep.memory.task = taskUtils.taskToString(task, this.colony.controller.id);
                return task;
            }
        }
        return null;
    }
}
