import { profile } from "../Profiler";

@profile
export abstract class Manager implements IManager {
    colony: IColony;

    constructor(colony: IColony) {
        this.colony = colony;
    }

    abstract init(): void;

    abstract run(): void;
}
