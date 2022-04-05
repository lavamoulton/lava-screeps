import { Empire } from "Empire";
import { ErrorMapper } from "utils/ErrorMapper";
import * as Profiler from "./Profiler";
import { logging, LogEntry, LogManager } from './utils/logging/logging';

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    colonies: any;
    empire: any;
    mapper: { [name: string]: RoomMemoryData };
  }

  interface CreepMemory {
    role: string;
    room: string;
    task: string;
    colonyName: string;
    _trav: any;
    _travel: any;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }

  var empire: IEmpire;
  var Profiler: Profiler;
  //var logger: LogManager;
}

global.Profiler = Profiler.init();
/*global.logger = logging
  .configure({
    minLevels: {
      '': 'info',
    }
  })
  .registerConsoleLogger();*/

global.empire = new Empire();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  //const logger = global.logger.getLogger('main');
  //logger.info(`Current game tick is ${Game.time}`);

  let empire = global.empire;

  empire.init();

  for (let colName in empire.colonies) {
    empire.colonies[colName].init();
  }

  for (let colName in empire.colonies) {
    empire.colonies[colName].run();
  }

  empire.run();

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  for (const name in Memory.flags) {
    if (!(name in Game.flags)) {
      delete Memory.flags[name];
    }
  }

  if (Game.cpu.bucket > 9999) {
    Game.cpu.generatePixel();
  }
});
