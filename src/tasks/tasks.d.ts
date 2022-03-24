type TaskTemplate = {
    type: string;
    creep: Creep;
    targetID: Id<RoomObject>;
}

type targetType = ConstructionSite | Source | Structure;

interface ITask {
    type: string;
    creep: Creep;
    target: RoomObject | null;
    targetPos: RoomPosition | null;
    taskRange: number;
    remove(): void;
    isValidTask(): boolean;
    isValidTarget(): boolean;
    move(): number;
    step(): number | void;
    work(): number;
}
