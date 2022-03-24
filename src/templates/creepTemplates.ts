const CREEP_PRIORITIES: { [name: string]: number } = {
    'miner': 2,
    'worker': 5,
    'builder': 7,
};

const ROLE_TEMPLATES: { [name: string]: BodyPartConstant[] } = {
    'worker': [WORK, WORK, CARRY, MOVE],
    'miner': [WORK, WORK, CARRY, MOVE],
    'builder': [WORK, WORK, CARRY, MOVE],
};

export const creepTemplates = {
    CREEP_PRIORITIES,
    ROLE_TEMPLATES
};
