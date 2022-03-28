import { Manager } from "./Manager";
import { creepTemplates } from "../templates/creepTemplates";
import { taskUtils } from "../tasks/taskUtils";
import { TaskHarvest } from "tasks/Harvest";
import { TaskSupply } from "tasks/Supply";
import { TaskUpgrade } from "tasks/Upgrade";
import { TaskBuild } from "tasks/Build";
import { TaskWithdraw } from "tasks/Withdraw";
import { profile } from "../Profiler";
import { RoomPlanner } from "../planners/RoomPlanner";
import { TaskRepair } from "tasks/Repair";
import { TaskPickup } from "tasks/Pickup";
import { SpawnerManager } from "./SpawnerManager";
import { DataLoader } from "./DataLoader";

@profile
export class ColonyManager extends Manager implements IColonyManager {

    private _taskPriorities: { [name: string]: { [priority: number]: string } } | null;
    roomPlanner?: IRoomPlanner;
    spawnerManager?: ISpawnerManager;
    dataLoader?: IDataLoader;
    rampartTarget: number;

    constructor(colony: IColony) {
        super(colony);
        this._taskPriorities = null;
        this.rampartTarget = 0;
    }

    init(): void {
        this.spawnerManager = new SpawnerManager(this.colony);
        this.spawnerManager.init();
        this._taskPriorities = this._loadTaskPriorities();
        this.rampartTarget = this._setRampartTarget();
        this.dataLoader = new DataLoader(this.colony, this);
        this.dataLoader.init();
        if (Game.time % 60 === 0) {
            this.roomPlanner = new RoomPlanner(this.colony);
            this.roomPlanner.init();
        }
    }

    run(): void {
        this.spawnerManager?.run();
        this._runCreeps();
        this._runTowers();
        this.dataLoader?.run();
        if (Game.time % 60 === 0) {
            this.roomPlanner?.run();
        }
    }

    private _loadTaskPriorities(): { [name: string]: { [priority: number]: string } } {
        return creepTemplates.TASK_PRIORITIES;
    }

    private _setRampartTarget(): number {
        return 160000;
        /*
        console.log(`Max colony energy: ${this.colony.maxEnergy}`);
        let totalEnergy = 0;
        const highestRampartHits = this._getHighestRampartHits();
        if (!this.colony.memory.rampartTarget) {
            this.colony.memory.rampartTarget = highestRampartHits-2;
        }
        if (this._checkRampartEquality(highestRampartHits)) {
            const containers: StructureContainer[] = this.colony.room.find(FIND_STRUCTURES, { filter: (s) =>
                s.structureType === STRUCTURE_CONTAINER});
            if (containers) {
                _.forEach(containers, (c) => {
                    totalEnergy += c.store.getUsedCapacity(RESOURCE_ENERGY);
                });
            }
            totalEnergy += this.colony.spawner!.maxEnergy - this.colony.spawner!.energyNeeded;
            if (this.colony.towers) {
                _.forEach(this.colony.towers, (t) => {
                    totalEnergy += t.store.getUsedCapacity(RESOURCE_ENERGY);
                });
            }
            if (totalEnergy > (this.colony.maxEnergy * .9)) {
                console.log(`Have extra energy, setting higher rampart target of ${highestRampartHits + 10000}`);
                return highestRampartHits + 10000;
            }
        }
        console.log(`Setting rampart target of ${highestRampartHits}`);
        if (highestRampartHits < this.colony.memory.rampartTarget - 500) {
            return this.colony.memory.rampartTarget;
        }
        return highestRampartHits - 2;*/
    }

    private _getHighestRampartHits(): number {
        let highestHits = 0;
        let ramparts = this.colony.room.find(FIND_MY_STRUCTURES, { filter: (s) =>
            s.structureType === STRUCTURE_RAMPART
        });
        if (ramparts) {
            _.forEach(ramparts, (r) => {
                if (r.hits > highestHits) {
                    highestHits = r.hits;
                }
            });
        }
        return highestHits;
    }

    private _checkRampartEquality(hits: number): boolean {
        let ramparts = this.colony.room.find(FIND_MY_STRUCTURES, { filter: (s) =>
            s.structureType === STRUCTURE_RAMPART
        });
        let result = true;
        if (ramparts) {
            _.forEach(ramparts, (r) => {
                if (r.hits < hits) {
                    result = false;
                }
            })
        }
        return result;
    }

