export class Stats {
    strbase: number;
    strtrue: number;
    vitbase: number;
    vittrue: number;
    dexbase: number;
    dextrue: number;
    intbase: number;
    inttrue: number;
    chabase: number;
    chatrue: number;
    lucbase: number;
    luctrue: number;


    constructor(strbase: number, strtrue: number, vitbase: number, vittrue: number, dexbase: number, dextrue: number, intbase: number,
                inttrue: number, chabase: number, chatrue: number, lucbase: number, luctrue: number) {
        this.strbase = strbase;
        this.strtrue = strtrue;
        this.vitbase = vitbase;
        this.vittrue = vittrue;
        this.dexbase = dexbase;
        this.dextrue = dextrue;
        this.intbase = intbase;
        this.inttrue = inttrue;
        this.chabase = chabase;
        this.chatrue = chatrue;
        this.lucbase = lucbase;
        this.luctrue = luctrue;
    }
}

export class FunStat {
    name: string;
    value: number;

    constructor(name: string, value: number) {
        this.name = name;
        this.value = value;
    }

    toString(): string {
        return ((this.value < 0) ? '━' : '✚') + this.name + ' (' + Math.abs(this.value) + ')';
    }

    static parseFunStat(text: string): FunStat {
        text = text.trim();
        let val = parseInt(text.substr(text.search('\\(') + 1, text.search('\\)')));
        if(text.search('━') !== -1)
            val *= -1;
        let nam = text.substr(1, text.search(' '));
        return new FunStat(nam, val);
    }
}

export class StatSheet {
    name: string;
    className: string;
    lvl: number;
    lvlcap: number;
    statcap: number;
    devotion: number;
    titles: string[];
    conditions: string[];
    stats: Stats;
    item: string;
    locked: boolean;
    funStats: FunStat[];
    lvlgained: number;
    lvllost: number;
    lvlsum: number;
    statsgained: number;
    statslost: number;
    statssum: number;

    constructor(name: string, className: string, lvl: number, lvlcap: number, statcap: number, devotion: number, titles: string[], conditions: string[],
                stats: Stats, item: string, locked: boolean, funStats: FunStat[], lvlgained: number, lvllost: number, lvlsum: number,
                statsgained: number, statslost: number, statssum: number) {
        this.name = name;
        this.className = className;
        this.lvl = lvl;
        this.lvlcap = lvlcap;
        this.statcap = statcap;
        this.devotion = devotion;
        this.titles = titles;
        this.conditions = conditions;
        this.stats = stats;
        this.item = item;
        this.locked = locked;
        this.funStats = funStats;
        this.lvlgained = lvlgained;
        this.lvllost = lvllost;
        this.lvlsum = lvlsum;
        this.statsgained = statsgained;
        this.statslost = statslost;
        this.statssum = statssum;
    }

    getBriefDescription(): HTMLElement {
        const parent = document.createElement('span');
        parent.appendChild(
            document.createTextNode('You are ')
        );

        const nameTag = document.createElement('strong');
        nameTag.appendChild(
            document.createTextNode(this.name)
        );
        parent.appendChild(nameTag);
        parent.appendChild(
            document.createTextNode(', the ')
        );

        const lvlSpan = document.createElement('span');
        lvlSpan.setAttribute('title', `Current Level Cap: ${this.lvlcap}`);
        lvlSpan.appendChild(
            document.createTextNode(`Level ${this.lvl}`)
        );
        parent.appendChild(lvlSpan);
        parent.appendChild(
            document.createTextNode(' ')
        );

        const classSpan = document.createElement('span');
        classSpan.style.setProperty('text-decoration', 'underline');
        classSpan.setAttribute('class', 'highlight');
        classSpan.appendChild(
            document.createTextNode(`${this.className}`)
        );
        parent.appendChild(classSpan);
        parent.appendChild(
            document.createTextNode('.')
        );
        return parent;
    }
}