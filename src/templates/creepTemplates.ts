import { workers } from "cluster";

const CREEP_PRIORITIES: { [name: string]: number } = {
    'miner': 2,
    'hauler': 4,
    'worker': 5,
    'upgrader': 6,
    'builder': 7,
    'melee': 8,
    'scout': 9,
};

const ROLE_TEMPLATES: { [name: string]: BodyPartConstant[] } = {
    'worker': [WORK, WORK, CARRY, MOVE],
    'miner': [WORK, WORK, CARRY, MOVE],
    'builder': [WORK, WORK, CARRY, MOVE],
    'upgrader': [WORK, WORK, CARRY, MOVE],
};

const ROLE_BODY_TEMPLATES: { [name: string]: roleTemplate} = {
    'worker': {
        'prefix': [],
        'body': [WORK, CARRY, MOVE, MOVE],
        'suffix': [],
    },
    'miner': {
        'prefix': [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE],
        'body': [],
        'suffix': [MOVE, MOVE, MOVE, MOVE],
    },
    'builder': {
        'prefix': [],
        'body': [WORK, CARRY, MOVE, MOVE],
        'suffix': [],
    },
    'upgrader': {
        'prefix': [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
        'body': [WORK, CARRY, MOVE, MOVE],
        'suffix': [],
    },
    'scout': {
        'prefix': [CLAIM, MOVE, MOVE],
        'body': [],
        'suffix': [],
    },
    'hauler': {
        'prefix': [WORK, CARRY, MOVE, MOVE],
        'body': [CARRY, MOVE],
        'suffix': [],
    },
    'melee': {
        'prefix': [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
        'body': [],
        'suffix': [],
    }
};

const TASK_PERMISSIONS: { [role: string]: { [task: string]: boolean } } = {
    'worker': {
        'pickup': true,
        'remotepickup': false,
        'remotebuild': false,
        'remoterepair': false,
        'storage': true,
        'mines': true,
        'remoteMines': false,
        'harvest': true,
        'upgrade': false,
        'supply': true,
        'repair': true,
        'build': true,
        'supplyTower': true,
        'supplyStorage': false,
    },
    'miner': {
        'pickup': false,
        'remotepickup': false,
        'remotebuild': false,
        'remoterepair': false,
        'storage': false,
        'mines': false,
        'remoteMines': false,
        'harvest': true,
        'upgrade': false,
        'supply': false,
        'repair': false,
        'build': false,
        'supplyTower': false,
        'supplyStorage': false,
    },
    'builder': {
        'pickup': true,
        'remotepickup': true,
        'remotebuild': true,
        'remoterepair': true,
        'storage': false,
        'mines': true,
        'remoteMines': false,
        'harvest': false,
        'upgrade': false,
        'supply': false,
        'repair': true,
        'build': true,
        'supplyTower': false,
        'supplyStorage': false,
    },
    'upgrader': {
        'pickup': false,
        'remotepickup': false,
        'remotebuild': false,
        'remoterepair': false,
        'storage': true,
        'mines': true,
        'remoteMines': false,
        'harvest': false,
        'upgrade': true,
        'supply': false,
        'repair': false,
        'build': false,
        'supplyTower': false,
        'supplyStorage': false,
    },
    'hauler': {
        'pickup': true,
        'remotepickup': true,
        'remotebuild': false,
        'remoterepair': false,
        'storage': false,
        'mines': true,
        'remoteMines': true,
        'harvest': false,
        'upgrade': false,
        'supply': false,
        'repair': false,
        'build': false,
        'supplyTower': true,
        'supplyStorage': true,
    }
}

/*
const TASK_PERMISSIONS: { [name: string]: { [role: string]: number } } = {
    'pickup': {
        'worker': 1,
        'miner': 0,
        'builder': 1,
        'upgrader': 0,
        'scout': 0,
        'hauler': 1,
        'melee': 0,
    },
    'storage': {
        'worker': 1,
        'miner': 0,
        'builder': 0,
        'upgrader': 1,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
    'mines': {
        'worker': 1,
        'miner': 0,
        'builder': 1,
        'upgrader': 1,
        'scout': 0,
        'hauler': 1,
        'melee': 0,
    },
    'remoteMines': {
        'worker': 0,
        'miner': 0,
        'builder': 1,
        'upgrader': 0,
        'scout': 0,
        'hauler': 1,
        'melee': 0,
    },
    'harvest': {
        'worker': 1,
        'miner': 1,
        'builder': 0,
        'upgrader': 0,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
    'upgrade': {
        'worker': 0,
        'miner': 0,
        'builder': 0,
        'upgrader': 1,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
    'supply': {
        'worker': 1,
        'miner': 0,
        'builder': 0,
        'upgrader': 0,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
    'repair': {
        'worker': 1,
        'miner': 0,
        'builder': 1,
        'upgrader': 0,
        'scout': 0,
        'hauler': 1,
        'melee': 0,
    },
    'build': {
        'worker': 1,
        'miner': 0,
        'builder': 1,
        'upgrader': 0,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
    'supplyTower': {
        'worker': 1,
        'miner': 0,
        'builder': 0,
        'upgrader': 0,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
    'supplyStorage': {
        'worker': 0,
        'miner': 0,
        'builder': 0,
        'upgrader': 0,
        'scout': 0,
        'hauler': 0,
        'melee': 0,
    },
}*/

const TASK_PRIORITIES: { [name: string]: { [priority: number]: string } } = {
    'worker': {
        0: 'supply',
        1: 'repair',
        2: 'build',
        3: 'upgrade',
    },
    'miner': {
        0: 'repair',
        1: 'build',
    },
    'builder': {
        0: 'repair',
        1: 'build',
        2: 'upgrade',
    },
    'upgrader': {
        0: 'upgrade',
    },
};

export const creepTemplates = {
    CREEP_PRIORITIES,
    ROLE_TEMPLATES,
    ROLE_BODY_TEMPLATES,
    TASK_PRIORITIES,
    TASK_PERMISSIONS,
};
