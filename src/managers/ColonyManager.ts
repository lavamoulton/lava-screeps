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
import { Traveler } from "utils/Traveler";
import { TaskMove } from "tasks/Move";

@profile
export class ColonyManager extends Manager implements IColonyManager {

    roomPlanner?: IRoomPlanner;
    spawnerManager?: ISpawnerManager;
    rampartTarget: number;
    private _idleCreeps: Creep[];
    private _workCreeps: Creep[];
    private _taskPermissions: { [name: string]: { [role: string]: boolean } };

    constructor(colony: IColony) {
        super(colony);
        this.rampartTarget = 0;
        this._idleCreeps = [];
        this._workCreeps = [];
        this._taskPermissions = creepTemplates.TASK_PERMISSIONS;
    }

    init(): void {
        this.spawnerManager = new SpawnerManager(this.colony);
        this.spawnerManager.init();
        this.rampartTarget = this._setRampartTarget();
        this._initCreeps();
        if (Game.time % 60 === 0) {
            this.roomPlanner = new RoomPlanner(this.colony);
            //this.roomPlanner.init();
        }
    }

    run(): void {
        this.spawnerManager?.run();
        this._runCreeps();
        this._runTowers();
        if (Game.time % 60 === 0) {
            //this.roomPlanner?.run();
        }
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

    private _initCreeps(): void {
        for (let i in this.colony.creeps) {
            let creep = this.colony.creeps[i];
            if (creep.spawning) {
                continue;
            }
            if (creep.memory.role === 'melee' || creep.memory.role === 'scout' || creep.memory.role === 'attacker' || creep.memory.role === 'defender') {
                continue;
            }
            if (creep.memory.task === 'none') {
                this._idleCreeps.push(creep);
            } else {
                this._workCreeps.push(creep);
            }
        }
    }

    private _runCreeps(): void {
        for (let i in this._workCreeps) {
            let creep = this._workCreeps[i];
            console.log(`${creep.name} (working): ${creep.memory.task}`);
            this._runWorkingCreep(creep);
        }

        for (let i in this._idleCreeps) {
            let creep = this._idleCreeps[i];
            console.log(`${creep.name} (idle): Setting task`);
            this._runIdleCreep(creep);
        }
    }

    private _runWorkingCreep(creep: Creep) {
        let creepTaskTemplate = taskUtils.taskStringToTemplate(creep.memory.task);
        let task = taskUtils.createTask(creepTaskTemplate);
        if (!task) {
            creep.memory.task = 'none';
            this._idleCreeps.push(creep);
            console.log(`- ERROR: taskUtils.createTask did not return a valid task`);
            return;
        }
        if (!(task.isValidTarget() && task.isValidTask()) && !(task.type ==='harvest' && creep.memory.role === 'miner')) {
            if (task.type === 'move') {
                console.log(`Removing move task from ${creep.name}`);
            }
            task.remove();
            this._idleCreeps.push(creep);
            console.log(`Task is no longer valid, removing`);
            return;
        }
        if (creep.memory.role === 'miner') {
            if (task.type === 'harvest') {
                this._checkMiner(creep, task);
            }
        }
        this._checkTaskData(task, creep);
        task.step();
    }

    private _checkMiner(creep: Creep, task: ITask) {
        const source = task.target as Source;
        if (!this.colony.mines) {
            return;
        }
        if (this.colony.mines[source.id]) {
            if (this.colony.mines[source.id].miner) {
                creep.memory.task = 'none';
                this._idleCreeps.push(creep);
                return;
            }
            this.colony.mines[source.id].miner = creep;
        }
        if (!this.colony.outpostMines) {
            return;
        }
        if (this.colony.outpostMines[source.id]) {
            if (this.colony.outpostMines[source.id].miner) {
                creep.memory.task = 'none';
                this._idleCreeps.push(creep);
                return;
            }
            this.colony.outpostMines[source.id].miner = creep;
        }
    }

    private _runIdleCreep(creep: Creep) {
        if (creep.memory.role === 'miner') {
            this._getMinerTask(creep);
            return;
        } else {
            const data = this.colony.taskData;
            const outpostData = this.colony.outpostTaskData;
            const outpostLength = Object.keys(outpostData).length;
            const permissions = this._taskPermissions[creep.memory.role];
            if (!permissions) {
                console.log(`Error loading permissiosn for idle creep ${creep.name}`);
                return;
            }
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                if (permissions.storage && this.colony.storage) {
                    if (this.colony.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 1000) {
                        const task = new TaskWithdraw(this.colony.storage, creep);
                        creep.memory.task = taskUtils.taskToString(task, this.colony.storage.id);
                        console.log(`Getting storage withdrawl task`);
                        return task;
                    }
                }
                if (permissions.remotepickup && outpostLength > 0) {
                    if (creep.room.name in outpostData) {
                        let roomData = outpostData[creep.room.name];
                        if (roomData.resources.length > 0) {
                            const droppedResource = roomData.resources[0];
                            if (droppedResource.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
                                const task = new TaskPickup(droppedResource, creep);
                                creep.memory.task = taskUtils.taskToString(task, droppedResource.id);
                                roomData.resources.splice(roomData.resources.indexOf(droppedResource), 1);
                                return task;
                            }
                        }
                        if (permissions.remoteMines && this.colony.outpostMines) {
                            const openOutpostMineOutputs = _.filter(this.colony.outpostMines, (mine) => {
                                return (mine.output && mine.room === creep.room && mine.remainingOutput > creep.store.getFreeCapacity(RESOURCE_ENERGY))
                            });
                            if (openOutpostMineOutputs.length > 0) {
                                const task = new TaskWithdraw(openOutpostMineOutputs[0].output!, creep);
                                creep.memory.task = taskUtils.taskToString(task, openOutpostMineOutputs[0].output!.id);
                                console.log(`Withdrawing from remote mine output task`);
                                return task;
                            }
                        }
                    }
                }
                if (permissions.pickup && data.resources.length > 0) {
                    const droppedResource = data.resources[0];
                    if (droppedResource.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
                        const task = new TaskPickup(droppedResource, creep);
                        creep.memory.task = taskUtils.taskToString(task, droppedResource.id);
                        console.log(`Picking up dropped resource, lowering dropped resource amount ${droppedResource.amount}`);
                        //droppedResource.amount -= creep.store.getFreeCapacity(RESOURCE_ENERGY);
                        console.log(`New dropped resource amount ${droppedResource.amount}`);
                        return task;
                    }
                }
                if (permissions.mines && this.colony.mines) {
                    const openMineOutputs = _.filter(this.colony.mines, (mine) => {
                        return (mine.output && mine.remainingOutput > creep.store.getFreeCapacity(RESOURCE_ENERGY))});
                    if (openMineOutputs.length > 0) {
                        const task = new TaskWithdraw(openMineOutputs[0].output!, creep);
                        creep.memory.task = taskUtils.taskToString(task, openMineOutputs[0].output!.id);
                        console.log(`Withdrawing from local mine output task`);
                        return task;
                    }
                }
                if (permissions.remotepickup && outpostLength > 0) {
                    if (creep.room.name in outpostData) {
                        let roomData = outpostData[creep.room.name];
                        if (roomData.resources.length > 0) {
                            const droppedResource = roomData.resources[0];
                            if (droppedResource.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
                                const task = new TaskPickup(droppedResource, creep);
                                creep.memory.task = taskUtils.taskToString(task, droppedResource.id);
                                roomData.resources.splice(roomData.resources.indexOf(droppedResource), 1);
                                console.log(`Picking up dropped resource, lowering dropped resource amount ${droppedResource.amount}`);
                                //droppedResource.amount -= creep.store.getFreeCapacity(RESOURCE_ENERGY);
                                console.log(`New dropped resource amount ${droppedResource.amount}`);
                                return task;
                            }
                        }
                    }
                    for (let i in outpostData) {
                        let roomData = outpostData[i];
                        if (roomData.resources.length > 0) {
                            const droppedResource = roomData.resources[0];
                            if (droppedResource.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
                                const task = new TaskPickup(droppedResource, creep);
                                creep.memory.task = taskUtils.taskToString(task, droppedResource.id);
                                console.log(`Picking up dropped resource, lowering dropped resource amount ${droppedResource.amount}`);
                                //droppedResource.amount -= creep.store.getFreeCapacity(RESOURCE_ENERGY);
                                console.log(`New dropped resource amount ${droppedResource.amount}`);
                                return task;
                            }
                        }
                    }
                }
                if (permissions.remoteMines && this.colony.outpostMines) {
                    const openOutpostMineOutputs = _.filter(this.colony.outpostMines, (mine) => {
                        return (mine.output && mine.remainingOutput > creep.store.getFreeCapacity(RESOURCE_ENERGY))
                    });
                    if (openOutpostMineOutputs.length > 0) {
                        const task = new TaskWithdraw(openOutpostMineOutputs[0].output!, creep);
                        creep.memory.task = taskUtils.taskToString(task, openOutpostMineOutputs[0].output!.id);
                        console.log(`Withdrawing from remote mine output task`);
                        return task;
                    }
                }
                if (permissions.harvest) {
                    const source = this.colony.room.find(FIND_SOURCES)[0];
                    const task = new TaskHarvest(source, creep);
                    creep.memory.task = taskUtils.taskToString(task, source.id);
                    console.log(`Harvesting resource task`);
                    return task;
                }
                Traveler.travelTo(creep, new RoomPosition(42, 40, this.colony.room.name));
                return;
            }

            if (permissions.supply && data.supplyTasks.length > 0) {
                const task = new TaskSupply(creep.pos.findClosestByRange(data.supplyTasks)!, creep);
                //const task = new TaskSupply(data.supplyTasks[0], creep);
                creep.memory.task = taskUtils.taskToString(task, data.supplyTasks[0].id);
                this._checkTaskData(task, creep);
                console.log(`Getting supply task for ${task.target}`);
                return task;
            }
            if (permissions.supplyTower && data.towerSupplyTasks.length > 0) {
                const task = new TaskSupply(data.towerSupplyTasks[0], creep);
                creep.memory.task = taskUtils.taskToString(task, data.towerSupplyTasks[0].id);
                this._checkTaskData(task, creep);
                console.log(`Getting supply tower task for ${task.target}`);
                return task;
            }
            if (permissions.repair && permissions.remoteRepair) {
                if (creep.room.name in outpostData) {
                    let roomData = outpostData[creep.room.name];
                    if (roomData.repairTasks.length > 0) {
                        const repairTask = roomData.repairTasks[0];
                        const task = new TaskRepair(repairTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, repairTask.id);
                        roomData.repairTasks.splice(roomData.repairTasks.indexOf(repairTask, 1));
                        return task;
                    }
                    if (roomData.buildTasks.length > 0) {
                        const buildTask = roomData.buildTasks[0];
                        const task = new TaskBuild(buildTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, buildTask.id);
                        roomData.buildTasks.splice(roomData.buildTasks.indexOf(buildTask, 1));
                        return task;
                    }
                }
            }
            if (permissions.repair && data.repairTasks.length > 0) {
                const task = new TaskRepair(data.repairTasks[0], creep);
                creep.memory.task = taskUtils.taskToString(task, data.repairTasks[0].id);
                this._checkTaskData(task, creep);
                console.log(`Getting repair task for ${task.target}`);
                return task;
            }
            if (permissions.build && data.buildTasks.length > 0) {
                const task = new TaskBuild(data.buildTasks[0], creep);
                creep.memory.task = taskUtils.taskToString(task, data.buildTasks[0].id);
                this._checkTaskData(task, creep);
                console.log(`Getting build task for ${task.target}`);
                return task;
            }
            if (permissions.remoterepair && outpostLength > 0) {
                if (creep.room.name in outpostData) {
                    let roomData = outpostData[creep.room.name];
                    if (roomData.repairTasks.length > 0) {
                        const repairTask = roomData.repairTasks[0];
                        const task = new TaskRepair(repairTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, repairTask.id);
                        return task;
                    }
                }
                for (let i in outpostData) {
                    let roomData = outpostData[i];
                    if (roomData.repairTasks.length > 0) {
                        const repairTask = roomData.repairTasks[0];
                        const task = new TaskRepair(repairTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, repairTask.id);
                        return task;
                    }
                }
            }
            if (permissions.remotebuild && outpostLength > 0) {
                if (creep.room.name in outpostData) {
                    let roomData = outpostData[creep.room.name];
                    if (roomData.buildTasks.length > 0) {
                        const buildTask = roomData.buildTasks[0];
                        const task = new TaskBuild(buildTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, buildTask.id);
                        return task;
                    }
                }
                for (let i in outpostData) {
                    let roomData = outpostData[i];
                    if (roomData.buildTasks.length > 0) {
                        const buildTask = roomData.buildTasks[0];
                        const task = new TaskBuild(buildTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, buildTask.id);
                        return task;
                    }
                }
            }
            if (permissions.supplyStorage && this.colony.storage) {
                if (this.colony.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 750000) {
                    const task = new TaskSupply(this.colony.storage, creep);
                    creep.memory.task = taskUtils.taskToString(task, this.colony.storage.id);
                    console.log(`Supplying storage ${task.target}`);
                    return task;
                }
            }
            if (permissions.repair && data.rampartTasks.length > 0) {
                const task = new TaskRepair(data.rampartTasks[0], creep);
                creep.memory.task = taskUtils.taskToString(task, data.rampartTasks[0].id);
                this._checkTaskData(task, creep);
                console.log(`Getting rampart repair task for ${task.target}`);
                return task;
            }
            if (permissions.remoterepair && outpostLength > 0) {
                for (let i in outpostData) {
                    let roomData = outpostData[i];
                    if (roomData.rampartTasks.length > 0) {
                        const rampartTask = roomData.rampartTasks[0];
                        const task = new TaskBuild(rampartTask, creep);
                        creep.memory.task = taskUtils.taskToString(task, rampartTask.id);
                        return task;
                    }
                }
            }
            if (permissions.upgrade) {
                const task = new TaskUpgrade(this.colony.controller, creep);
                creep.memory.task = taskUtils.taskToString(task, this.colony.controller.id);
                console.log(`Getting upgrade task for ${task.target}`);
                return task;
            }

            console.log(`Could not find valid task, defaulting to idle`);
            if (this.colony.storage) {
                if (this.colony.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 600000) {
                    const supplyStorage = new TaskSupply(this.colony.storage, creep);
                    creep.memory.task = taskUtils.taskToString(supplyStorage, this.colony.storage.id);
                    this.colony.memory.storage = true;
                    return supplyStorage;
                }
            }
            Traveler.travelTo(creep, new RoomPosition(42, 40, this.colony.room.name));
            return;
        }
    }

