interface IManager {
    colony: IColony;
    init(): void;
    run(): void;
}

interface IColonyManager extends IManager {
    roomPlanner?: IRoomPlanner;
    spawnerManager?: ISpawnerManager;
    rampartTarget: number;
}

interface ISpawnerManager extends IManager {

}

interface IDataLoader extends IManager {
    taskData?: { [roomName: string]: roomTaskData };
    getColonyRoomData(): roomTaskData;
    getRemoteRoomData(): { [name: string]: roomTaskData };
    getColonyTaskData(): colonyTaskData;
}

type roomTaskData = {
    enemies: Creep[],
    resources: Resource[],
    supplyTasks: (StructureSpawn | StructureExtension)[],
    towerSupplyTasks: StructureTower[],
    buildTasks: ConstructionSite[],
    repairTasks: Structure[],
    tombstones: Tombstone[],
    rampartTasks: (StructureRampart | StructureWall)[],
}

type colonyTaskData = {
    enemies: Creep[],
    reservations: StructureController[],
    claims: Room[],
    outpostOutputs: StructureContainer[],
    defenseRooms: Room[],
    offenseRooms: Room[],
}