    private _runCreeps(): void {
        for (let i in this.colony.creeps) {
            let creep = this.colony.creeps[i];
            console.log(`${creep.name}: ${creep.memory.task}`);
            if (creep.memory.role === 'scout') {
                continue;
            }
            if (creep.memory.task === 'none') {
                const task = this._getCreepTask(creep);
                if (task) {
                    this._checkTaskData(task, creep);
                }
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
                    if (task.type === 'repair') {

                    }
                    this._checkTaskData(task, creep);
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
            const colTaskData = this.dataLoader!.taskData![this.colony.room.name];
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                const droppedResource = colTaskData.resources[0];
                if (droppedResource) {
                    const task = new TaskPickup(droppedResource, creep);
                    creep.memory.task = taskUtils.taskToString(task, droppedResource.id);
                    return task;
                }
                const tombstone = colTaskData.tombstones[0];
                if (tombstone) {
                    const task = new TaskWithdraw(tombstone, creep);
                    creep.memory.task = taskUtils.taskToString(task, tombstone.id);
                    return task;
                }
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
                if (creep.memory.role === 'upgrader') {
                    const task = new TaskUpgrade(this.colony.controller, creep);
                    creep.memory.task = taskUtils.taskToString(task, this.colony.controller.id);
                    return task;
                }
                if (creep.memory.role === 'builder') {
                    const repairSite = colTaskData.repairTasks[0];
                    if (repairSite) {
                        const task = new TaskRepair(repairSite, creep);
                        creep.memory.task = taskUtils.taskToString(task, repairSite.id);
                        return task;
                    }
                    const constructionSite = colTaskData.buildTasks[0];
                    if (constructionSite) {
                        const task = new TaskBuild(constructionSite, creep);
                        creep.memory.task = taskUtils.taskToString(task, constructionSite.id);
                        return task;
                    }
                    const rampartTask = colTaskData.rampartTasks[0];
                    if (rampartTask) {
                        const task = new TaskRepair(rampartTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, rampartTask.id);
                        return task;
                    }
                    const task = new TaskUpgrade(this.colony.controller, creep);
                    creep.memory.task = taskUtils.taskToString(task, this.colony.controller.id);
                    return task;
                }
                if (creep.memory.role === 'worker') {
                    const supplyTask = colTaskData.supplyTasks[0];
                    if (supplyTask) {
                        const task = new TaskSupply(this.colony.spawner!.spawns[0], creep);
                        creep.memory.task = taskUtils.taskToString(task, supplyTask.id);
                        return task;
                    }
                    const repairSite = colTaskData.repairTasks[0];
                    if (repairSite) {
                        const task = new TaskRepair(repairSite, creep);
                        creep.memory.task = taskUtils.taskToString(task, repairSite.id);
                        return task;
                    }
                    const constructionSite = colTaskData.buildTasks[0];
                    if (constructionSite) {
                        const task = new TaskBuild(constructionSite, creep);
                        creep.memory.task = taskUtils.taskToString(task, constructionSite.id);
                        return task;
                    }
                    const rampartTask = colTaskData.rampartTasks[0];
                    if (rampartTask) {
                        const task = new TaskRepair(rampartTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, rampartTask.id);
                        return task;
                    }
                }
                const task = new TaskUpgrade(this.colony.controller, creep);
                creep.memory.task = taskUtils.taskToString(task, this.colony.controller.id);
                return task;
            }
        }
        return null;
    }

    private _checkTaskData(task: ITask, creep: Creep): void {
        const colRoomData = this.dataLoader!.getColonyRoomData();
        const creepEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        switch(task.type) {
            case 'supply':
                const supplyTarget = task.target as (StructureSpawn | StructureExtension | StructureTower);
                if (creepEnergy > supplyTarget.store.getFreeCapacity(RESOURCE_ENERGY)) {
                    colRoomData.supplyTasks.splice(
                        colRoomData.supplyTasks.indexOf(supplyTarget), 1);
                }
                break;
            case 'repair':
                const repairTarget = task.target as Structure;
                if (creepEnergy > (repairTarget.hitsMax - repairTarget.hits)) {
                    colRoomData.repairTasks.splice(
                        colRoomData.repairTasks.indexOf(repairTarget), 1);
                }
                break;
            case 'build':
                const buildTarget = task.target as ConstructionSite;
                if (creepEnergy > (buildTarget.progressTotal - buildTarget.progress)) {
                    colRoomData.buildTasks.splice(
                        colRoomData.buildTasks.indexOf(buildTarget), 1);
                }
        }
    }

    private _runTowers(): void {
        if (this.colony.towers) {
            for (let i in this.colony.towers) {
                const tower = this.colony.towers[i];
                const enemies = this.colony.room.find(FIND_HOSTILE_CREEPS);
                if (enemies.length > 0) {
                    tower.attack(enemies[0]);
                } else {
                    if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 400) {
                        const repairSite = this.colony.room.find(FIND_STRUCTURES, {filter: (s) =>
                            ((s.hits+200) < s.hitsMax) &&
                            (s.structureType !== STRUCTURE_RAMPART &&
                                s.structureType !== STRUCTURE_WALL)});
                        if (repairSite.length > 0) {
                            tower.repair(repairSite[0]);
                        }
                    }
                    if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 800) {
                        const rampartTask = this.dataLoader!.taskData![this.colony.room.name].rampartTasks[0];
                        if (rampartTask) {
                            tower.repair(rampartTask);
                        }
                    }
                }
            }
        }
    }
}
