interface IMapper {
    memory: any;
    recordRoomData(room: Room, creep: Creep): void;
    init(): void;
    run(): void;
}

interface IObserver {
    memory: any;
    init(): void;
    run(): void;
}
