interface IManager {
    colony: IColony;
    init(): void;
    run(): void;
}

interface IColonyManager extends IManager {
    roomPlanner?: IRoomPlanner;
    spawnerManager?: ISpawnerManager;
    dataLoader?: IDataLoader;
    rampartTarget: number;
}

interface ISpawnerManager extends IManager {

}

interface IDataLoader extends IManager {
    taskData?: { [roomName: string]: roomTaskData };
    getColonyRoomData(): roomTaskData;
}

type roomTaskData = {
    resources: Resource[],
    supplyTasks: (StructureSpawn | StructureExtension | StructureTower)[],
    buildTasks: ConstructionSite[],
    repairTasks: Structure[],
    tombstones: Tombstone[],
    rampartTasks: StructureRampart[],
}
