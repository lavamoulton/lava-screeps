type posTemplate = {
    x: number;
    y: number;
    room: string;
}

interface IRoomPlanner {
    colony: IColony;
    init(): void;
    run(): void;
}
