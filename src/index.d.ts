interface IEmpire {
    colonies: { [colName:string]: IColony };
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
