interface IMapper {
    memory: any;
    recordRoomData(room: Room, creep: Creep): void;
    init(): void;
    run(): void;
}
