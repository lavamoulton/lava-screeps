import { Structure } from './Structure';

export class Mine extends Structure implements IMine {
    memory: any;
    source: Source;
    output: StructureContainer | null;
    outputConstructionSite: ConstructionSite | null;
    remainingOutput: number;
    private _miner: Creep | null;

    constructor(id: Id<Source>, room: Room, colony: IColony) {
        super(id, room, colony);
        this.source = Game.getObjectById(id)!;
        this.output = null;
        this.outputConstructionSite = null;
        this.remainingOutput = 0;
        this._miner = null;
    }

    get miner(): Creep | null {
        return this._miner;
    }

    set miner(creep: Creep | null) {
        this._miner = creep;
    }

    init(): void {
        const containers: StructureContainer[] = this.room.find(FIND_STRUCTURES, { filter: (s) =>
            s.structureType === STRUCTURE_CONTAINER});
        const outputContainer = this.source.pos.findInRange(containers, 1)[0];
        if (outputContainer) {
            this.output = outputContainer;
            this.remainingOutput = this.output.store.getUsedCapacity(RESOURCE_ENERGY);
        } else {
            const constructionSites: ConstructionSite[] = this.room.find(FIND_CONSTRUCTION_SITES);
            const outputConstructionSite = this.source.pos.findInRange(constructionSites, 1)[0];
            if (outputConstructionSite) {
                this.outputConstructionSite = outputConstructionSite;
            }
        }
    }

    run(): void {
        if (this._miner) {
            const miner = this._miner;
            if (miner.store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
                    miner.pos.getRangeTo(this.source) < 2) {
                if (!this.output && !this.outputConstructionSite) {
                    this.room.createConstructionSite(miner.pos, STRUCTURE_CONTAINER);
                }
                if (this.outputConstructionSite) {
                    miner.build(this.outputConstructionSite);
                }
                if (this.output) {
                    if (this.output.hits < this.output.hitsMax) {
                        miner.repair(this.output);
                    }
                }
            }
            miner.harvest(this.source);
        }
    }
}
