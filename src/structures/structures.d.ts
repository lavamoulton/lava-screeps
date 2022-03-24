interface IStructure {
    room: Room;
    pos: RoomPosition;
    id: Id<RoomObject>;
    colony: IColony;
    init(): void;
    run(): void;
}

interface ISpawner extends IStructure {
    memory: any;
    spawns: StructureSpawn[];
    availableSpawns: StructureSpawn[];
    extensions: StructureExtension[];
    energyNeeded: number;
    queueCreep(creepTemplate: creepTemplate, priority?: number): void;
}

interface IMine extends IStructure {
    source: Source;
    miner: Creep | null;
    output: StructureContainer | null;
    outputConstructionSite: ConstructionSite | null;
    remainingOutput: number;
}
