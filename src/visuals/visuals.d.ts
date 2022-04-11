interface IColonyVisualizer {
    colony: IColony;
    init(): void;
    run(): void;
}

type visualCell = {
    'x': number,
    'y': number,
    'width': number,
    'height': number,
    'text': string,
}

type visualTable = visualCell[][];
