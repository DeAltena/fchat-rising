export class job {
    name: string;
    desc: string;
    tags: string[];
    scaling: string;
    buffs: string[];


    constructor(name: string, desc: string, tags: string[], scaling: string, buffs: string[]) {
        this.name = name;
        this.desc = desc;
        this.tags = tags;
        this.scaling = scaling;
        this.buffs = buffs;
    }
}