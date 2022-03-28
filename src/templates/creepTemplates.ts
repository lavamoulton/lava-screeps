const CREEP_PRIORITIES: { [name: string]: number } = {
    'miner': 2,
    'worker': 5,
    'upgrader': 6,
    'builder': 7,
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
        'prefix': [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE],
        'body': [],
        'suffix': [MOVE, MOVE, MOVE, MOVE],
    },
    'builder': {
        'prefix': [],
        'body': [WORK, CARRY, MOVE, MOVE],
        'suffix': [],
    },
    'upgrader': {
        'prefix': [],
        'body': [WORK, CARRY, MOVE, MOVE],
        'suffix': [],
    },
};

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
};
