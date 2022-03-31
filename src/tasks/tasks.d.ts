type TaskTemplate = {
    type: string;
    creep: Creep;
    targetID: Id<RoomObject> | string;
}

type targetType = Tombstone | ConstructionSite | Source | Structure | Resource;

type taskTarget<T extends RoomObject | RoomPosition> = T extends RoomObject ? RoomObject : RoomPosition;

type withdrawType = StructureStorage | StructureContainer | StructureTerminal | StructureLink | Tombstone;

interface ITask {
    type: string;
    creep: Creep;
    target?: targetType | string;
    targetPos?: RoomPosition;
    taskRange: number;
    remove(): void;
    isValidTask(): boolean;
    isValidTarget(): boolean;
    move(): number;
    step(): number | void;
    work(): number;
}
