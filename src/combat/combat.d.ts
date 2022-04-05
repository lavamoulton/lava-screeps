interface ICombat {
    attackers: Creep[];
    defenders: Creep[];
    init(): void;
    run(): void;
}
