export abstract class Structure implements IStructure {
    room: Room;
    pos: RoomPosition;
    id: Id<RoomObject>;
    colony: IColony;

    constructor(id: Id<RoomObject>, room: Room, colony: IColony) {
        this.room = room;
        this.id = id;
        this.pos = Game.getObjectById(this.id)!.pos;
        this.colony = colony;
    }

    abstract init(): void;

    abstract run(): void;
}
