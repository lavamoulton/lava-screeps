interface ICombat {
    attackers: Creep[];
    init(): void;
    run(): void;
}
