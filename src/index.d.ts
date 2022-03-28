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
    controller: StructureController;
    creeps: Creep[];
    creepsByRole: { [roleName: string]: Creep[] };
    maxEnergy: number;
    spawner: ISpawner | null;
    towers: StructureTower[] | null;
    mines: { [sourceID: Id<Source>]: IMine } | null;
    manager: IColonyManager | null;
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
