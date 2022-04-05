interface IEmpire {
    colonies: { [colName:string]: IColony };
    mapper: IMapper;
    init(): void;
    run(): void;
}

interface IColony {
    memory: any;
    name: string;
    room: Room;
    defcon: number;
    outposts: Room[];
    controller: StructureController;
    storage?: StructureStorage;
    creeps: Creep[];
    creepsByRole: { [roleName: string]: Creep[] };
    maxEnergy: number;
    spawner: ISpawner;
    towers?: StructureTower[];
    mines?: { [sourceID: Id<Source>]: IMine };
    outpostMines?: { [sourceID: Id<Source>]: IMine };
    manager: IColonyManager;
    visualizer: IColonyVisualizer;
    taskData: roomTaskData;
    outpostTaskData: { [name: string]: roomTaskData };
    init(): void;
    run(): void;
}

interface RoomMemory {
    avoid: any;
}

type RoomMemoryData = {
    name: string;
    owner?: string;
    colony: string;
    outpost: boolean;
    range: number;
    threatLevel: number;
    controller?: Id<StructureController>;
    sources: number;
    mineral?: Id<Mineral>;
}