    private _getMinerTask(creep: Creep): ITask | null {
        if (!this.colony.mines) {
            return null;
        }
        let openMine = _.filter(this.colony.mines, (mine) => {
            return !mine.miner;
        })[0];
        /*
        for (let i in this.colony.memory.outposts) {
            const outpostName = this.colony.memory.outposts[i];
            const outpostRoom = Game.rooms[outpostName];
            if (!outpostRoom) {
                Traveler.travelTo(creep, new RoomPosition(25, 25, outpostName));
            }
        }*/
        if (!openMine) {
            if (this.colony.outpostMines) {
                openMine = _.filter(this.colony.outpostMines, (mine) => {
                    return !mine.miner;
                })[0];
            }
        }
        if (!openMine) {
            for (let roomName in this.colony.memory.outposts) {
                const outpostRoom = Game.rooms[roomName];
                if (!outpostRoom) {
                    const task = new TaskMove(roomName, creep);
                    creep.memory.task = taskUtils.taskToString(task, roomName);
                    return task;
                }
            }
        }
        if (!openMine) {
            return null;
        }
        const task = new TaskHarvest(openMine.source, creep);
        creep.memory.task = taskUtils.taskToString(task, openMine.source.id);
        return task;
    }

    private _checkTaskData(task: ITask, creep: Creep): void {
        const colRoomData = this.colony.taskData;
        const creepEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        switch(task.type) {
            case 'supply':
                const supplyTarget = task.target as (StructureSpawn | StructureExtension | StructureTower);
                if (supplyTarget.structureType === STRUCTURE_TOWER) {
                    colRoomData.towerSupplyTasks.splice(
                        colRoomData.towerSupplyTasks.indexOf(supplyTarget), 1
                    );
                } else {
                    if (creepEnergy > supplyTarget.store.getFreeCapacity(RESOURCE_ENERGY)) {
                        colRoomData.supplyTasks.splice(
                            colRoomData.supplyTasks.indexOf(supplyTarget), 1);
                    }
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
                break;
            case 'pickup':
                const pickupTarget = task.target as Resource;
                colRoomData.resources.splice(colRoomData.resources.indexOf(pickupTarget), 1);
                break;
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
                        const rampartTask = this.colony.taskData.rampartTasks[0];
                        if (rampartTask) {
                            if (this.colony.creeps.length > 8) {
                                tower.repair(rampartTask);
                            }
                        }
                    }
                }
            }
        }
    }
}
