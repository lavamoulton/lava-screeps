interface creepTemplate {
    body: BodyPartConstant[];
    name: string;
    memory: any;
}

type roleTemplate = {
    'prefix': BodyPartConstant[],
    'body': BodyPartConstant[],
    'suffix': BodyPartConstant[],
}
