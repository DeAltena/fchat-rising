import log from "electron-log";
import {parseInt} from "lodash";

export class Buff {
    name: string;
    cost: number;
    desc: string;
    from: string[];
    fromJobs: Job[] = [];
    colour = '';

    constructor(name: string, cost: number, desc: string, from: string[]) {
        this.name = name;
        this.cost = cost;
        this.desc = desc;
        this.from = from;
        this.scanColour(name);
    }

    readonly colourRegex = /\[color=(?<col>[^\]]*)\]/i;
    private scanColour(name: string): void {
        const colour = name.match(this.colourRegex)?.groups?.col;
        this.colour = !colour ? '' : colour;
    }

    taglessName(): string {
        return BuffRepository.stripTags(this.name);
    }

    underlinedName(): string {
        return `${this.name.substring(0, this.name.indexOf(']') + 1)}[u]${this.name.substring(this.name.indexOf(']') + 1,
            this.name.indexOf('[', this.name.indexOf(']') + 1))}[/u]${this.name.substring(this.name.indexOf('[', this.name.indexOf(']') + 1))}`;
    }

    getClass(): string {
        return `${this.colour}Text`;
    }

    getStat(): string {
        switch (this.colour){
            case 'orange':
                return 'STR';
            case 'yellow':
                return 'VIT';
            case 'red':
                return 'DEX';
            case 'cyan':
                return 'INT';
            case 'pink':
                return 'CHA';
            case 'green':
                return 'LUC';
            default:
                return 'LVL';
        }
    }
}

export class BuffRepository {
    buffs: { [name: string]: Buff } = {};
    private static instance: BuffRepository;

    private constructor() {
        this.parseBuffs(BuffRepository.getBuffsRaw());
    }

    static getInstance(): BuffRepository {
        if (!BuffRepository.instance)
            BuffRepository.instance = new BuffRepository();
        return BuffRepository.instance;
    }

    getBuff(name: string): Buff | null {
        try {
            return this.buffs[BuffRepository.stripTags(name.trim()).toLowerCase()];
        } catch (err) {
            log.error(name, err);
            return null;
        }
    }

    readonly buffRegex = /^\[b\](?<name>.*?)\[\/b\].*?cost: (?<cost>\d+)\) - (?<desc>.*)[\r\n]+.*?from: (?<from>.*)\[\/sup\]/gmi;

    parseBuffs(buffs: string): void {
        try {
            let match;
            while ((match = this.buffRegex.exec(buffs)) !== null) {
                let groups = match.groups;
                if (!groups) {
                    log.error('Error parsing buffs from ', buffs, this.buffs);
                    return;
                }
                let buffName = groups.name;
                let key = BuffRepository.stripTags(buffName).toLowerCase();
                let buffCost = parseInt(groups.cost);
                if (isNaN(buffCost))
                    buffCost = 0;
                let buffDesc = groups.desc;
                let buffFrom = groups.from.split(',');
                buffFrom.map((val) => val.trim());
                this.buffs[key] = new Buff(
                    buffName, buffCost, buffDesc, buffFrom
                );
            }
        } catch (err) {
            log.error(buffs, err);
            throw err;
        }
    }

    linkFromJobs(jobRepo: JobRepository): void {
        for(const [_, buff] of Object.entries(this.buffs)) {
            buff.from.forEach((buffName) => {
                const job = jobRepo.getJob(buffName);
                if(job) {
                    buff.fromJobs.push(job);
                }
            });
        }
    }

    static readonly tagRegex = /^(?:\s*\[.*?\])*(?<name>[^\][]*)(?:\[.*?\]\s*)*$/is;
    static stripTags(str: string): string {
        const match = str.match(BuffRepository.tagRegex);
        if (match && match.groups) {
            return match.groups.name;
        }
        return str;
    }

    static getBuffsRaw(): string {
        return `[b][color=cyan]Addled[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of INT.
\t[sup]From: alien, archmage, archwizard, artific\tial intelligence, clown, cultist, elder brain, false prophet, galactic tyrant, lich, magical girl, mindflayer, minotaur, moth, mystic knight, necromancer, sharpshooter, spellsword, warlock, wizard[/sup]
[b][color=red]Agile[/color][/b] (Cost: 3) - Raises the effectiveness of DEX.
\t[sup]From: alchemist, bard, cheerleader, desperado, fencer, fighter, gunslinger, kensai, mad scientist, master chemist, monk, sage, samurai, scientist, sidekick, spoony bard, swashbuckler, weapon master, zen master[/sup]
[b][color=cyan]Amnesia[/color][/b] (Cost: 5) - Massively lowers the effectiveness of INT.
\t[sup]From: elder brain, mindflayer, psychic[/sup]
[b][color=pink]Annoying[/color][/b] (Cost: 2) - Lowers the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=white]Armor[/color][/b] (Cost: 3) - Slightly rases DEF. Lost on defeat.
\t[sup]From: artificer, blacksmith, engineer, master smith, merchant[/sup]
[b][color=white]Ascended-Mind[/color][/b] (Cost: 6) - Raises the effectiveness of INT/CHA/LUC.
\t[sup]From: [/sup]
[b][color=cyan]Berserk[/color][/b] (Cost: 5) - Massively raises the effectiveness of STR while greatly lowering DEF and INT.
\t[sup]From: alchemist, beast tamer, clown, eros, master chemist, psychic[/sup]
[b][color=cyan]Bimbofied[/color][/b] (Cost: 5) - Greatly lowers the effectiveness of INT, but raises the effectiveness of CHA.
\t[sup]From: bimboslime, playboy[/sup]
[b][color=cyan]Bimboslimed[/color][/b] (Cost: 3) - Lowers the effectiveness of DEX and INT.
\t[sup]From: bimboslime, slimebimbo[/sup]
[b][color=white]Blessed-Armor[/color][/b] (Cost: 7) - Raises DEF. Lost on defeat. More effective against the Unholy, but less effective against Holy!
\t[sup]From: foreign god, warpriest[/sup]
[b][color=white]Blessed-Weapon[/color][/b] (Cost: 7) - Raises ATK. Lost on defeat. More effective against the Unholy, but less effective against Holy!
\t[sup]From: champion, foreign god, miko, warpriest[/sup]
[b][color=green]Blessed[/color][/b] (Cost: 3) - Grants temporary Holy tag.
\t[sup]From: acolyte, angel, archangel, bishop, blessed tail, champion, cleric, cupid, devout, eros, executioner, foreign god, healer, healslut, magical girl, miko, nun, paladin, priest, sage, warpriest[/sup]
[b][color=yellow]Bloated[/color][/b] (Cost: 4) - Greatly lowers the effectiveness of DEX, but raises the effectiveness of VIT.
\t[sup]From: bloodbank, chef, master chef, plague doctor[/sup]
[b][color=white]Boon[/color][/b] (Cost: 4) - A random Low or Mid-tier Buff is applied.
\t[sup]From: djinn, dungeon core, fae, foreign god, royal, spoony bard[/sup]
[b][color=pink]Boring[/color][/b] (Cost: 2) - Lowers the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=pink]Bossy[/color][/b] (Cost: 4) - Greatly raises the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=orange]Bound[/color][/b] (Cost: 5) - Greatly lowers the effectiveness of DEX and STR.
\t[sup]From: arachne, beast tamer, bimboslime, djinn, drain slime, gorgon, jellyfish, kraken, lamia, mimic, pirate, scylla, sidekick, slime, slimebimbo, stalker, superhero, vigilante, fisherman[/sup]
[b][color=cyan]Brainwashed[/color][/b] (Cost: 4) - High chance to change resist to accept.
\t[sup]From: alien, archmage, artificial intelligence, elder brain, elder vampire, false prophet, galactic tyrant, gazer, master of pacts, matango, mindflayer, moth, parasite, psychic, puppeteer, queen bee, siren, villain, warlock[/sup]
[b][color=pink]Bukkaked[/color][/b] (Cost: 2) - Lowers the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=pink]Captivating[/color][/b] (Cost: 4) - Greatly raises the effectiveness of CHA.
\t[sup]From: archdemon, archmage, demon, djinn, master of pacts[/sup]
[b][color=pink]Charmed[/color][/b] (Cost: 3) - Chance to change resist to accept
\t[sup]From: air elemental, alchemist, alraune, assassin, bard, beast tamer, blessed tail, bloodkin, canine, casino bunny, cheerleader, cheshire, citizen but better with sunglasses, combat maid, cupid, dancer, djinn, doll, draincubus, elder vampire, eros, fae, feline, fox, harpy, healslut, idol, imp, incubus, lamia, little devil, magical girl, maid, master chemist, merfolk, noble, nymph, phantom thief, playboy, prostitute, queen bee, reverse bunny, royal, siren, spoony bard, succubus, swashbuckler, vampire, wind sprite, witch, superstar, fisherman, athlete[/sup]
[b][color=white]Chastity[/color][/b] (Cost: 1) - You may not reach satisfaction
\t[sup]From: [/sup]
[b][color=green]Chosen[/color][/b] (Cost: 7) - Massively raises the effectiveness of LUC.
\t[sup]From: archangel, foreign god[/sup]
[b][color=cyan]Clarity[/color][/b] (Cost: 3) - Raises the effectiveness of INT.
\t[sup]From: alchemist, artificial intelligence, bard, cultist, dungeon core, false prophet, mad scientist, master chemist, monk, mystic knight, professor, psychic, scientist, sidekick, sphinx, spoony bard, teacher[/sup]
[b][color=cyan]Clever[/color][/b] (Cost: 3) - Raises the effectiveness of INT.
\t[sup]From: [/sup]
[b][color=red]Clumsy[/color][/b] (Cost: 2) - Lowers the effectiveness of DEX.
\t[sup]From: clown[/sup]
[b][color=pink]Comely[/color][/b] (Cost: 3) - Raises the effectiveness of CHA.
\t[sup]From: alchemist, bard, mad scientist, master chemist, scientist, spoony bard[/sup]
[b][color=cyan]Concussion[/color][/b] (Cost: 2) - Lowers the effectiveness of INT.
\t[sup]From: [/sup]
[b][color=green]Condemned[/color][/b] (Cost: 4) - Greatly lowers the effectiveness of LUC.
\t[sup]From: angel, archangel, bishop, champion, demon hunter, executioner, inquisitor, royal[/sup]
[b][color=cyan]Confused[/color][/b] (Cost: 5) - May turn a siphon into a drain or vice versa
\t[sup]From: alchemist, alraune, archmage, archwizard, artificial intelligence, blessed tail, cheshire, clown, cultist, dancer, earth elemental, fae, false prophet, feline, fox, gazer, lich, master chemist, matango, moth, necromancer, outer horror, sage, sand sprite, siren, sphinx, spoony bard, witch, wizard[/sup]
[b][color=white]Constructed[/color][/b] (Cost: 10) - You are greatly resistant to Critical Hits.
\t[sup]From: [/sup]
[b][color=pink]Cool[/color][/b] (Cost: 3) - Raises the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=pink]Creepy[/color][/b] (Cost: 2) - Lowers the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=yellow]Crushed[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of VIT.
\t[sup]From: android, archdemon, automaton, berserker, blood knight, centaur, cervine, chimera, crab, cursed sword, dragon, earth elemental, elemental, galactic tyrant, gargoyle, golem, gorgon, kraken, lamia, manticore, mecha, mimic, minotaur, oni, outer horror, scylla, shark, sphinx, sprite, superhero, vigilante, warrior, warship, weapon master, zen master, athlete, homunculus[/sup]
[b][color=white]Cursed-Armor[/color][/b] (Cost: 7) - Massively raises DEF, but at a terrible cost.
\t[sup]From: archdemon, blood knight, cursed armor, djinn, master of pacts[/sup]
[b][color=white]Cursed-Weapon[/color][/b] (Cost: 7) - Massively raises ATK, but at a terrible cost.
\t[sup]From: archdemon, blood knight, cursed sword, djinn, master of pacts[/sup]
[b][color=green]Cursed[/color][/b] (Cost: 3) - No chance of divine intervention!
\t[sup]From: archdemon, archmage, blessed tail, blood knight, cultist, cursed armor, cursed sword, demon, djinn, draincubus, dullahan, false prophet, foreign god, ghost, imp, incubus, lich, little devil, lycanthrope, master of pacts, miko, necromancer, shade, succubus, warlock, witch[/sup]
[b][color=pink]Cute[/color][/b] (Cost: 3) - Raises the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=green]Damned[/color][/b] (Cost: 3) - Grants temporary Unholy tag.
\t[sup]From: archdemon, demon, draincubus, incubus, little devil, master of pacts, succubus[/sup]
[b][color=pink]Daring[/color][/b] (Cost: 5) - Raises the effectiveness of DEX and CHA.
\t[sup]From: [/sup]
[b][color=white]Defender of Earth[/color][/b] (Cost: 25) - Constructed as humanity's final Hope, Reinforced to withstand any assault, Honed to an atomic edge, and Big Enough to stand up to anything!
\t[sup]From: [/sup]
[b][color=green]Devoted[/color][/b] (Cost: 5) - Drain cost is doubled but no additional cost to Siphon
\t[sup]From: angel, archangel, bishop, champion, devout, dungeon core, foreign god, miko, nun, paladin, priest[/sup]
[b][color=white]Diminished-Divinity[/color][/b] (Cost: 10) - Greatly raises the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=pink]Dirty[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of CHA.
\t[sup]From: earth elemental, giant rat, goblin, hobgoblin, kobold, kraken, pig, rodent, sand sprite, scylla, homunculus[/sup]
[b][color=orange]Disarmed[/color][/b] (Cost: 4) - Unable to drain with STR
\t[sup]From: abyss knight, assassin, blood knight, champion, cursed sword, desperado, fencer, fighter, gunslinger, hero, kensai, knight, magical girl, mystic knight, paladin, phantom thief, pirate, royal knight, samurai, sharpshooter, spellsword, superhero, swashbuckler, thief, vigilante, warrior, weapon master, zen master, homunculus[/sup]
[b][color=white]Divinity[/color][/b] (Cost: 25) - Massively raises the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=cyan]Dizzy[/color][/b] (Cost: 3) - Lowers the effectiveness of DEX and INT.
\t[sup]From: air elemental, cheshire, dancer, elder brain, gazer, psychic, wind sprite[/sup]
[b][color=green]Doomed[/color][/b] (Cost: 5) - Massively lowers the effectiveness of LUC.
\t[sup]From: archdemon, demon, djinn, dullahan, executioner, fire elemental, plague doctor, villain[/sup]
[b][color=yellow]Drunk[/color][/b] (Cost: 3) - Raises the effectiveness of STR and LUC, lowers the effectiveness of INT and DEX.
\t[sup]From: bartender, casino bunny, oni, pirate, reverse bunny, satyr[/sup]
[b][color=cyan]Dumb[/color][/b] (Cost: 2) - Lowers the effectiveness of INT.
\t[sup]From: artificial intelligence, elder brain, mindflayer[/sup]
[b][color=white]Dutiful[/color][/b] (Cost: 15) - Gain devotion when you !bestow.
\t[sup]From: [/sup]
[b][color=white]Early Bird[/color][/b] (Cost: 15) - You got here fast huh?
\t[sup]From: [/sup]
[b][color=white]Egg-Filled[/color][/b] (Cost: 3) - Lowers the effectiveness of DEX and STR.
\t[sup]From: alien, alraune, arachne, bee, drain slime, elder brain, galactic tyrant, gorgon, horror, kraken, lamia, merfolk, mimic, mindflayer, moth, outer horror, parasite, queen bee, scylla, shark, slime, slimebimbo[/sup]
[b][color=white]Empire[/color][/b] (Cost: 25) - Greatly increases gold gains from grinding and Charisma.
\t[sup]From: [/sup]
[b][color=white]Enervated[/color][/b] (Cost: 6) - Greatly lowers the effectiveness of ALL.
\t[sup]From: archdemon, archmage, blood knight, bloodkin, drain slime, elder vampire, gazer, lich, master of pacts, necromancer, plague doctor, vampire[/sup]
[b][color=cyan]Enlightened[/color][/b] (Cost: 7) - Massively raises the effectiveness of INT.
\t[sup]From: zen master[/sup]
[b][color=white]Enslaved[/color][/b] (Cost: 5) - Lose the ability to drain, inflict, and attack.
\t[sup]From: [/sup]
[b][color=orange]Entangled[/color][/b] (Cost: 3) - Lowers the effectiveness of DEX and STR.
\t[sup]From: alraune, arachne, druid, forest elemental, horror, kraken, leaf sprite, outer horror, ranger, scylla, sharpshooter, fisherman[/sup]
[b][color=white]Ever-Changing[/color][/b] (Cost: 5) - Greatly raises and lowers the effectiveness of stats at random.
\t[sup]From: false prophet[/sup]
[b][color=white]Evolved-Physique[/color][/b] (Cost: 6) - Raises the effectiveness of STR/DEX/VIT.
\t[sup]From: mad scientist[/sup]
[b][color=white]Exhausted[/color][/b] (Cost: 99) - Lowers the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=white]Fatigued[/color][/b] (Cost: 99) - Lowers the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=green]Favored[/color][/b] (Cost: 4) - Greatly raises the effectiveness of LUC.
\t[sup]From: angel, archangel, devout, foreign god, miko, royal, warpriest, athlete[/sup]
[b][color=white]Fear[/color][/b] (Cost: 4) - You may not explore
\t[sup]From: ancient dragon, arachne, archdemon, ash sprite, bloodkin, bully, clown, doll, dullahan, elder vampire, fire elemental, gargoyle, gazer, ghost, giant rat, hellhound, horror, outer horror, plague doctor, shade, shark, skeleton, vampire, villain, zombie[/sup]
[b][color=yellow]Fecund[/color][/b] (Cost: 1) - Your body is primed to be bred! When inflicting pregnant to target with this status double the attack roll!
\t[sup]From: alchemist, alien, ancient dragon, archdemon, canine, centaur, chimera, cow, demon, djinn, dragon, draincubus, eros, false prophet, galactic tyrant, gazer, goblin, gorgon, hellhound, hobgoblin, imp, incubus, kraken, lamia, little devil, lycanthrope, mad scientist, manticore, master chemist, matango, minotaur, oni, outer horror, parasite, satyr, scientist, scylla, shark, succubus, witch[/sup]
[b][color=orange]Feeble[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of STR.
\t[sup]From: archmage, archwizard, blackguard, blood knight, chimera, demon hunter, lich, magical girl, mystic knight, necromancer, spellsword, warlock, wizard[/sup]
[b][color=white]First-Aid[/color][/b] (Cost: 4) - (UNIMPLEMENTED) Remove the most recent tier 1-2 debuff and heal a small amount of damage.
\t[sup]From: alchemist, champion, combat maid, druid, mad scientist, maid, merchant, nurse, paladin, party member, plague doctor, scientist, witch[/sup]
[b][color=pink]Fluffy[/color][/b] (Cost: 3) - Raises the effectiveness of CHA.
\t[sup]From: sheep[/sup]
[b][color=white]Fodder[/color][/b] (Cost: 15) - No matter what way you look at it you're EXP
\t[sup]From: [/sup]
[b][color=yellow]Frail[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of VIT.
\t[sup]From: archmage, archwizard, blackguard, blood knight, lich, monk, necromancer, wizard, zen master[/sup]
[b][color=yellow]Freezing[/color][/b] (Cost: 4) - Lowers the effectiveness of STR, VIT, and DEX.
\t[sup]From: abyss knight, ancient dragon, archmage, archwizard, chimera, dragon, elemental, hero, ice elemental, lich, necromancer, party member, sage, shade, snow sprite, sprite[/sup]
[b][color=white]Frog[/color][/b] (Cost: 9) - Massively lowers the effectiveness of ALL.
\t[sup]From: archmage, witch[/sup]
[b][color=white]From Beyond[/color][/b] (Cost: 50) - Greatly raises the effectiveness of ALL and applies the effects of Ever-Changing.
\t[sup]From: [/sup]
[b][color=white]Frosty[/color][/b] (Cost: 15) - You have a chance to automatically cause Freezing when you drain/attack.
\t[sup]From: [/sup]
[b][color=yellow]Futanarification[/color][/b] (Cost: 1) - Causes you to become intersex. (flavor effect)
\t[sup]From: alchemist, archmage, archwizard, djinn, draincubus, fae, incubus, little devil, mad scientist, master chemist, master of pacts, nymph, scientist, succubus, warlock, witch, wizard, homunculus[/sup]
[b][color=pink]Genderbent[/color][/b] (Cost: 1) - Swaps your gender. (flavor effect)
\t[sup]From: alchemist, archmage, archwizard, djinn, draincubus, fae, incubus, little devil, mad scientist, master chemist, master of pacts, scientist, succubus, warlock, witch, wizard, homunculus[/sup]
[b][color=red]Graceful[/color][/b] (Cost: 4) - Greatly raises the effectiveness of DEX.
\t[sup]From: angel, archangel, archmage, djinn, druid, harpy, idol, master of pacts, superstar[/sup]
[b][color=white]Great-Boon[/color][/b] (Cost: 6) - A random Mid or High-tier Buff is applied.
\t[sup]From: djinn[/sup]
[b][color=yellow]Hardy[/color][/b] (Cost: 3) - Raises the effectiveness of VIT.
\t[sup]From: alchemist, bard, chef, cleric, cow, healer, knight, mad scientist, master chef, master chemist, royal knight, scientist, sidekick, spoony bard, warpriest[/sup]
[b][color=white]Heal[/color][/b] (Cost: 7) - (UNIMPLEMENTED) Remove the most recent tier 3-4 and debuff, all tier 2 and below debuffs, and heal a moderate amount of damage.
\t[sup]From: abyss knight, angel, archangel, archmage, bishop, champion, cleric, dungeon core, healer, healslut, hero, master chemist, plague doctor, sage, warpriest[/sup]
[b][color=white]Hero of Legend[/color][/b] (Cost: 25) - Applies LUC to attack, raises the effectiveness of ALL, and grants Blessed-Weapon and Blessed-Armor
\t[sup]From: [/sup]
[b][color=red]Hobbled[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of DEX.
\t[sup]From: berserker, blackguard, blood knight, chimera, desperado, gunslinger, kensai, mimic, ranger, samurai, sharpshooter, swashbuckler, weapon master[/sup]
[b][color=white]Honed[/color][/b] (Cost: 2) - Raises the effectiveness of your Weapon.
\t[sup]From: artificer, blacksmith, combat maid, cursed sword, dungeon core, engineer, master smith, party member, squire[/sup]
[b][color=pink]Horny[/color][/b] (Cost: 3) - Raises ATK while draining, but lowers DEF while being drained.
\t[sup]From: artificial intelligence, bard, bimbo, cheerleader, cumdump, cupid, dancer, draincubus, eros, healslut, incubus, little devil, nymph, prostitute, reverse bunny, satyr, spoony bard, succubus, witch, superstar, himbo[/sup]
[b][color=red]Immobile[/color][/b] (Cost: 5) - Massively lowers the effectiveness of DEX.
\t[sup]From: gargoyle[/sup]
[b][color=yellow]Infected[/color][/b] (Cost: 1) - (UNIMPLEMENTED) A contagion has taken root within you, and will soon be made manifest
\t[sup]From: alien, clown, elder vampire, galactic tyrant, giant rat, lycanthrope, matango, outer horror, plague doctor, vampire, zombie[/sup]
[b][color=yellow]Infested[/color][/b] (Cost: 5) - Greatly lowers the effectiveness of VIT and INT.
\t[sup]From: druid, forest elemental, matango, parasite, plague doctor[/sup]
[b][color=cyan]Inspired[/color][/b] (Cost: 4) - Greatly raises the effectiveness of INT.
\t[sup]From: archangel, archdemon, archmage, cheshire, demon, djinn, harpy, idol, professor, psychic, sphinx, superstar, athlete[/sup]
[b][color=yellow]Invincible[/color][/b] (Cost: 7) - Massively raises the effectiveness of VIT.
\t[sup]From: warpriest[/sup]
[b][color=white]Irradiated[/color][/b] (Cost: 5) - Greatly raises and lowers the effectiveness of stats at random.
\t[sup]From: artificer, automaton, galactic tyrant[/sup]
[b][color=pink]Irresistible[/color][/b] (Cost: 7) - Massively raises the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=white]Legendary-Armor[/color][/b] (Cost: 10) - Greatly raises DEF. Lost on defeat.
\t[sup]From: artificer, master smith[/sup]
[b][color=white]Legendary-Weapon[/color][/b] (Cost: 10) - Greatly raises ATK. Lost on defeat.
\t[sup]From: artificer, master smith[/sup]
[b][color=green]Lucky[/color][/b] (Cost: 3) - Raises the effectiveness of LUC.
\t[sup]From: blessed tail, bunny, casino bunny, cleric, gambler, reverse bunny, spoony bard, warpriest, winner[/sup]
[b][color=yellow]Macro[/color][/b] (Cost: 11) - Greatly decreases the effectiveness of DEX but greatly raises the effectiveness of STR and VIT.
\t[sup]From: [/sup]
[b][color=cyan]Madness[/color][/b] (Cost: 5) - Randomize how much you drain / siphon between your min and max
\t[sup]From: cheshire, false prophet, outer horror[/sup]
[b][color=white]Magic-Armor[/color][/b] (Cost: 7) - Raises DEF. Lost on defeat.
\t[sup]From: ancient dragon, archmage, artificer, blacksmith, cursed armor, dungeon core, master smith, merchant[/sup]
[b][color=white]Magic-Weapon[/color][/b] (Cost: 7) - Raises ATK. Lost on defeat.
\t[sup]From: ancient dragon, archmage, artificer, blacksmith, cursed sword, dungeon core, master smith, merchant[/sup]
[b][color=white]Marked[/color][/b] (Cost: 1) - Wears someone's mark on their body. (flavor effect)
\t[sup]From: [/sup]
[b][color=white]Mastery[/color][/b] (Cost: 8) - Raises the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=yellow]Mega[/color][/b] (Cost: 11) - Decreases the effectiveness of DEX but raises the effectiveness of STR and VIT.
\t[sup]From: [/sup]
[b][color=yellow]Micro[/color][/b] (Cost: 11) - Greatly decreases the effectiveness of STR and VIT but greatly raises the effectiveness of DEX.
\t[sup]From: [/sup]
[b][color=orange]Mighty[/color][/b] (Cost: 4) - Greatly raises the effectiveness of STR.
\t[sup]From: archangel, archdemon, archmage, cleric, demon, djinn, druid, master of pacts, sage, warpriest[/sup]
[b][color=cyan]Milk-Addicted[/color][/b] (Cost: 3) - You crave milk
\t[sup]From: broodmother, cow, cupid, eros, imp, little devil, minotaur, mommy, queen bee, rancher[/sup]
[b][color=yellow]Milky[/color][/b] (Cost: 15) - Bestowing and inflicting may also inflict milk-addicted.
\t[sup]From: [/sup]
[b][color=cyan]Mindbroken[/color][/b] (Cost: 7) - You accept what happens to you
\t[sup]From: elder brain, mindflayer[/sup]
[b][color=yellow]Mini[/color][/b] (Cost: 11) - Decreases the effectiveness of STR and VIT but raises the effectiveness of DEX.
\t[sup]From: [/sup]
[b][color=white]Miracle-Elixir[/color][/b] (Cost: 10) - A random buff or debuff is applied.
\t[sup]From: master chemist[/sup]
[b][color=white]Miracle[/color][/b] (Cost: 10) - (UNIMPLEMENTED) Remove the most recent debuff, all tier 4 and below debuffs, and heal a huge amount of damage, even if KO'd!
\t[sup]From: archangel[/sup]
[b][color=white]Mutation[/color][/b] (Cost: 3) - Grants temporary Monster tag.
\t[sup]From: chimera, mad scientist, outer horror, parasite, homunculus[/sup]
[b][color=white]N E E T[/color][/b] (Cost: 15) - Get a job.
\t[sup]From: [/sup]
[b][color=white]Noxious-Concoction[/color][/b] (Cost: 5) - A random debuff is applied.
\t[sup]From: alchemist, gazer, mad scientist, master chemist, plague doctor, witch, homunculus[/sup]
[b][color=white]One With Nature[/color][/b] (Cost: 8) - Raises the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=yellow]Overheated[/color][/b] (Cost: 4) - Lowers the effectiveness of STR, VIT, and DEX.
\t[sup]From: abyss knight, ancient dragon, archmage, archwizard, ash sprite, chimera, dragon, elemental, fire elemental, hellhound, hero, mecha, party member, sage, sprite, superhero, warship, wizard[/sup]
[b][color=white]Overloaded[/color][/b] (Cost: 5) - (UNIMPLEMENTED) You collapse under the weight of too many status effects, losing all of their benefits.
\t[sup]From: android, artificer, artificial intelligence, elder brain, engineer, galactic tyrant, mad scientist, mecha, homunculus[/sup]
[b][color=red]Paralyzed[/color][/b] (Cost: 4) - Unable to resist with DEX
\t[sup]From: abyss knight, air elemental, android, ancient dragon, arachne, chimera, cursed armor, dragon, drain slime, elemental, gazer, hero, jellyfish, manticore, matango, monk, sage, shade, slime, sprite, zen master[/sup]
[b][color=white]Perfected-Mind[/color][/b] (Cost: 8) - Greatly raises the effectiveness of INT/CHA/LUC.
\t[sup]From: [/sup]
[b][color=white]Perfected-Physique[/color][/b] (Cost: 8) - Greatly raises the effectiveness of STR/DEX/VIT.
\t[sup]From: [/sup]
[b][color=white]Perfection[/color][/b] (Cost: 10) - Greatly raises the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=pink]Persuasive[/color][/b] (Cost: 3) - Raises the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=red]Petrified[/color][/b] (Cost: 4) - Unable to resist with DEX
\t[sup]From: archmage, gargoyle, gazer, gorgon, sphinx[/sup]
[b][color=yellow]Poisoned[/color][/b] (Cost: 4) - Unable to resist with VIT
\t[sup]From: abyss knight, alchemist, alraune, ancient dragon, arachne, archmage, assassin, bee, chimera, dragon, drain slime, fae, giant rat, gorgon, hero, jellyfish, lamia, mad scientist, manticore, master chemist, matango, moth, ninja, phantom thief, ranger, rodent, scientist, sharpshooter, stalker, thief, witch[/sup]
[b][color=cyan]Possessed[/color][/b] (Cost: 5) - Very high chance to change resist to accept
\t[sup]From: cursed armor, cursed sword, doll, ghost, parasite, puppeteer, shade[/sup]
[b][color=orange]Powerless[/color][/b] (Cost: 5) - Massively lowers the effectiveness of STR.
\t[sup]From: archdemon, villain[/sup]
[b][color=red]Precise[/color][/b] (Cost: 4) - Greatly raises the effectiveness of DEX.
\t[sup]From: [/sup]
[b][color=white]Pregnant[/color][/b] (Cost: 2) - Lowers the effectiveness of DEX and VIT.
\t[sup]From: [/sup]
[b][color=white]Protected[/color][/b] (Cost: 5) - Raises your defenses.
\t[sup]From: champion, cleric, combat maid, cursed armor, fighter, knight, miko, minion, paladin, party member, royal knight, sidekick, squire, superhero, vigilante, warpriest, warship, weapon master[/sup]
[b][color=yellow]Pulverized[/color][/b] (Cost: 5) - Massively reduces the effectiveness of VIT.
\t[sup]From: ancient dragon, golem, minotaur, oni, superhero, warship[/sup]
[b][color=white]Questing[/color][/b] (Cost: 3) - Grants temporary Adventurer tag.
\t[sup]From: bartender, dungeon core, noble, royal[/sup]
[b][color=pink]Ravenous[/color][/b] (Cost: 5) - Grants temporary Drainer tag.
\t[sup]From: chef, giant rat, master chef[/sup]
[b][color=white]Reinforced[/color][/b] (Cost: 2) - Raises the effectiveness of your Armor.
\t[sup]From: artificer, blacksmith, engineer, master smith, puppeteer[/sup]
[b][color=green]Righteous[/color][/b] (Cost: 5) - LUC also applies to Attack.
\t[sup]From: acolyte, archangel, bishop, cleric, devout, nun, priest, warpriest[/sup]
[b][color=pink]Rude[/color][/b] (Cost: 2) - Lowers the effectiveness of CHA.
\t[sup]From: [/sup]
[b][color=pink]Ruined[/color][/b] (Cost: 5) - Massively lowers the effectiveness of CHA.
\t[sup]From: archdemon[/sup]
[b][color=pink]Seduced[/color][/b] (Cost: 2) - Low chance to change resist to accept
\t[sup]From: [/sup]
[b][color=yellow]Silenced[/color][/b] (Cost: 4) - Unable to attack or drain with INT
\t[sup]From: abyss knight, alchemist, archmage, assassin, bishop, cleric, cursed armor, desperado, drain slime, executioner, gazer, hero, inquisitor, mad scientist, master chemist, merfolk, mystic knight, ninja, phantom thief, scientist, sharpshooter, siren, spellsword, thief, warpriest, witch[/sup]
[b][color=yellow]Sleep[/color][/b] (Cost: 4) - Chance to fail grind, chance to expire
\t[sup]From: alchemist, alraune, archmage, archwizard, assassin, bard, dancer, fae, gazer, ice elemental, mad scientist, master chemist, matango, moth, ninja, nurse, scientist, sheep, snow sprite, spoony bard, witch, wizard[/sup]
[b][color=red]Slimed[/color][/b] (Cost: 3) - Lowers the effectiveness of CHA and DEX.
\t[sup]From: bimboslime, drain slime, horror, mimic, outer horror, queen bee, slime, slimebimbo[/sup]
[b][color=white]Slimy[/color][/b] (Cost: 15) - You have a chance to automatically cause Slimed when you drain/attack.
\t[sup]From: [/sup]
[b][color=red]Slow[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of DEX.
\t[sup]From: archmage, archwizard, gazer, ice elemental, lich, necromancer, shade, wizard[/sup]
[b][color=yellow]Sore[/color][/b] (Cost: 2) - Lowers the effectiveness of VIT.
\t[sup]From: [/sup]
[b][color=yellow]Spored[/color][/b] (Cost: 3) - Lowers the effectiveness of VIT and INT.
\t[sup]From: alraune, matango, moth, spore zombie[/sup]
[b][color=white]Spores[/color][/b] (Cost: 15) - You have a chance to automatically cause Spored when you drain/attack.
\t[sup]From: [/sup]
[b][color=yellow]Stalwart[/color][/b] (Cost: 4) - Greatly raises the effectiveness of VIT.
\t[sup]From: angel, archangel, archmage, djinn, druid[/sup]
[b][color=pink]Stripped[/color][/b] (Cost: 3) - Naked, and that means no Armor either.
\t[sup]From: [/sup]
[b][color=orange]Strong[/color][/b] (Cost: 3) - Raises the effectiveness of STR.
\t[sup]From: alchemist, bard, berserker, cheerleader, cow, fighter, mad scientist, master chemist, mystic knight, royal knight, scientist, sidekick, spoony bard, warrior, weapon master[/sup]
[b][color=red]Tied-Up[/color][/b] (Cost: 2) - Lowers the effectiveness of DEX.
\t[sup]From: [/sup]
[b][color=white]Tired[/color][/b] (Cost: 99) - Lowers the effectiveness of ALL.
\t[sup]From: [/sup]
[b][color=white]Tyrant of Darkness[/color][/b] (Cost: 50) - Applies CHA to defense, and Greatly raises the effectiveness of ALL
\t[sup]From: [/sup]
[b][color=yellow]Undead[/color][/b] (Cost: 3) - Greatly lowers the effectiveness of VIT.
\t[sup]From: lich, necromancer[/sup]
[b][color=white]Unlabeled-Potion[/color][/b] (Cost: 4) - A random Low or Mid-tier Buff is applied.
\t[sup]From: alchemist, master chemist, merchant, witch, homunculus[/sup]
[b][color=green]Unlucky[/color][/b] (Cost: 3) - Lowers the effectiveness of LUC.
\t[sup]From: blessed tail, casino bunny, cheshire, gambler, reverse bunny, winner[/sup]
[b][color=orange]Unstoppable[/color][/b] (Cost: 7) - Massively raises the effectiveness of STR.
\t[sup]From: [/sup]
[b][color=cyan]Vicious[/color][/b] (Cost: 5) - Massively raises the effectiveness of STR while greatly lowering DEF and INT.
\t[sup]From: [/sup]
[b][color=yellow]Virile[/color][/b] (Cost: 1) - (UNIMPLEMENTED) Your body is primed to breed! When inflicting pregnant while you have this status double the attack roll!
\t[sup]From: alchemist, alien, ancient dragon, archdemon, broodmother, centaur, chimera, cow, demon, djinn, dragon, draincubus, eros, false prophet, galactic tyrant, gazer, goblin, gorgon, hellhound, hobgoblin, imp, incubus, kraken, lamia, little devil, lycanthrope, mad scientist, manticore, master chemist, matango, minotaur, oni, outer horror, parasite, satyr, scientist, scylla, shark, succubus, witch[/sup]
[b][color=orange]Weak[/color][/b] (Cost: 2) - Lowers the effectiveness of STR.
\t[sup]From: [/sup]
[b][color=white]Wealthy[/color][/b] (Cost: 25) - Greatly increases gold gains from grinding.
\t[sup]From: [/sup]
[b][color=white]Weapon[/color][/b] (Cost: 3) - Slightly raises ATK. Lost on defeat.
\t[sup]From: artificer, blacksmith, engineer, master smith, merchant[/sup]
[b][color=yellow]Well-Fed[/color][/b] (Cost: 3) - Lowers the effectiveness of DEX, but raises the effectiveness of VIT.
\t[sup]From: bee, bloodbank, chef, cow, crab, farmer, forest elemental, leaf sprite, master chef, merchant, mommy, rancher, fisherman[/sup]
[b][color=green]Wicked[/color][/b] (Cost: 5) - CHA also applies to defense.
\t[sup]From: archdemon, demon, villain[/sup]
[b][color=white]Working[/color][/b] (Cost: 15) - Increases gold gains from grinding.
\t[sup]From: [/sup]`
    }
}


export class Job {
    name: string;
    desc: string;
    tags: string[];
    convert: string;
    convertJob: Job | null = null;
    scaling: string;
    innate: Buff | null;
    buffs: Buff[];

    constructor(name: string, desc: string, tags: string[], convert: string, scaling: string, innate: Buff | null, buffs: Buff[]) {
        this.name = name;
        this.desc = desc;
        this.tags = tags;
        this.convert = convert;
        this.scaling = scaling;
        this.innate = innate;
        this.buffs = buffs;
    }

    getTagString(): string {
        let tmp: string[] = [];
        this.tags.forEach((tag) => tmp.push(tag.replace('\t', '')));
        return `${tmp.join('  ')}`;
    }

    getBuffsString(): string {
        let tmp: string[] = [];
        this.buffs.forEach((buff) => tmp.push(buff.name));
        return tmp.join(', ');
    }
}

export class JobRepository {
    jobs: { [name: string]: Job } = {};
    private static instance: JobRepository;

    private constructor() {
        this.parseJobs(JobRepository.getJobsRaw());
        BuffRepository.getInstance().linkFromJobs(this);
        this.linkConverts();
    }

    static getInstance(): JobRepository {
        if (!JobRepository.instance)
            JobRepository.instance = new JobRepository();
        return JobRepository.instance;
    }

    getJob(name: string | undefined): Job | null {
        try {
            if(!name)
                return null;
            return this.jobs[name.toLowerCase().trim()];
        } catch (err) {
            return null;
        }
    }

    readonly jobRegex = /\[u\](?<jobname>.*?)\[\/u\].*?\[b\](?<jobtags>.*?)(?:\[\/b\]|Converts: (?<converts>.*?)\[\/b\]).*[\r\n]+(?<jobdesc>.*)[\r\n]+(?<scaling>.*?) \| Innate: (?<innate>.*)[\r\n]+.*?\[sub\](?<buffs>.*)\[\/sub\]/gmi;

    linkConverts(): void {
        for(const [_, job] of Object.entries(this.jobs)) {
            job.convertJob = this.getJob(job.convert?.trim());
        }
    }

    parseJobs(jobs: string): void {
        let match;
        while ((match = this.jobRegex.exec(jobs)) !== null) {
            try {
                const jobGroups = match.groups;
                if (!jobGroups) {
                    log.error('Job Parse failed!', match);
                    return;
                }
                const jobName = jobGroups.jobname;
                const jobTags = jobGroups.jobtags.trim().split(' ');
                jobTags.map((val) => val.trim().replace('\t', ''));
                const convert = jobGroups.converts;
                const jobDesc = jobGroups.jobdesc;
                const scaling = jobGroups.scaling;
                const innate = BuffRepository.getInstance().getBuff(jobGroups.innate);
                const b = jobGroups.buffs.trim().split('  ');
                const buffs: Buff[] = [];
                b.forEach((buff) => {
                    let b = BuffRepository.getInstance().getBuff(buff);
                    if (b)
                        buffs?.push(b as Buff);
                });
                this.jobs[jobName.toLowerCase()] = new Job(
                    jobName, jobDesc, jobTags, convert, scaling, innate, buffs
                );
            } catch (err) {
                log.error(match, err);
                throw err;
            }
        }

    }

    static getJobsRaw(): string {
        return `[u]Demon Lord[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Demon[/b][/sub]
An enemy of mankind and leader of an army of demons. Leading hordes of unholy, monstrous creatures, a demon lord wages eternal war against both the mortals and the heavenly forces.
STR [color=green] +++·[/color] | VIT [color=green] +++·[/color] | DEX [color=green] +++[/color] | INT [color=green] ++[/color] | CHA [color=green] ++[/color] | LUC [color=red] --[/color] | Innate: Tyrant of Darkness
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Captivating[/color]  [color=pink]Charmed[/color]  [color=yellow]Crushed[/color]  [color=white]Cursed-Armor[/color]  [color=white]Cursed-Weapon[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=orange]Disarmed[/color]  [color=green]Doomed[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=cyan]Inspired[/color]  [color=white]Mastery[/color]  [color=orange]Mighty[/color]  [color=white]Mutation[/color]  [color=white]Noxious-Concoction[/color]  [color=orange]Powerless[/color]  [color=pink]Ruined[/color]  [color=yellow]Silenced[/color]  [color=red]Slow[/color]  [color=yellow]Virile[/color]  [color=green]Wicked[/color][/sub]
[u]Zombie[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
Animated corpses that have persisted beyond their demise, usually by the meddling of a necromancer.
STR [color=green] +++[/color] | VIT [color=green] ·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Undead
Buffs/Debuffs:[sub]  [color=white]Fear[/color]  [color=yellow]Infected[/color][/sub]
[u]Zen Master[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
Ascended holy warriors who can see with their mind's eye.
STR [color=green] +++[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +++[/color] | INT [color=green] ++·[/color] | CHA - | LUC - | Innate: Perfected-Physique
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=yellow]Crushed[/color]  [color=orange]Disarmed[/color]  [color=cyan]Enlightened[/color]  [color=yellow]Frail[/color]  [color=red]Paralyzed[/color][/sub]
[u]Wind Sprite[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Elemental spirits attuned to the power of wind!
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ++[/color] | INT [color=green] +++[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Dizzy[/color][/sub]
[u]Weapon Master[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
Sublime technique honed to a razor edge, these fighters' weapons are truly like an extension of their own body.
STR [color=green] +++[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +++[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Honed
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=yellow]Crushed[/color]  [color=orange]Disarmed[/color]  [color=red]Hobbled[/color]  [color=white]Protected[/color]  [color=orange]Strong[/color][/sub]
[u]Warship[/u]\t [sub][b][/b][/sub]
Masters of naval warfare. Kind of. Who in their right mind would come up with this concept?
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Hardy
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Overheated[/color]  [color=white]Protected[/color]  [color=yellow]Pulverized[/color][/sub]
[u]Warpriest[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
On the field of battle a warpriest brings the fury of their god with them, the two becoming one and the same.
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++·[/color] | Innate: Blessed-Armor
Buffs/Debuffs:[sub]  [color=white]Blessed-Armor[/color]  [color=white]Blessed-Weapon[/color]  [color=green]Blessed[/color]  [color=green]Favored[/color]  [color=yellow]Hardy[/color]  [color=white]Heal[/color]  [color=yellow]Invincible[/color]  [color=green]Lucky[/color]  [color=orange]Mighty[/color]  [color=white]Protected[/color]  [color=green]Righteous[/color]  [color=yellow]Silenced[/color][/sub]
[u]Villain[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t Converts: Minion[/b][/sub]
The foil to the hero, the master of machinations and menace to those who do good in the world.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Ascended-Mind
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=green]Doomed[/color]  [color=white]Fear[/color]  [color=orange]Powerless[/color]  [color=green]Wicked[/color][/sub]
[u]Vigilante[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
With the power to make a difference why wait around on the cops to clean this city up?
STR [color=green] +·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Hardy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Crushed[/color]  [color=orange]Disarmed[/color]  [color=white]Protected[/color][/sub]
[u]Vampire[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color]\t Converts: Bloodbank[/b][/sub]
Eternally youthful undead that feed upon the blood of the living.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] ++[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Undead
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color]  [color=yellow]Infected[/color][/sub]
[u]Thrall[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
Lowly beings bound to serve someone or something greater.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Brainwashed
Buffs/Debuffs:[sub] N/A[/sub]
[u]Teacher[/u]\t [sub][b]\t [color=white]Support[/color]\t Converts: Student[/b][/sub]
Educators and instructors of various fields, they instill understanding but not mastery.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Clarity
Buffs/Debuffs:[sub]  [color=cyan]Clarity[/color][/sub]
[u]Tamed Beast[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=orange]Monster[/color][/b][/sub]
Regardless of what they may have been before, they've since been tamed, obedient to their new master.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Enslaved
Buffs/Debuffs:[sub] N/A[/sub]
[u]Swashbuckler[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
Adept at blindingly fast and flamboyantly flashy swordplay, with an attitude to match.
STR [color=green] +·[/color] | VIT [color=green] +[/color] | DEX [color=green] +++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Daring
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=pink]Charmed[/color]  [color=orange]Disarmed[/color]  [color=red]Hobbled[/color][/sub]
[u]Superstar[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=white]Support[/color]\t Converts: Fan[/b][/sub]
You made it big kid, you're a star!
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++·[/color] | INT [color=green] ·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Irresistible
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=red]Graceful[/color]  [color=pink]Horny[/color]  [color=cyan]Inspired[/color][/sub]
[u]Superhero[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t Converts: Sidekick[/b][/sub]
Comic book crusaders who bring justice to criminals and villains the world over.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Evolved-Physique
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Crushed[/color]  [color=orange]Disarmed[/color]  [color=yellow]Overheated[/color]  [color=white]Protected[/color]  [color=yellow]Pulverized[/color][/sub]
[u]Succubus[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color]\t Converts: Meatdildo[/b][/sub]
A mid-rank lust demon. Prefers to charm, trick and drain its victims rather than fight directly.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] +·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Horny
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=pink]Horny[/color]  [color=yellow]Virile[/color][/sub]
[u]Student[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
Someone striving to better themselves through diligent studies, whether for the sake of money, intellect or fame.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Clever
Buffs/Debuffs:[sub] N/A[/sub]
[u]Statue[/u]\t [sub][b][/b][/sub]
Talk about getting stoned.
STR - | VIT [color=green] +++++[/color] | DEX [color=red] ---·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Petrified
Buffs/Debuffs:[sub] N/A[/sub]
[u]Stalker[/u]\t [sub][b][/b][/sub]
Obsessed with someone to the point of being creepy. A danger to themselves, the target of their obsession, and society itself.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++[/color] | INT [color=green] ++[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Creepy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Poisoned[/color][/sub]
[u]Squire[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color][/b][/sub]
A knight in training, often made to do menial tasks for their mentor.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Clumsy
Buffs/Debuffs:[sub]  [color=white]Honed[/color]  [color=white]Protected[/color][/sub]
[u]Sprite[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Elemental spirits that have yet to tap into their true potential.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Freezing[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color][/sub]
[u]Spore Zombie[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color][/b][/sub]
Thralls enslaved by spores, dust, or pollen, now their workers and protectors.
STR [color=green] ·[/color] | VIT [color=green] +++[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Spored
Buffs/Debuffs:[sub]  [color=yellow]Spored[/color][/sub]
[u]Spoony Bard[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t Converts: Fan[/b][/sub]
A bard of enough renown that they are banned from at least one royal court for their shenanigans.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +·[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=white]Boon[/color]  [color=pink]Charmed[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=cyan]Confused[/color]  [color=yellow]Hardy[/color]  [color=pink]Horny[/color]  [color=green]Lucky[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color][/sub]
[u]Sphinx[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Some apparent combination of noble beast and human, they are temperamental but enjoy riddles and philosophy.
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Clever
Buffs/Debuffs:[sub]  [color=cyan]Clarity[/color]  [color=cyan]Confused[/color]  [color=yellow]Crushed[/color]  [color=cyan]Inspired[/color]  [color=red]Petrified[/color][/sub]
[u]Snow Sprite[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Elemental spirits attuned to the power of frost and snow!
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] +++[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=yellow]Freezing[/color]  [color=yellow]Sleep[/color][/sub]
[u]Slimebimbo[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Host to a parasitic, pink slime that invades the target's head, residing in its skull and feeding on the thoughts and gray matter, replacing everything with [color=pink][b]happy, bubbly thoughts[/b][/color].
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=red] -·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Slimy
Buffs/Debuffs:[sub]  [color=cyan]Bimboslimed[/color]  [color=orange]Bound[/color]  [color=white]Egg-Filled[/color]  [color=red]Slimed[/color][/sub]
[u]Slime[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color]\t Converts: Slime[/b][/sub]
An amorphous blob. Considered low-rank monsters, although skilled ones can change their shape to appear humanoid. They prey on various fluids, especially those extracted from living beings.
STR [color=green] ·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Slimy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=white]Egg-Filled[/color]  [color=red]Paralyzed[/color]  [color=red]Slimed[/color][/sub]
[u]Slave[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
Lower than dirt, and sometimes covered in it. Their purpose is to serve their Master or Mistress without question or suffer the consequences.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Enslaved
Buffs/Debuffs:[sub] N/A[/sub]
[u]Skeleton[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
Ooo SPOOPY!
STR [color=green] +·[/color] | VIT - | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Undead
Buffs/Debuffs:[sub]  [color=white]Fear[/color][/sub]
[u]Siren[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t Converts: Fan[/b][/sub]
Singers of the sea that lure their victims with their sweet voice and take them to the ocean's depths.
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++[/color] | INT [color=green] +[/color] | CHA [color=green] ++++[/color] | LUC - | Innate: Irresistible
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=yellow]Silenced[/color][/sub]
[u]Sidekick[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color]\t [color=green]Adventurer[/color][/b][/sub]
Every superhero needs a sidekick! Or do they? Every sidekick certainly needs a superhero at least.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Boring
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Bound[/color]  [color=cyan]Clarity[/color]  [color=yellow]Hardy[/color]  [color=white]Protected[/color]  [color=orange]Strong[/color][/sub]
[u]Sheep[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color][/b][/sub]
Fluffy and cute, these adorable livestock are prized for their wool.
STR [color=green] ·[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +[/color] | Innate: Fluffy
Buffs/Debuffs:[sub]  [color=pink]Fluffy[/color]  [color=yellow]Sleep[/color][/sub]
[u]Sharpshooter[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
One that has mastered Archery and can use their cunning and dexterity to escape even the riskiest situations.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Precise
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=orange]Disarmed[/color]  [color=orange]Entangled[/color]  [color=red]Hobbled[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color][/sub]
[u]Shark[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Vicious aquatic predators who can smell blood from miles away.
STR [color=green] +++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] +[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Vicious
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=yellow]Virile[/color][/sub]
[u]Shade[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
A shadow without an owner. Humanoid monsters who control the darkness.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] +++[/color] | INT [color=green] +++·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Creepy
Buffs/Debuffs:[sub]  [color=green]Cursed[/color]  [color=white]Fear[/color]  [color=yellow]Freezing[/color]  [color=red]Paralyzed[/color]  [color=cyan]Possessed[/color]  [color=red]Slow[/color][/sub]
[u]Scylla[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Monsters with a humanoid upper body and an octopus-like lower half.
STR [color=green] ++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Slimy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Crushed[/color]  [color=pink]Dirty[/color]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Virile[/color][/sub]
[u]Satyr[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=orange]Monster[/color][/b][/sub]
Half human, half goat, and horny all the time, literally and figuratively.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ++[/color] | Innate: Drunk
Buffs/Debuffs:[sub]  [color=yellow]Drunk[/color]  [color=yellow]Fecund[/color]  [color=pink]Horny[/color]  [color=yellow]Virile[/color][/sub]
[u]Sand Sprite[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Elemental spirits attuned to the power of sand!
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ·[/color] | INT [color=green] +++[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=cyan]Confused[/color]  [color=pink]Dirty[/color][/sub]
[u]Salaryman[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
A soulless husk of a person, complete with briefcase and business card.
STR [color=green] +[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Working
Buffs/Debuffs:[sub] N/A[/sub]
[u]Sage[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
Masters of the elements and holy magic.
STR [color=green] +[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++++·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++·[/color] | Innate: Clarity
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=green]Blessed[/color]  [color=cyan]Confused[/color]  [color=yellow]Freezing[/color]  [color=white]Heal[/color]  [color=orange]Mighty[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color][/sub]
[u]Royal[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t Converts: Knight[/b][/sub]
While most royals don't have any knack for fighting you literally cannot have a kingdom without them.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +++[/color] | LUC [color=green] ++[/color] | Innate: Wealthy
Buffs/Debuffs:[sub]  [color=white]Boon[/color]  [color=pink]Charmed[/color]  [color=green]Condemned[/color]  [color=green]Favored[/color]  [color=white]Questing[/color][/sub]
[u]Royal Knight[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t Converts: Squire[/b][/sub]
Elite knights of distinguished valor whose power decides the fate of the kingdom itself.
STR [color=green] +++[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Stalwart
Buffs/Debuffs:[sub]  [color=orange]Disarmed[/color]  [color=yellow]Hardy[/color]  [color=white]Protected[/color]  [color=orange]Strong[/color][/sub]
[u]Rodent[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Rodents that resemble people, or people that resemble rodents. They are quite often "cheesed to meet you," but nobody is sure what this means.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +·[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Fodder
Buffs/Debuffs:[sub]  [color=pink]Dirty[/color]  [color=yellow]Poisoned[/color][/sub]
[u]Reverse Bunny[/u]\t [sub][b]\t [color=pink]Seducer[/color][/b][/sub]
An employee of a casino. Is this some kind of a punishment outfit, or are they actually WILLING to wear this?
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +·[/color] | Innate: Lucky
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=yellow]Drunk[/color]  [color=pink]Horny[/color]  [color=green]Lucky[/color]  [color=green]Unlucky[/color][/sub]
[u]Rancher[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t Converts: Cow[/b][/sub]
Beef don't raise itself ya know, and that milk has to come from somewhere.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Queen Bee[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t Converts: Bee[/b][/sub]
The master of the hive, in charge of its prosperity and growth. They command a great army of workers and soldiers.
STR [color=green] +[/color] | VIT [color=green] +++[/color] | DEX [color=green] ·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +[/color] | Innate: Egg-Filled
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=pink]Charmed[/color]  [color=white]Egg-Filled[/color]  [color=cyan]Milk-Addicted[/color]  [color=red]Slimed[/color][/sub]
[u]Puppeteer[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=red]Unholy[/color]\t Converts: Doll[/b][/sub]
A magical puppet master, specializing in controlling their mysterious dolls. Considering how [b][color=purple]life-like[/color][/b] the dolls seem, they must have been crafted by quite an artisan...
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=cyan]Possessed[/color]  [color=white]Reinforced[/color][/sub]
[u]Punching Bag[/u]\t [sub][b][/b][/sub]
Exists to be punched. The better it is, the more of a beating it can take.
STR [color=green] ·[/color] | VIT [color=green] ++++++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Sore
Buffs/Debuffs:[sub] N/A[/sub]
[u]Psychic[/u]\t [sub][b][/b][/sub]
Supernatural beings who bring to bear the true power of the mind.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++++[/color] | CHA [color=green] ++[/color] | LUC [color=green] +[/color] | Innate: Ascended-Mind
Buffs/Debuffs:[sub]  [color=cyan]Amnesia[/color]  [color=cyan]Berserk[/color]  [color=cyan]Brainwashed[/color]  [color=cyan]Clarity[/color]  [color=cyan]Dizzy[/color]  [color=cyan]Inspired[/color][/sub]
[u]Plague Doctor[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=white]Support[/color]\t [color=red]Unholy[/color][/b][/sub]
A dubious physician that administers needed but often strange and unethical treatments.
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] +++[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Wicked
Buffs/Debuffs:[sub]  [color=yellow]Bloated[/color]  [color=green]Doomed[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color]  [color=white]First-Aid[/color]  [color=white]Heal[/color]  [color=yellow]Infected[/color]  [color=yellow]Infested[/color]  [color=white]Noxious-Concoction[/color][/sub]
[u]Pirate[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=green]Adventurer[/color][/b][/sub]
Seafaring scoundrels fond of grog and plunder.
STR [color=green] ++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +[/color] | Innate: Drunk
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=orange]Disarmed[/color]  [color=yellow]Drunk[/color][/sub]
[u]Pig[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
The most looked down upon of all the livestock, a creature valued only as meat.
STR [color=green] ·[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Dirty
Buffs/Debuffs:[sub]  [color=pink]Dirty[/color][/sub]
[u]Phantom Thief[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
A certain gallantry and theatrical talent make these master thieves almost seem like heroes.
STR [color=green] +[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=orange]Disarmed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color][/sub]
[u]Party Member[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color]\t [color=green]Adventurer[/color][/b][/sub]
A supporting figure in charge of miscellaneous jobs, but never getting much attention...
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub]  [color=white]First-Aid[/color]  [color=yellow]Freezing[/color]  [color=white]Honed[/color]  [color=yellow]Overheated[/color]  [color=white]Protected[/color][/sub]
[u]Parasite[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color][/b][/sub]
Vile creatures that subsist by attaching themselves to others and sharing their life.
STR [color=green] +[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] +++·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Creepy
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Infested[/color]  [color=white]Mutation[/color]  [color=cyan]Possessed[/color]  [color=yellow]Virile[/color][/sub]
[u]Outer Horror[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Broodmother[/b][/sub]
The mind frays and bends around what it cannot perceive, imagining normalcy to protect itself - in vain. Look away, or be Damned to Madness.
STR [color=green] +++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] +[/color] | CHA [color=green] ++·[/color] | LUC [color=red] ·[/color] | Innate: Ever-Changing
Buffs/Debuffs:[sub]  [color=cyan]Confused[/color]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=yellow]Infected[/color]  [color=cyan]Madness[/color]  [color=white]Mutation[/color]  [color=red]Slimed[/color]  [color=yellow]Virile[/color][/sub]
[u]Oni[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Great brutish demons with a tendency towards hedonism and destruction.
STR [color=green] ++++[/color] | VIT [color=green] +++[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Mighty
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Drunk[/color]  [color=yellow]Fecund[/color]  [color=yellow]Pulverized[/color]  [color=yellow]Virile[/color][/sub]
[u]Nymph[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color][/b][/sub]
Horny humanoid creatures that dwell in the woods and the waters. They have an insatiable sex-drive.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] +·[/color] | Innate: Horny
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=yellow]Futanarification[/color]  [color=pink]Horny[/color][/sub]
[u]Nurse[/u]\t [sub][b]\t [color=white]Support[/color][/b][/sub]
A healer of some kind? The outfit seems out of place...
STR [color=green] ·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=white]First-Aid[/color]  [color=yellow]Sleep[/color][/sub]
[u]Necromancer[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color]\t Converts: Skeleton[/b][/sub]
Mages who desecrate the boundary between life and death, raising fearsome armies of undead minions with their forbidden magic.
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Frail
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=white]Enervated[/color]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=yellow]Freezing[/color]  [color=red]Slow[/color]  [color=yellow]Undead[/color][/sub]
[u]Mystic Knight[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
A champion who merges sword and sorcery in a versatile and powerful combination.
STR [color=green] ++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Magic-Weapon
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Clarity[/color]  [color=orange]Disarmed[/color]  [color=orange]Feeble[/color]  [color=yellow]Silenced[/color]  [color=orange]Strong[/color][/sub]
[u]Moth[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t Converts: Incubator[/b][/sub]
Flying nocturnal insects known for their large beautiful wings and the dust they emit.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] ++[/color] | INT [color=green] +++[/color] | CHA [color=green] +++[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=cyan]Confused[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Sleep[/color]  [color=yellow]Spored[/color][/sub]
[u]Minotaur[/u]\t [sub][b]\t [color=orange]Monster[/color]\t Converts: Cow[/b][/sub]
Big strapping brutes with features of man and bull, their strength and virility are legendary.
STR [color=green] ++++[/color] | VIT [color=green] +++[/color] | DEX [color=green] ·[/color] | INT - | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Mighty
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=yellow]Crushed[/color]  [color=yellow]Fecund[/color]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Pulverized[/color]  [color=yellow]Virile[/color][/sub]
[u]Minion[/u]\t [sub][b]\t [color=red]Unholy[/color][/b][/sub]
Just an average worker for an evil leader. One of the lowest on the foodchain, you can't get more expendable than this.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub]  [color=white]Protected[/color][/sub]
[u]Mindflayer[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color]\t Converts: Thrall[/b][/sub]
Subterranean creatures that feed on the minds of others.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Creepy
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Amnesia[/color]  [color=cyan]Brainwashed[/color]  [color=cyan]Dumb[/color]  [color=white]Egg-Filled[/color]  [color=cyan]Mindbroken[/color][/sub]
[u]Mimic[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
A ravenous monster disguised as a harmless object, usually a treasure chest, that awaits its prey with endless patience.
STR [color=green] +++++[/color] | VIT [color=green] ++·[/color] | DEX - | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Vicious
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=red]Hobbled[/color]  [color=red]Slimed[/color][/sub]
[u]Miko[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
An eccentric priest from the Far East, they use elaborate rituals to appease the spirits present in all things.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] ++[/color] | INT [color=green] +++[/color] | CHA [color=green] +[/color] | LUC [color=green] ++·[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=white]Blessed-Weapon[/color]  [color=green]Blessed[/color]  [color=green]Cursed[/color]  [color=green]Devoted[/color]  [color=green]Favored[/color]  [color=white]Protected[/color][/sub]
[u]Merfolk[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Aquatic monsters with a humanoid upper body and the lower body of a fish.
STR [color=green] +[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Silenced[/color][/sub]
[u]Mecha[/u]\t [sub][b][/b][/sub]
A huge robot weapons platform, used to fight larger than life battles.
STR [color=green] +++·[/color] | VIT [color=green] +++·[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA - | LUC [color=green] +[/color] | Innate: Mega
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Overheated[/color]  [color=white]Overloaded[/color][/sub]
[u]Meatdildo[/u]\t [sub][b][/b][/sub]
A broken, dumb, excuse for a human being with only one use.
STR [color=green] ·[/color] | VIT [color=green] ++++[/color] | DEX [color=green] ·[/color] | INT [color=red] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Horny
Buffs/Debuffs:[sub] N/A[/sub]
[u]Matango[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Spore Zombie[/b][/sub]
Plant-like creatures composed of strange tissue, neither plant nor animal. Whether or not they are dangerous is hard to tell until it's too late.
STR - | VIT [color=green] +++·[/color] | DEX - | INT [color=green] ++++·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Spores
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=cyan]Confused[/color]  [color=yellow]Fecund[/color]  [color=yellow]Infected[/color]  [color=yellow]Infested[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Sleep[/color]  [color=yellow]Spored[/color]  [color=yellow]Virile[/color][/sub]
[u]Master Smith[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
Every hero desires works from a master smith, blacksmiths who have truly made a name for themselves by devoting a lifetime to their craft.
STR [color=green] +++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ·[/color] | INT [color=green] +[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=white]Armor[/color]  [color=white]Honed[/color]  [color=white]Legendary-Armor[/color]  [color=white]Legendary-Weapon[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=white]Reinforced[/color]  [color=white]Weapon[/color][/sub]
[u]Master of Pacts[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=red]Unholy[/color][/b][/sub]
Warlocks of such power and proficiency that exploiting terrible entities for their arcane might has become as easy as breathing.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++++[/color] | CHA [color=green] +++·[/color] | LUC - | Innate: Wicked
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=pink]Captivating[/color]  [color=white]Cursed-Armor[/color]  [color=white]Cursed-Weapon[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=white]Enervated[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=red]Graceful[/color]  [color=orange]Mighty[/color][/sub]
[u]Master Chemist[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t Converts: Homunculus[/b][/sub]
Those who have found the great truth hidden in the physical world and have mastered it through sheer intellect.
STR [color=green] +[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Inspired
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Berserk[/color]  [color=pink]Charmed[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=cyan]Confused[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Hardy[/color]  [color=white]Heal[/color]  [color=white]Miracle-Elixir[/color]  [color=white]Noxious-Concoction[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color]  [color=white]Unlabeled-Potion[/color]  [color=yellow]Virile[/color][/sub]
[u]Master Chef[/u]\t [sub][b]\t [color=white]Support[/color][/b][/sub]
The taste, the presentation, everything about your cooking is five star. People from all over seek you out just to taste your dishes.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++[/color] | CHA [color=green] ++[/color] | LUC - | Innate: Working
Buffs/Debuffs:[sub]  [color=yellow]Bloated[/color]  [color=yellow]Hardy[/color]  [color=pink]Ravenous[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Manticore[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color][/b][/sub]
A great feline beast with wings and a bristling stinging tail full of venom.
STR [color=green] +++[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Vicious
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Fecund[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Virile[/color][/sub]
[u]Maid[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=blue]Evolves[/color][/b][/sub]
A servant wearing a specific type of outfit, which tends to attract a certain kind of people.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Graceful
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]First-Aid[/color][/sub]
[u]Magical Girl[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
A mysterious, magical warrior using holy powers to banish evil for the sake of justice~✩ ...apparently.
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=green]Blessed[/color]  [color=pink]Charmed[/color]  [color=orange]Disarmed[/color]  [color=orange]Feeble[/color][/sub]
[u]Mad Scientist[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t Converts: Chimera[/b][/sub]
Scientific truth is the highest power, it's higher than any vestige of mankind, so you pursue it to your very wit's end - until your humanity washes away.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++++·[/color] | CHA [color=red] -·[/color] | LUC [color=green] ·[/color] | Innate: Madness
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=white]Evolved-Physique[/color]  [color=yellow]Fecund[/color]  [color=white]First-Aid[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Hardy[/color]  [color=white]Mutation[/color]  [color=white]Noxious-Concoction[/color]  [color=white]Overloaded[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color]  [color=yellow]Virile[/color][/sub]
[u]Lycanthrope[/u]\t [sub][b]\t [color=orange]Monster[/color]\t Converts: Lycanthrope[/b][/sub]
Those afflicted with lycanthropy, through disease or curse, assume monstrous forms under the light of the moon.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Evolved-Physique
Buffs/Debuffs:[sub]  [color=green]Cursed[/color]  [color=yellow]Fecund[/color]  [color=yellow]Infected[/color]  [color=yellow]Virile[/color][/sub]
[u]Little Devil[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Imp[/b][/sub]
A high-rank demon, despite its short stature. The deceiving look fits this master trickster that many adventurers have no doubt fallen victim to. Extremely high body temperature due to the infernal energy it's holding.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++[/color] | INT [color=green] +[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Cute
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=pink]Horny[/color]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Virile[/color][/sub]
[u]Lich[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Zombie[/b][/sub]
Cold unfeeling masters of the undead who command eternal life and ultimate power.
STR [color=green] ·[/color] | VIT - | DEX [color=green] ++[/color] | INT [color=green] +++++·[/color] | CHA [color=green] ++[/color] | LUC - | Innate: Undead
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=white]Enervated[/color]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=yellow]Freezing[/color]  [color=red]Slow[/color]  [color=yellow]Undead[/color][/sub]
[u]Leaf Sprite[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Elemental spirits attuned to the power of the wood!
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] +++[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=orange]Entangled[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Lamia[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Enchantingly beautiful creatures with the lower body of a snake.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=pink]Charmed[/color]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Virile[/color][/sub]
[u]Kraken[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color][/b][/sub]
Powerful sea dwellers that are known to haunt the seas and sink ships with their mighty tentacles.
STR [color=green] ++++[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC - | Innate: Slimy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Crushed[/color]  [color=pink]Dirty[/color]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Virile[/color][/sub]
[u]Kobold[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color][/b][/sub]
Small scaly critters, not dissimilar in disposition to goblins.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub]  [color=pink]Dirty[/color][/sub]
[u]Kensai[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
True masters of the blade who have perfected their techniques to the point of transcending mortal limits.
STR [color=green] ++[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: Legendary-Weapon
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Disarmed[/color]  [color=red]Hobbled[/color][/sub]
[u]Jellyfish[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color][/b][/sub]
Translucent beings who sway gracefully through the water - lit by their own dim light. Their bodies course with poison. Not as edible as the name implies!
STR [color=red] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +·[/color] | Innate: Frail
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color][/sub]
[u]Incubus[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color]\t Converts: Cumdump[/b][/sub]
A mid-rank lust demon. Prefers to charm, trick and drain its victims rather than fight directly.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Horny
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=pink]Horny[/color]  [color=yellow]Virile[/color][/sub]
[u]Incubator[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
One that holds unborn offspring for a being, whatever they may be, their body's only purpose is to nourish.
STR [color=green] ·[/color] | VIT [color=green] +++[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Bloated
Buffs/Debuffs:[sub] N/A[/sub]
[u]Idol[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=blue]Evolves[/color]\t Converts: Fan[/b][/sub]
A multi-talented performer. Apparently, their smile is their greatest weapon.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=red]Graceful[/color]  [color=cyan]Inspired[/color][/sub]
[u]Ice Elemental[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Living incarnations of the ice and cold.
STR [color=green] +[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=yellow]Freezing[/color]  [color=yellow]Sleep[/color]  [color=red]Slow[/color][/sub]
[u]Horror[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
It's this bad feeling you can't place. They seem normal, but something about them is just... wrong! Should you really look closer?
STR [color=green] +++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC - | Innate: Creepy
Buffs/Debuffs:[sub]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=white]Fear[/color]  [color=red]Slimed[/color][/sub]
[u]Homunculus[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Alchemically created mimicry of a human. With no soul, does it possess a will?
STR [color=green] ++[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++[/color] | INT [color=green] +·[/color] | CHA [color=green] +[/color] | LUC - | Innate: Perfected-Physique
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=pink]Dirty[/color]  [color=orange]Disarmed[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=white]Mutation[/color]  [color=white]Noxious-Concoction[/color]  [color=white]Overloaded[/color]  [color=white]Unlabeled-Potion[/color][/sub]
[u]Hobgoblin[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Leaders and chieftans amongst goblins, owing to their larger size. Ultimately they are still goblins.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] +[/color] | CHA - | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub]  [color=pink]Dirty[/color]  [color=yellow]Fecund[/color]  [color=yellow]Virile[/color][/sub]
[u]Himbo[/u]\t [sub][b]\t [color=pink]Seducer[/color][/b][/sub]
Scientists have yet to discover whether or not it's due to a mental illness or what, but this sub-species of many beings seem to be the dumbest lifeform in existence.
STR [color=green] +·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ·[/color] | INT [color=red] -·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Bimbofied
Buffs/Debuffs:[sub]  [color=pink]Horny[/color][/sub]
[u]Hero[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t Converts: Party Member[/b][/sub]
The hero of legends, wielding the holy power of the gods. The one prophesized to slay the demon lord.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Chosen
Buffs/Debuffs:[sub]  [color=orange]Disarmed[/color]  [color=yellow]Freezing[/color]  [color=white]Heal[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color][/sub]
[u]Hellhound[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
The trackers and hunters of hell, relentless in their pursuit. They are still good dogs.
STR [color=green] +++[/color] | VIT [color=green] +++[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] +++[/color] | LUC [color=green] ·[/color] | Innate: Fluffy
Buffs/Debuffs:[sub]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=yellow]Overheated[/color]  [color=yellow]Virile[/color][/sub]
[u]Healslut[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=cyan]Holy[/color][/b][/sub]
Mages who pride themselves in caring for others, even if it means going above and beyond their duty, willing to use their body to provide comfort and relief.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ++·[/color] | Innate: Bimbofied
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=pink]Charmed[/color]  [color=white]Heal[/color]  [color=pink]Horny[/color][/sub]
[u]Harpy[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color][/b][/sub]
Half-human, half-bird. Razor-sharp claws.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ++++·[/color] | INT [color=green] ·[/color] | CHA [color=green] +++[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=red]Graceful[/color]  [color=cyan]Inspired[/color][/sub]
[u]Gorgon[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Statue[/b][/sub]
Lamias with the ability to turn people into stone with their baleful gaze.
STR [color=green] +++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++[/color] | INT [color=green] +[/color] | CHA [color=green] ++[/color] | LUC - | Innate: Mighty
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Fecund[/color]  [color=red]Petrified[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Virile[/color][/sub]
[u]Golem[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Ponderous artificial beings crafted from various natural materials.
STR [color=green] +++++[/color] | VIT [color=green] +++++[/color] | DEX [color=red] -·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Clumsy
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Pulverized[/color][/sub]
[u]Goblin[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
A creature weak on its own. In hordes though, they can become troublesome, destroying farms or even villages.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ·[/color] | INT [color=green] +[/color] | CHA - | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub]  [color=pink]Dirty[/color]  [color=yellow]Fecund[/color]  [color=yellow]Virile[/color][/sub]
[u]Giant Rat[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Rodent[/b][/sub]
The one who makes all of the rules.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +++[/color] | INT [color=green] +++[/color] | CHA [color=green] ++[/color] | LUC [color=green] +[/color] | Innate: Bossy
Buffs/Debuffs:[sub]  [color=pink]Dirty[/color]  [color=white]Fear[/color]  [color=yellow]Infected[/color]  [color=yellow]Poisoned[/color]  [color=pink]Ravenous[/color][/sub]
[u]Ghost[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
Spirits that have not yet passed on to the afterlife. Great at pulling pranks.
STR - | VIT [color=red] ---[/color] | DEX [color=green] ++++[/color] | INT [color=green] +++[/color] | CHA [color=green] +++[/color] | LUC - | Innate: Undead
Buffs/Debuffs:[sub]  [color=green]Cursed[/color]  [color=white]Fear[/color]  [color=cyan]Possessed[/color][/sub]
[u]Gazer[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Statue[/b][/sub]
Wicked beings with a manyfold gaze, each eye they posess carries a different magic power.
STR [color=green] +[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC - | Innate: Captivating
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=cyan]Confused[/color]  [color=cyan]Dizzy[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=white]Noxious-Concoction[/color]  [color=red]Paralyzed[/color]  [color=red]Petrified[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=red]Slow[/color]  [color=yellow]Virile[/color][/sub]
[u]Gargoyle[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
An ordinary stone statue with the visage of a monster that [b]definitely[/b] didn't just move when you weren't looking.
STR [color=green] +++[/color] | VIT [color=green] ++++[/color] | DEX - | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Petrified
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Fear[/color]  [color=red]Immobile[/color]  [color=red]Petrified[/color][/sub]
[u]Gambler[/u]\t [sub][b][/b][/sub]
Leaves everything to chance, yet seems to always come out on top in the end.
[sup]Special Trait: Randomized stat growths.[/sup]
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ++[/color] | Innate: Lucky
Buffs/Debuffs:[sub]  [color=green]Lucky[/color]  [color=green]Unlucky[/color][/sub]
[u]Galactic Tyrant[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
A warlord from another world seeking to rule, psychic dominator.
STR [color=green] ++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Evolved-Physique
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Infected[/color]  [color=white]Irradiated[/color]  [color=white]Overloaded[/color]  [color=yellow]Virile[/color][/sub]
[u]Frog[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Ribbit.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Slimy
Buffs/Debuffs:[sub] N/A[/sub]
[u]Fox[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
A being with fox-like features. Strangely, hard to draw your eyes away from.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Fluffy
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color][/sub]
[u]Forest Elemental[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Living incarnations of the forest.
STR [color=green] +[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=orange]Entangled[/color]  [color=yellow]Infested[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Foreign God[/u]\t [sub][b]\t [color=cyan]Holy[/color][/b][/sub]
A divine being who presides over another realm. Their power, while still formidable, is diminished here.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Diminished-Divinity
Buffs/Debuffs:[sub]  [color=white]Blessed-Armor[/color]  [color=white]Blessed-Weapon[/color]  [color=green]Blessed[/color]  [color=white]Boon[/color]  [color=green]Chosen[/color]  [color=green]Cursed[/color]  [color=green]Devoted[/color]  [color=green]Favored[/color][/sub]
[u]Fisherman[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=yellow]Grinder[/color][/b][/sub]
Fabled for their sheer speed - but who can blame them? They have fish to catch.
STR [color=green] +·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=pink]Charmed[/color]  [color=orange]Entangled[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Fire Elemental[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Living incarnations of fire.
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=green]Doomed[/color]  [color=white]Fear[/color]  [color=yellow]Overheated[/color][/sub]
[u]Feline[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Those with cat-like features or have characteristics of a cat. Always land on their feet.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +[/color] | CHA [color=green] ++[/color] | LUC [color=green] ++[/color] | Innate: Fluffy
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color][/sub]
[u]Fan[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color]\t [color=blue]Evolves[/color][/b][/sub]
Supports and loves someone one-sidedly, expecting little or nothing in return. Simply being able to show their devotion is enough for them.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Annoying
Buffs/Debuffs:[sub] N/A[/sub]
[u]False Prophet[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=white]Support[/color]\t [color=red]Unholy[/color]\t Converts: Cultist[/b][/sub]
A crazed lunatic spouting nonsense about gods that do not exist. Keep your distance.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++++[/color] | CHA [color=green] +++·[/color] | LUC [color=red] ·[/color] | Innate: Madness
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=cyan]Clarity[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=white]Ever-Changing[/color]  [color=yellow]Fecund[/color]  [color=cyan]Madness[/color]  [color=yellow]Virile[/color][/sub]
[u]Fae[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color][/b][/sub]
Entities that hail from a magical realm of pure natural chaos. They are often as beautiful as they are terrifying.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++++[/color] | LUC [color=green] ++·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=white]Boon[/color]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Sleep[/color][/sub]
[u]Executioner[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
When faced with the wicked the executioner's response is simple. Off with their head.
STR [color=green] ++[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Condemned[/color]  [color=green]Doomed[/color]  [color=yellow]Silenced[/color][/sub]
[u]Eros[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color]\t Converts: Cupid[/b][/sub]
Powerful cupids who possess mastery over the emotions and desires of mortals.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ++·[/color] | Innate: Cute
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=green]Blessed[/color]  [color=pink]Charmed[/color]  [color=yellow]Fecund[/color]  [color=pink]Horny[/color]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Virile[/color][/sub]
[u]Elemental[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Living incarnations of the elements. Comes in multiple flavors.
STR [color=green] +[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Freezing[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color][/sub]
[u]Elder Vampire[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Bloodkin[/b][/sub]
Vampires of the old blood, the immortal ichor in their veins holds great power.
STR [color=green] +·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++[/color] | INT [color=green] +++[/color] | CHA [color=green] +++[/color] | LUC - | Innate: Undead
Buffs/Debuffs:[sub]  [color=cyan]Brainwashed[/color]  [color=pink]Charmed[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color]  [color=yellow]Infected[/color][/sub]
[u]Elder Brain[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Mindflayer[/b][/sub]
The final stage in a mindflayer's life cycle, Elder Brains give up the ability to move about freely in return for godlike intellect.
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX - | INT [color=green] +++++[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Slimy
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Amnesia[/color]  [color=cyan]Brainwashed[/color]  [color=cyan]Dizzy[/color]  [color=cyan]Dumb[/color]  [color=white]Egg-Filled[/color]  [color=cyan]Mindbroken[/color]  [color=white]Overloaded[/color][/sub]
[u]Earth Elemental[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Living incarnations of the element of earth.
STR [color=green] +·[/color] | VIT [color=green] +++[/color] | DEX - | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=cyan]Confused[/color]  [color=yellow]Crushed[/color]  [color=pink]Dirty[/color][/sub]
[u]Dungeon Core[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Goblin[/b][/sub]
The heart of a dungeon, a mind that designs monsters and labyrinthine corridors to claim mortal lives. Created by the fiendish to harvest power, but perversely beloved by the gods for serving as trials to their heroes.
STR - | VIT [color=green] ++[/color] | DEX - | INT [color=green] ++++[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +·[/color] | Innate: Perfected-Mind
Buffs/Debuffs:[sub]  [color=white]Boon[/color]  [color=cyan]Clarity[/color]  [color=green]Devoted[/color]  [color=white]Heal[/color]  [color=white]Honed[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=white]Questing[/color][/sub]
[u]Dullahan[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Dullahan[/b][/sub]
Headless spirits of the damned, they wander the world to claim heads and condemn others to share their fate.
STR [color=green] +++[/color] | VIT [color=green] +++[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Undead
Buffs/Debuffs:[sub]  [color=green]Cursed[/color]  [color=green]Doomed[/color]  [color=white]Fear[/color][/sub]
[u]Draincubus[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Thrall[/b][/sub]
A high-rank lust demon. The evolved form of a succubus, with a special tail capable of sucking fluids or even lifeforce with its tip.
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ++[/color] | CHA [color=green] ++++[/color] | LUC [color=green] ·[/color] | Innate: Horny
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=pink]Horny[/color]  [color=yellow]Virile[/color][/sub]
[u]Drain Slime[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Slime[/b][/sub]
A unique slime with a darker, more ominous color. Specializes in aggressively draining their victims of their fluids and lifeforce.
STR [color=green] ++[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Slimy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=white]Egg-Filled[/color]  [color=white]Enervated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=red]Slimed[/color][/sub]
[u]Dragon[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Charismatic and cunning hoarders of treasure.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Mighty
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Fecund[/color]  [color=yellow]Freezing[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Virile[/color][/sub]
[u]Doll[/u]\t [sub][b]\t [color=pink]Seducer[/color][/b][/sub]
A hand-crafted puppet, often tethered to the strings of a master, or seemingly alive by magic.
STR [color=green] +·[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] +[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Creepy
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]Fear[/color]  [color=cyan]Possessed[/color][/sub]
[u]Djinn[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color][/b][/sub]
Often found in lamps, rings, and bottles, these powerful elemental spirits are known to grant boons to those who ensnare them- but be careful what you wish for.
STR [color=green] +[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +[/color] | Innate: Clever
Buffs/Debuffs:[sub]  [color=white]Boon[/color]  [color=orange]Bound[/color]  [color=pink]Captivating[/color]  [color=pink]Charmed[/color]  [color=white]Cursed-Armor[/color]  [color=white]Cursed-Weapon[/color]  [color=green]Cursed[/color]  [color=green]Doomed[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=red]Graceful[/color]  [color=white]Great-Boon[/color]  [color=cyan]Inspired[/color]  [color=orange]Mighty[/color]  [color=yellow]Stalwart[/color]  [color=yellow]Virile[/color][/sub]
[u]Devout[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color]\t Converts: Acolyte[/b][/sub]
Those driven mad with worship for their unseen, holy, lord of Order. Very little of their original being preserve onward as they give their all to their God. Existing to spread their faith to all who might listen; as well as those who refuse.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=red] ·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ++++[/color] | Innate: Devoted
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Devoted[/color]  [color=green]Favored[/color]  [color=green]Righteous[/color][/sub]
[u]Desperado[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
Legendary gunslingers, when they reach for their holster people hit the floor- most don't get back up.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Lucky
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Disarmed[/color]  [color=red]Hobbled[/color]  [color=yellow]Silenced[/color][/sub]
[u]Demon[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color]\t Converts: Cultist[/b][/sub]
The rightful denizens of Hell, or similar evil realms. Their existences are steeped in sin and darkness.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] +[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Wicked
Buffs/Debuffs:[sub]  [color=pink]Captivating[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=green]Doomed[/color]  [color=yellow]Fecund[/color]  [color=cyan]Inspired[/color]  [color=orange]Mighty[/color]  [color=yellow]Virile[/color]  [color=green]Wicked[/color][/sub]
[u]Demon Hunter[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
Exterminators of the wicked and the damned who hold righteous causes in their heart.
STR [color=green] ++·[/color] | VIT [color=green] +[/color] | DEX [color=green] ++·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +·[/color] | Innate: Blessed-Weapon
Buffs/Debuffs:[sub]  [color=green]Condemned[/color]  [color=orange]Feeble[/color][/sub]
[u]Cursed Sword[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Cursed Sword[/b][/sub]
A living weapon that stokes its wielder's bloodlust, until they lose themselves completely.
STR [color=green] ++++·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++·[/color] | INT - | CHA [color=green] +[/color] | LUC - | Innate: Cursed-Weapon
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Cursed-Weapon[/color]  [color=green]Cursed[/color]  [color=orange]Disarmed[/color]  [color=white]Honed[/color]  [color=white]Magic-Weapon[/color]  [color=cyan]Possessed[/color][/sub]
[u]Cursed Armor[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: Cursed Armor[/b][/sub]
A living suit of armor that siphons its victim's life force away, taking pieces of them with it.
STR [color=green] ++++[/color] | VIT [color=green] ++++[/color] | DEX [color=green] ·[/color] | INT - | CHA [color=green] +[/color] | LUC - | Innate: Cursed-Armor
Buffs/Debuffs:[sub]  [color=white]Cursed-Armor[/color]  [color=green]Cursed[/color]  [color=white]Magic-Armor[/color]  [color=red]Paralyzed[/color]  [color=cyan]Possessed[/color]  [color=white]Protected[/color]  [color=yellow]Silenced[/color][/sub]
[u]Cumdump[/u]\t [sub][b]\t [color=pink]Seducer[/color][/b][/sub]
Smelly, often messy and pathetic beings. Their very existence seems to scream 'please rape me'.
STR [color=green] ·[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Bukkaked
Buffs/Debuffs:[sub]  [color=pink]Horny[/color][/sub]
[u]Cultist[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Mysterious robed figures that are rarely seen in public, keeping their faces hidden to remain anonymous.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Madness
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Clarity[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color][/sub]
[u]Crab[/u]\t [sub][b]\t [color=orange]Monster[/color]\t Converts: Crab[/b][/sub]
Hard shells, big meaty claws - do they even have any weak points?
STR [color=green] +[/color] | VIT [color=green] ++++++[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +·[/color] | Innate: Hardy
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Cow[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color]\t [color=orange]Monster[/color][/b][/sub]
An animal. Cattle. Livestock. Only good for its milk, if even that.
STR [color=green] +[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Milky
Buffs/Debuffs:[sub]  [color=yellow]Fecund[/color]  [color=yellow]Hardy[/color]  [color=cyan]Milk-Addicted[/color]  [color=orange]Strong[/color]  [color=yellow]Virile[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Combat Maid[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=green]Adventurer[/color][/b][/sub]
A servant wearing a specific type of outfit, yet specializing in fighting as well. An odd combination, but perhaps it has its perks?
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ·[/color] | Innate: Graceful
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]First-Aid[/color]  [color=white]Honed[/color]  [color=white]Protected[/color][/sub]
[u]Clown[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=red]Unholy[/color][/b][/sub]
A type of performer, though they incite fear in the hearts of many for some unknown reason.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] ++·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Clumsy
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Berserk[/color]  [color=red]Clumsy[/color]  [color=cyan]Confused[/color]  [color=white]Fear[/color]  [color=yellow]Infected[/color][/sub]
[u]Citizen But Better[/u]\t [sub][b]\t [color=blue]Evolves[/color][/b][/sub]
Plain old citizen. Or young citizen. Probably young, since it's better than the usual one? Old people are all cranky after all, and weak. Something to do with the bones becoming frail. I think the word is atrophy? Well, atrophy refers to all of the body growing weaker, though, not just the bones. But yeah, young citizens are better than old, unless they are TOO young. Children aren't much good for anything, after all. Loud and constantly whining, stupid too. They should just stay at school and learn to be proper adults, so they can be proper citizens. Not too old, not too young, y'know? Not that the gap between too young and too old is small by any means. Either way, we can't go too deep into detail with that one, or people that are just a bit too young or just a bit too old will get angry and explain why they're still healthy enough or already smart enough... Really, that's EXACTLY why people don't like you senile people and snot-nosed brats! See, it's like with breasts. They need to be big enough, but not too big. Small ones are fine too, but there has to be something to really [i]grab[/i], yeah? It's not enough to just feel it, you have to [b]feel[/b] it. Then again, that reference might be hard to get if you lack the experience. Maybe use your imagination? Imagination is a powerful tool, after all. Anyone can feel a bit better and stronger about themselves if they can use it efficiently. Imagine you're just a normal citizen, for example. But add a pinch of imagination, and you can be something [i]better[/i]. Like, for example... well, you know. A citizen, but [b]better[/b]. Pretty great, huh?
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Boring
Buffs/Debuffs:[sub] N/A[/sub]
[u]Citizen But Better With Sunglasses[/u]\t [sub][b]\t [color=pink]Seducer[/color][/b][/sub]
So cool...
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Cool
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color][/sub]
[u]Chimera[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
Blasphemous creations of mad alchemy and twisted magic that combine several beasts into one.
[sup]Special Trait: Randomized physical growth.[/sup]
STR - | VIT - | DEX - | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=red] -·[/color] | Innate: Evolved-Physique
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Fecund[/color]  [color=orange]Feeble[/color]  [color=yellow]Freezing[/color]  [color=red]Hobbled[/color]  [color=white]Mutation[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Virile[/color][/sub]
[u]Cheshire[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color][/b][/sub]
Strange and almost alien entities that wear the familiar shape of a feline, their stripes confound as much as their words.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +++[/color] | LUC [color=green] ++·[/color] | Innate: Madness
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=cyan]Dizzy[/color]  [color=cyan]Inspired[/color]  [color=cyan]Madness[/color]  [color=green]Unlucky[/color][/sub]
[u]Cheerleader[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t Converts: Cheerleader[/b][/sub]
A sort of dancer specializing in boosting allies' morale. Their outfits seem to boost morale in a way, too.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=pink]Charmed[/color]  [color=pink]Horny[/color]  [color=orange]Strong[/color][/sub]
[u]Champion[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
The epitome of righteous justice, a blade to destroy all that is wicked.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] ++[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=white]Blessed-Weapon[/color]  [color=green]Blessed[/color]  [color=green]Condemned[/color]  [color=green]Devoted[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=white]Heal[/color]  [color=white]Protected[/color][/sub]
[u]Cervine[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
A deer. or something like it. Watch out for hunters.
STR [color=green] +[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Horny
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color][/sub]
[u]Centaur[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
The upper body of a human, the lower body of a horse. They embody the swiftness and heartiness of a beast and the nobility of mankind.
STR [color=green] ++[/color] | VIT [color=green] +++·[/color] | DEX [color=green] ++[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Hardy
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=yellow]Fecund[/color]  [color=yellow]Virile[/color][/sub]
[u]Casino Bunny[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=blue]Evolves[/color][/b][/sub]
An employee of a casino, wearing a rather revealing attire to attract customers, or distract them from their games.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Lucky
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=yellow]Drunk[/color]  [color=green]Lucky[/color]  [color=green]Unlucky[/color][/sub]
[u]Canine[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
People that resemble dogs, or are in fact, dogs. They have a great sense of smell!
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Fluffy
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=yellow]Fecund[/color][/sub]
[u]Bunny[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color][/b][/sub]
Long ears and a cute little fluffy tail, who doesn't love a bunny?
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ++·[/color] | Innate: Fluffy
Buffs/Debuffs:[sub]  [color=green]Lucky[/color][/sub]
[u]Bully[/u]\t [sub][b]\t Converts: Punching Bag[/b][/sub]
A total asshole enjoying the suffering of others. Probably has some sorta daddy issues and a low self-esteem... but that won't stop them from doing whatever they want.
STR [color=green] +++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Rude
Buffs/Debuffs:[sub]  [color=white]Fear[/color][/sub]
[u]Broodmother[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color][/b][/sub]
That swollen belly and leaky tits are basically permanent fixtures at this point. Seriously, when are they NOT pregnant?
STR [color=green] +[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +·[/color] | Innate: Fecund
Buffs/Debuffs:[sub]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Virile[/color][/sub]
[u]Bloodkin[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Tied by blood to an elder vampire, even if weakly. They have the potential to become vampiric creatures themselves.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Undead
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color][/sub]
[u]Bloodbank[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color][/b][/sub]
A bloodsucking beast's unlucky victim, marked for future use.
STR [color=green] +[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] +[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Devoted
Buffs/Debuffs:[sub]  [color=yellow]Bloated[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Blood Knight[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=green]Adventurer[/color]\t [color=red]Unholy[/color][/b][/sub]
Psychopaths on a carnal rampage, yet even in their bloodlust they retain a certain knightly stature.
STR [color=green] +++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] +[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Wicked
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Cursed-Armor[/color]  [color=white]Cursed-Weapon[/color]  [color=green]Cursed[/color]  [color=orange]Disarmed[/color]  [color=white]Enervated[/color]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=red]Hobbled[/color][/sub]
[u]Blessed Tail[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color][/b][/sub]
Woah! It's so soft! Fluffy... Warm. Touching it makes you feel really lucky! There's even a fox attached. 
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] ++[/color] | INT [color=green] ++[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +++[/color] | Innate: Irresistible
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=green]Lucky[/color]  [color=green]Unlucky[/color][/sub]
[u]Bishop[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=cyan]Holy[/color]\t Converts: Priest[/b][/sub]
Wise priests whose mastery of scripture has elevated them to high office.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++++[/color] | CHA [color=green] ·[/color] | LUC [color=green] +++[/color] | Innate: Favored
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Condemned[/color]  [color=green]Devoted[/color]  [color=white]Heal[/color]  [color=green]Righteous[/color]  [color=yellow]Silenced[/color][/sub]
[u]Bimboslime[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Slimebimbo[/b][/sub]
A slime with no proper thoughts, although their 'personality' - or whatever else their actions are driven by - can be summed up by the word 'slutty'. The pink color and sweet strawberry scent makes it seem fairly harmless, but it's infamous for its insatiable hunger for intelligence - devouring brains that is, NOT studying to become smart.
STR [color=green] ·[/color] | VIT [color=green] ++++·[/color] | DEX [color=green] ·[/color] | INT [color=red] ·[/color] | CHA [color=green] +++++[/color] | LUC [color=green] ·[/color] | Innate: Slimy
Buffs/Debuffs:[sub]  [color=cyan]Bimbofied[/color]  [color=cyan]Bimboslimed[/color]  [color=orange]Bound[/color]  [color=red]Slimed[/color][/sub]
[u]Bimbo[/u]\t [sub][b]\t [color=pink]Seducer[/color][/b][/sub]
Scientists have yet to discover whether or not it's due to a mental illness or what, but this sub-species of many beings seem to be the dumbest lifeform in existence.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=red] -·[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Bimbofied
Buffs/Debuffs:[sub]  [color=pink]Horny[/color][/sub]
[u]Berserker[/u]\t [sub][b]\t [color=green]Adventurer[/color][/b][/sub]
A seasoned warrior who fights with no sense of self-preservation.
STR [color=green] +++++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT - | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Berserk
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=red]Hobbled[/color]  [color=orange]Strong[/color][/sub]
[u]Bee[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Flying insects that collect pollen and make honey, they serve their queen without question. They have a powerful sting.
STR [color=green] ++[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=white]Egg-Filled[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Beast Tamer[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=orange]Monster[/color]\t Converts: Tamed Beast[/b][/sub]
One that doesn't fight their battles on their own, but with a tamed creature by their side.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] +·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=orange]Bound[/color]  [color=pink]Charmed[/color][/sub]
[u]Bandit[/u]\t [sub][b][/b][/sub]
Low-lives, scheming bandits. Usually end up as fodder for a growing hero. But there are some exceptions...
STR [color=green] +·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub] N/A[/sub]
[u]Automaton[/u]\t [sub][b][/b][/sub]
Perpetual entities motivated by various technologies, they lack the spark of life.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Irradiated[/color][/sub]
[u]Athlete[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=yellow]Grinder[/color]\t Converts: Cheerleader[/b][/sub]
No description available.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Evolved-Physique
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=yellow]Crushed[/color]  [color=green]Favored[/color]  [color=cyan]Inspired[/color][/sub]
[u]Assassin[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color][/b][/sub]
Expert killers. For a true assassin no weapon is off limits, and all arts are killing arts.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] ++++[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Honed
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=orange]Disarmed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color][/sub]
[u]Ash Sprite[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
Elemental spirits attuned to the power of heat and ash!
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +++[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=white]Fear[/color]  [color=yellow]Overheated[/color][/sub]
[u]Artificial Intelligence[/u]\t [sub][b][/b][/sub]
Electronic entities who inhabit cyberspace, with forms comprised of pure information.
STR - | VIT - | DEX [color=green] +++·[/color] | INT [color=green] ++++[/color] | CHA [color=green] +·[/color] | LUC - | Innate: Perfected-Mind
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=cyan]Clarity[/color]  [color=cyan]Confused[/color]  [color=cyan]Dumb[/color]  [color=pink]Horny[/color]  [color=white]Overloaded[/color][/sub]
[u]Artificer[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color][/b][/sub]
True masters of the mechanical, the things they create shape history even long after they depart the world.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] +++·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +·[/color] | Innate: Inspired
Buffs/Debuffs:[sub]  [color=white]Armor[/color]  [color=white]Honed[/color]  [color=white]Irradiated[/color]  [color=white]Legendary-Armor[/color]  [color=white]Legendary-Weapon[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=white]Overloaded[/color]  [color=white]Reinforced[/color]  [color=white]Weapon[/color][/sub]
[u]Archwizard[/u]\t [sub][b]\t [color=green]Adventurer[/color][/b][/sub]
Genius Savants that have unlocked the deepest secrets of magic. Their sheer knowledge of the mystic arts is unrivaled.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +++++[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Feeble
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Confused[/color]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=yellow]Freezing[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Overheated[/color]  [color=yellow]Sleep[/color]  [color=red]Slow[/color][/sub]
[u]Archdemon[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
A high-ranking denizen of the underworld, proven their worth through countless battles or other such acts benefitting their side.
STR [color=green] +++[/color] | VIT [color=green] +++[/color] | DEX [color=green] +++[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=red] -[/color] | Innate: Wicked
Buffs/Debuffs:[sub]  [color=pink]Captivating[/color]  [color=yellow]Crushed[/color]  [color=white]Cursed-Armor[/color]  [color=white]Cursed-Weapon[/color]  [color=green]Cursed[/color]  [color=green]Damned[/color]  [color=green]Doomed[/color]  [color=white]Enervated[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=cyan]Inspired[/color]  [color=orange]Mighty[/color]  [color=orange]Powerless[/color]  [color=pink]Ruined[/color]  [color=yellow]Virile[/color]  [color=green]Wicked[/color][/sub]
[u]Archangel[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color]\t Converts: Angel[/b][/sub]
The leaders amongst the host of heaven, whose great power shakes the hearts of even the mightiest demons.
STR [color=green] +[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +++·[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Chosen[/color]  [color=green]Condemned[/color]  [color=green]Devoted[/color]  [color=green]Favored[/color]  [color=red]Graceful[/color]  [color=white]Heal[/color]  [color=cyan]Inspired[/color]  [color=orange]Mighty[/color]  [color=white]Miracle[/color]  [color=green]Righteous[/color]  [color=yellow]Stalwart[/color][/sub]
[u]Arachne[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Incubator[/b][/sub]
Weavers of webs and silk to trap unfortunate souls.
STR [color=green] +++[/color] | VIT [color=green] +[/color] | DEX [color=green] +++[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC - | Innate: Creepy
Buffs/Debuffs:[sub]  [color=orange]Bound[/color]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=white]Fear[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color][/sub]
[u]Angel[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color]\t Converts: Priest[/b][/sub]
Holy messengers of the gods, helping in the eternal war against the demonic forces of hell.
STR [color=green] +[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ++[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++·[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Condemned[/color]  [color=green]Devoted[/color]  [color=green]Favored[/color]  [color=red]Graceful[/color]  [color=white]Heal[/color]  [color=yellow]Stalwart[/color][/sub]
[u]Android[/u]\t [sub][b][/b][/sub]
A mechanical replica of a person, artificial but so close to real it's hard to tell the difference at a glance.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] ++[/color] | CHA [color=green] +[/color] | LUC - | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Overloaded[/color]  [color=red]Paralyzed[/color][/sub]
[u]Ancient Dragon[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
As dragons grow in age they grow in power, and as they grow in power so do the size of their hoards increase.
STR [color=green] +++·[/color] | VIT [color=green] +++[/color] | DEX [color=green] ·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Mighty
Buffs/Debuffs:[sub]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=yellow]Freezing[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Pulverized[/color]  [color=yellow]Virile[/color][/sub]
[u]Alraune[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color]\t Converts: Spore Zombie[/b][/sub]
Plant monsters that often possess dexterous vines and poisonous pollen with various effects.
STR [color=green] ·[/color] | VIT [color=green] +++·[/color] | DEX - | INT [color=green] ++[/color] | CHA [color=green] +++·[/color] | LUC [color=green] ·[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Sleep[/color]  [color=yellow]Spored[/color][/sub]
[u]Alien[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=blue]Evolves[/color][/b][/sub]
An extraterrestrial creature. The first contact may very well determine whether they be friend or foe.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Evolved-Physique
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=white]Egg-Filled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Infected[/color]  [color=yellow]Virile[/color][/sub]
[u]Air Elemental[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
Living incarnations of air and lightning.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +++[/color] | INT [color=green] +++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ++[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Dizzy[/color]  [color=red]Paralyzed[/color][/sub]
[u]Acolyte[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Strange, mask wearing, nuns with a strangely wide smile across their faces at all times. Due to their identical outfits, similar expressions, and obscured eyes they can be difficult to tell apart.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +++·[/color] | Innate: Devoted
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Righteous[/color][/sub]
[u]Abyss Knight[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=red]Unholy[/color][/b][/sub]
A great knight who has mastered the dark arts to imbue and enhance their fighting prowess.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=red] ·[/color] | Innate: Magic-Weapon
Buffs/Debuffs:[sub]  [color=orange]Disarmed[/color]  [color=yellow]Freezing[/color]  [color=white]Heal[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color][/sub]
[u]Wizard[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
Practisers of magic, always seeking to achieve greater heights with the arcane.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++++·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Weak
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Confused[/color]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Overheated[/color]  [color=yellow]Sleep[/color]  [color=red]Slow[/color][/sub]
[u]Witch[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=green]Adventurer[/color][/b][/sub]
Wizard, except a hot MILF enjoying peaceful life in a forest hut rather than a crazy old man alone in his tower.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=yellow]Fecund[/color]  [color=white]First-Aid[/color]  [color=white]Frog[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=pink]Horny[/color]  [color=white]Noxious-Concoction[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=white]Unlabeled-Potion[/color]  [color=yellow]Virile[/color][/sub]
[u]Warrior[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
A fighter specializing in reckless melee combat.
STR [color=green] +++[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Mighty
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=orange]Disarmed[/color]  [color=orange]Strong[/color][/sub]
[u]Warlock[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=green]Adventurer[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Mages who indulge in powers from beyond the pale and strike foul deals with powerful beings.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +[/color] | INT [color=green] +++·[/color] | CHA [color=green] ++·[/color] | LUC - | Innate: Wicked
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=green]Cursed[/color]  [color=orange]Feeble[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color][/sub]
[u]Tourist[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=green]Adventurer[/color][/b][/sub]
Some manner of adventurer, perhaps...? Weak in combat, but loves all kinds of activities and trying out new things.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Annoying
Buffs/Debuffs:[sub] N/A[/sub]
[u]Thief[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=blue]Evolves[/color][/b][/sub]
Often frowned upon for their profession, but extremely useful to have around when the need arises.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: Agile
Buffs/Debuffs:[sub]  [color=orange]Disarmed[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color][/sub]
[u]Spellsword[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
A warrior combining martial might and magical knowledge.
STR [color=green] ++[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Magic-Weapon
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=orange]Disarmed[/color]  [color=orange]Feeble[/color]  [color=yellow]Silenced[/color][/sub]
[u]Soldier[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
Recruited as an expendable asset, they come in many but are usually average at best
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub] N/A[/sub]
[u]Scientist[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=blue]Evolves[/color][/b][/sub]
Nerds. The nerdiest of nerds that have ever nerded.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] +++·[/color] | CHA [color=red] -[/color] | LUC [color=green] ·[/color] | Innate: Boring
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=yellow]Fecund[/color]  [color=white]First-Aid[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Hardy[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color]  [color=yellow]Virile[/color][/sub]
[u]Samurai[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
Knights of the far east, who wield their swords with both skill and grace
STR [color=green] ++[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Honed
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Disarmed[/color]  [color=red]Hobbled[/color][/sub]
[u]Ranger[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
A bow user that relies on their dexterity to keep their distance and manuever around while scouting over a target
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] ++[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Agile
Buffs/Debuffs:[sub]  [color=orange]Entangled[/color]  [color=red]Hobbled[/color]  [color=yellow]Poisoned[/color][/sub]
[u]Prostitute[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color][/b][/sub]
A risky profession where looks are everything.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] ·[/color] | CHA [color=green] +++[/color] | LUC [color=green] ·[/color] | Innate: Horny
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=pink]Horny[/color][/sub]
[u]Professor[/u]\t [sub][b]\t [color=white]Support[/color]\t Converts: Student[/b][/sub]
Teachers with a wide variety of expertise.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +++[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=cyan]Clarity[/color]  [color=cyan]Inspired[/color][/sub]
[u]Priest[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color]\t Converts: Nun[/b][/sub]
Bearers of the holy word, they bring the grace of the gods to the world with their teachings.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ·[/color] | INT [color=green] +++[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Devoted[/color]  [color=green]Righteous[/color][/sub]
[u]Playboy[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t Converts: Prostitute[/b][/sub]
Flirty, often annoying people who seem to only care about looks and results.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] +[/color] | INT [color=green] +[/color] | CHA [color=green] +++[/color] | LUC [color=green] ·[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=cyan]Bimbofied[/color]  [color=pink]Charmed[/color][/sub]
[u]Paladin[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Righteous knights who serve good itself, smiting their foes with divine magic.
STR [color=green] +·[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +·[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Devoted[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=white]Protected[/color][/sub]
[u]Nun[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=cyan]Holy[/color][/b][/sub]
The 'chaste' and humble servants of the gods, who spend their lives in deep prayer.
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ·[/color] | INT [color=green] ++[/color] | CHA [color=green] +[/color] | LUC [color=green] ++[/color] | Innate: Devoted
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=green]Devoted[/color]  [color=green]Righteous[/color][/sub]
[u]Noble[/u]\t [sub][b]\t [color=blue]Evolves[/color]\t Converts: Maid[/b][/sub]
Mostly useless in combat, yet vital in political intrigue.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +[/color] | Innate: Wealthy
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=white]Questing[/color][/sub]
[u]Ninja[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=blue]Evolves[/color][/b][/sub]
Warriors of shadow steeped in folk lore. Who knows what they are truly capable of?
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] ++·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Agile
Buffs/Debuffs:[sub]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color][/sub]
[u]Monk[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
Holy warriors who seek physical and spiritual perfection.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++·[/color] | INT [color=green] +·[/color] | CHA - | LUC - | Innate: Graceful
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Clarity[/color]  [color=yellow]Frail[/color]  [color=red]Paralyzed[/color][/sub]
[u]Mommy[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color][/b][/sub]
It's not adventuring by any metric, but being a mom has its own challenges for sure. The power of a motherly smile, or figure, isn't to be reckoned with!
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Fecund
Buffs/Debuffs:[sub]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Merchant[/u]\t [sub][b]\t [color=yellow]Grinder[/color][/b][/sub]
Collectors of curiosa, selling anything from everyday items to ancient artifacts. Many start out humble, travelling great distances for the sake of their trade, in order to one day settle down and set up their own shop or company.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] ·[/color] | INT [color=green] ++[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Wealthy
Buffs/Debuffs:[sub]  [color=white]Armor[/color]  [color=white]First-Aid[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=white]Unlabeled-Potion[/color]  [color=white]Weapon[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Knight[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Squire[/b][/sub]
Heavily armored and skilled at arms, the knight is the classic gallant hero.
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Stalwart
Buffs/Debuffs:[sub]  [color=orange]Disarmed[/color]  [color=yellow]Hardy[/color]  [color=white]Protected[/color][/sub]
[u]Inquisitor[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color][/b][/sub]
High-ranking members of holy organisations who hunt down heretics.
STR [color=green] +·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +·[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=green]Condemned[/color]  [color=yellow]Silenced[/color][/sub]
[u]Imp[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color][/b][/sub]
A low-rank lust demon. Generally weak, but prone to trick adventurers in order to drain them.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Cute
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=green]Cursed[/color]  [color=yellow]Fecund[/color]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Virile[/color][/sub]
[u]Healer[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color][/b][/sub]
Mages who have taken vows against harm, empowering their ability to heal others.
STR - | VIT [color=green] ++·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=yellow]Hardy[/color]  [color=white]Heal[/color][/sub]
[u]Gunslinger[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
Those who thought bows were overrated and used guns instead. Ahead of their time, one could say.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ++·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Lucky
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Disarmed[/color]  [color=red]Hobbled[/color][/sub]
[u]Fighter[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
No tricks, no gimmicks, just pure martial skill at arms. A real fighter needs nothing else.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Strong
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Disarmed[/color]  [color=white]Protected[/color]  [color=orange]Strong[/color][/sub]
[u]Fencer[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
A swordsman who focuses on supreme technique and speed, striking when the time is right.
STR [color=green] +[/color] | VIT [color=green] +[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Agile
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=orange]Disarmed[/color][/sub]
[u]Farmer[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t Converts: Pig[/b][/sub]
Used to working hard every day, no matter the weather.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=yellow]Well-Fed[/color][/sub]
[u]Engineer[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color][/b][/sub]
Tinkers who innovate and invent mechanical solutions to their problems with ingenuity instead of brute force.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++[/color] | INT [color=green] ++·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Clarity
Buffs/Debuffs:[sub]  [color=white]Armor[/color]  [color=white]Honed[/color]  [color=white]Overloaded[/color]  [color=white]Reinforced[/color]  [color=white]Weapon[/color][/sub]
[u]Druid[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color][/b][/sub]
Priests and protectors of the wilds, they wield the power of nature and assume the forms of great beasts.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] +[/color] | INT [color=green] +·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +·[/color] | Innate: One With Nature
Buffs/Debuffs:[sub]  [color=orange]Entangled[/color]  [color=white]First-Aid[/color]  [color=red]Graceful[/color]  [color=yellow]Infested[/color]  [color=orange]Mighty[/color]  [color=yellow]Stalwart[/color][/sub]
[u]Dancer[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t Converts: Fan[/b][/sub]
Entertainers with impressive control over their body.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ·[/color] | Innate: Captivating
Buffs/Debuffs:[sub]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=cyan]Dizzy[/color]  [color=pink]Horny[/color]  [color=yellow]Sleep[/color][/sub]
[u]Cupid[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Low-rank angels that love to mess with the feelings of mortals, especially when it comes to love.
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++[/color] | LUC [color=green] +·[/color] | Innate: Cute
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=pink]Charmed[/color]  [color=pink]Horny[/color]  [color=cyan]Milk-Addicted[/color][/sub]
[u]Cleric[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color]\t [color=blue]Evolves[/color][/b][/sub]
Holy warrior-mages focusing on healing magic and protecting others.
STR [color=green] +·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ·[/color] | INT [color=green] ++[/color] | CHA [color=green] ·[/color] | LUC [color=green] ++[/color] | Innate: Stalwart
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=yellow]Hardy[/color]  [color=white]Heal[/color]  [color=green]Lucky[/color]  [color=orange]Mighty[/color]  [color=white]Protected[/color]  [color=green]Righteous[/color]  [color=yellow]Silenced[/color][/sub]
[u]Citizen[/u]\t [sub][b]\t [color=blue]Evolves[/color][/b][/sub]
Plain old citizen. Be careful not to be mistaken for an NPC!
STR [color=green] ·[/color] | VIT [color=green] ·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] +[/color] | Innate: Boring
Buffs/Debuffs:[sub] N/A[/sub]
[u]Chef[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color]\t [color=blue]Evolves[/color][/b][/sub]
A culinary worker that uses their talents to make delicious food for all to enjoy.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=yellow]Bloated[/color]  [color=yellow]Hardy[/color]  [color=pink]Ravenous[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Blacksmith[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=blue]Evolves[/color][/b][/sub]
A master of hammer and furnace, doing hard physical labor in harsh conditions every day.
STR [color=green] ++·[/color] | VIT [color=green] +·[/color] | DEX [color=green] ·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=white]Armor[/color]  [color=white]Honed[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=white]Reinforced[/color]  [color=white]Weapon[/color][/sub]
[u]Blackguard[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=red]Unholy[/color]\t [color=blue]Evolves[/color][/b][/sub]
A warrior with all the training of a knight, but with a heart as black as coal.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] ·[/color] | Innate: Wicked
Buffs/Debuffs:[sub]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=red]Hobbled[/color][/sub]
[u]Bartender[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=yellow]Grinder[/color]\t [color=white]Support[/color][/b][/sub]
Mixes drinks and changes lives.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Working
Buffs/Debuffs:[sub]  [color=yellow]Drunk[/color]  [color=white]Questing[/color][/sub]
[u]Bard[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Fan[/b][/sub]
Adventuring performers and aspiring seducers.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] +·[/color] | Innate: Comely
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=pink]Charmed[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=yellow]Hardy[/color]  [color=pink]Horny[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color][/sub]
[u]Alchemist[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Homunculus[/b][/sub]
Seekers of wisdom hidden by gods, never meant to be discovered by man.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: Clarity
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Berserk[/color]  [color=pink]Charmed[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=cyan]Confused[/color]  [color=yellow]Fecund[/color]  [color=white]First-Aid[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Hardy[/color]  [color=white]Noxious-Concoction[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color]  [color=white]Unlabeled-Potion[/color]  [color=yellow]Virile[/color][/sub]
[u]Alchemist[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Homunculus[/b][/sub]
Seekers of wisdom hidden by gods, never meant to be discovered by man.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: Clarity
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Berserk[/color]  [color=pink]Charmed[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=cyan]Confused[/color]  [color=yellow]Fecund[/color]  [color=white]First-Aid[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Hardy[/color]  [color=white]Noxious-Concoction[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color]  [color=white]Unlabeled-Potion[/color]  [color=yellow]Virile[/color][/sub]
[u]Alchemist[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Homunculus[/b][/sub]
Seekers of wisdom hidden by gods, never meant to be discovered by man.
STR [color=green] +[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++·[/color] | CHA [color=green] +[/color] | LUC [color=green] +·[/color] | Innate: Clarity
Buffs/Debuffs:[sub]  [color=red]Agile[/color]  [color=cyan]Berserk[/color]  [color=pink]Charmed[/color]  [color=cyan]Clarity[/color]  [color=pink]Comely[/color]  [color=cyan]Confused[/color]  [color=yellow]Fecund[/color]  [color=white]First-Aid[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=yellow]Hardy[/color]  [color=white]Noxious-Concoction[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=orange]Strong[/color]  [color=white]Unlabeled-Potion[/color]  [color=yellow]Virile[/color][/sub]
[u]Dark Magical Girl[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=red]Unholy[/color][/b][/sub]
Fallen champions of justice, their once pure hearts inverted into the very thing they swore to defend humanity from!
STR [color=green] ·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] +++[/color] | CHA [color=green] +++[/color] | LUC [color=red] -[/color] | Innate: Wicked
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=pink]Charmed[/color]  [color=orange]Entangled[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=yellow]Virile[/color][/sub]
[u]Room[/u]\t [sub][b]\t [color=purple]Drainer[/color]\t [color=white]Support[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t Converts: False Prophet[/b][/sub]
Room.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC - | Innate: From Beyond
Buffs/Debuffs:[sub] N/A[/sub]
[u]Deity[/u]\t [sub][b]\t [color=blue]Finesse[/color]\t [color=white]Support[/color]\t [color=cyan]Holy[/color]\t Converts: Devout[/b][/sub]
A supreme being from a higher plane who rules over some intrinsic force or idea.
STR [color=green] +++[/color] | VIT [color=green] +++[/color] | DEX [color=green] +++[/color] | INT [color=green] +++[/color] | CHA [color=green] +++[/color] | LUC [color=green] +++[/color] | Innate: Divinity
Buffs/Debuffs:[sub]  [color=white]Ascended-Mind[/color]  [color=white]Blessed-Armor[/color]  [color=white]Blessed-Weapon[/color]  [color=green]Blessed[/color]  [color=white]Boon[/color]  [color=green]Chosen[/color]  [color=green]Condemned[/color]  [color=green]Cursed[/color]  [color=green]Devoted[/color]  [color=white]Diminished-Divinity[/color]  [color=green]Doomed[/color]  [color=cyan]Enlightened[/color]  [color=white]Evolved-Physique[/color]  [color=green]Favored[/color]  [color=yellow]Fecund[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=red]Graceful[/color]  [color=white]Great-Boon[/color]  [color=yellow]Invincible[/color]  [color=pink]Irresistible[/color]  [color=white]Miracle[/color]  [color=white]Questing[/color]  [color=green]Righteous[/color]  [color=orange]Unstoppable[/color]  [color=yellow]Virile[/color][/sub]
[u]Legendary Hero[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=cyan]Holy[/color]\t Converts: Party Member[/b][/sub]
The legend come true, a peerless hero standing at the end of their long journey after defeating all before them... Until the sequel anyways.
STR [color=green] +++[/color] | VIT [color=green] +++[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +++[/color] | Innate: Hero of Legend
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=orange]Disarmed[/color]  [color=yellow]Freezing[/color]  [color=white]Heal[/color]  [color=yellow]Overheated[/color]  [color=red]Paralyzed[/color]  [color=yellow]Poisoned[/color]  [color=white]Protected[/color]  [color=white]Questing[/color]  [color=yellow]Silenced[/color]  [color=red]Slow[/color][/sub]
[u]Behemoth[/u]\t [sub][b]\t [color=orange]Monster[/color][/b][/sub]
A hulking beast.
STR [color=green] +++·[/color] | VIT [color=green] +++++[/color] | DEX [color=green] ·[/color] | INT [color=green] +[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Invincible
Buffs/Debuffs:[sub]  [color=yellow]Crushed[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=white]Mutation[/color]  [color=yellow]Pulverized[/color]  [color=yellow]Virile[/color][/sub]
[u]Monster Lord[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=purple]Drainer[/color]\t [color=orange]Monster[/color][/b][/sub]
The grand authority of beasts, they command the awe and respect of all monsterkind.
STR [color=green] ++++[/color] | VIT [color=green] +++++[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +++[/color] | LUC [color=red] ---[/color] | Innate: Vicious
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=orange]Bound[/color]  [color=cyan]Brainwashed[/color]  [color=yellow]Crushed[/color]  [color=white]Egg-Filled[/color]  [color=orange]Entangled[/color]  [color=white]Fear[/color]  [color=yellow]Fecund[/color]  [color=orange]Feeble[/color]  [color=red]Hobbled[/color]  [color=yellow]Infested[/color]  [color=white]Mutation[/color]  [color=yellow]Overheated[/color]  [color=red]Petrified[/color]  [color=yellow]Poisoned[/color]  [color=pink]Ravenous[/color]  [color=pink]Ruined[/color]  [color=red]Slimed[/color]  [color=yellow]Virile[/color][/sub]
[u]Bovine Hero[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t Converts: Cow[/b][/sub]
The hero of legends, wielding the holy power of the gods. The one prophesized to slay the demoo lord.
STR [color=green] ++·[/color] | VIT [color=green] +++[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Milky
Buffs/Debuffs:[sub]  [color=orange]Disarmed[/color]  [color=yellow]Freezing[/color]  [color=white]Heal[/color]  [color=cyan]Milk-Addicted[/color]  [color=yellow]Overheated[/color]  [color=yellow]Silenced[/color]  [color=yellow]Well-Fed[/color][/sub]
[u]Fallen Angel[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color]\t [color=cyan]Holy[/color][/b][/sub]
Angels whose souls have been painted in sin, cast from the heavens to settle amongst the lower planes.
STR [color=green] ++·[/color] | VIT [color=green] ++[/color] | DEX [color=green] ++[/color] | INT [color=green] +·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ++[/color] | Innate: Irresistible
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=green]Damned[/color]  [color=green]Devoted[/color]  [color=yellow]Fecund[/color]  [color=white]Heal[/color]  [color=pink]Horny[/color]  [color=pink]Ravenous[/color]  [color=yellow]Virile[/color]  [color=green]Wicked[/color][/sub]
[u]Archmage[/u]\t [sub][b]\t [color=green]Adventurer[/color][/b][/sub]
Those great and studied practitioners of magic who have studied and mastered all schools and methods, blending together multiple systems and methodologies to reach the apex of their craft.
STR - | VIT [color=green] ·[/color] | DEX [color=green] +·[/color] | INT [color=green] +++++·[/color] | CHA [color=green] ++[/color] | LUC [color=green] ++[/color] | Innate: Perfected-Mind
Buffs/Debuffs:[sub]  [color=cyan]Addled[/color]  [color=cyan]Brainwashed[/color]  [color=pink]Captivating[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=white]Enervated[/color]  [color=orange]Feeble[/color]  [color=yellow]Frail[/color]  [color=yellow]Freezing[/color]  [color=white]Frog[/color]  [color=yellow]Futanarification[/color]  [color=pink]Genderbent[/color]  [color=red]Graceful[/color]  [color=white]Heal[/color]  [color=cyan]Inspired[/color]  [color=white]Magic-Armor[/color]  [color=white]Magic-Weapon[/color]  [color=orange]Mighty[/color]  [color=yellow]Overheated[/color]  [color=red]Petrified[/color]  [color=yellow]Poisoned[/color]  [color=yellow]Silenced[/color]  [color=yellow]Sleep[/color]  [color=red]Slow[/color]  [color=yellow]Stalwart[/color][/sub]
[u]Nine-Tailed Fox[/u]\t [sub][b]\t [color=pink]Seducer[/color]\t [color=blue]Finesse[/color]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color][/b][/sub]
Ascended, enlightened, perfected, these foxes bear proof of their divinity through their nine irresistibly fluffy tails.
STR [color=green] ·[/color] | VIT [color=green] +[/color] | DEX [color=green] +++[/color] | INT [color=green] ++[/color] | CHA [color=green] +++[/color] | LUC [color=green] +++[/color] | Innate: Perfection
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=white]Boon[/color]  [color=pink]Charmed[/color]  [color=cyan]Confused[/color]  [color=green]Cursed[/color]  [color=green]Doomed[/color]  [color=green]Favored[/color]  [color=green]Lucky[/color]  [color=green]Unlucky[/color][/sub]
[u]Nephilim[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color][/b][/sub]
The persecuted offspring of angels and mortals. They often spend their lives hiding and fleeing from persecution, for many seek to dim the glorious light shining within them before it grows too bright.
STR [color=green] ·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] ++[/color] | CHA [color=green] +[/color] | LUC [color=green] ++[/color] | Innate: Righteous
Buffs/Debuffs:[sub]  [color=green]Blessed[/color]  [color=white]First-Aid[/color]  [color=green]Lucky[/color]  [color=white]Protected[/color][/sub]
[u]Demigod[/u]\t [sub][b][/b][/sub]
A supreme being just a few steps away from proper godhood.
STR [color=green] ++·[/color] | VIT [color=green] ++·[/color] | DEX [color=green] ++·[/color] | INT [color=green] ++·[/color] | CHA [color=green] ++·[/color] | LUC [color=green] ++·[/color] | Innate: Diminished-Divinity
Buffs/Debuffs:[sub]  [color=white]Blessed-Armor[/color]  [color=white]Blessed-Weapon[/color]  [color=green]Blessed[/color]  [color=white]Boon[/color]  [color=green]Chosen[/color]  [color=green]Cursed[/color]  [color=green]Devoted[/color]  [color=green]Favored[/color]  [color=green]Righteous[/color][/sub]
[u]Corporal[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
You’re an errand boy, sent by grocery clerks, to collect a bill.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub] N/A[/sub]
[u]Prinny[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=orange]Monster[/color]\t [color=red]Unholy[/color][/b][/sub]
A soul being punished. For some reason, bears the resemblance of a penguin...?
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +[/color] | INT [color=green] +[/color] | CHA [color=green] ·[/color] | LUC [color=red] ·[/color] | Innate: Doomed
Buffs/Debuffs:[sub] N/A[/sub]
[u]Seraph[/u]\t [sub][b]\t [color=orange]Monster[/color]\t [color=cyan]Holy[/color][/b][/sub]
The mightiest warriors and most beloved servants of heaven, their very souls ablaze with the light of goodness itself.
STR [color=green] +++·[/color] | VIT [color=green] +++[/color] | DEX [color=green] ++[/color] | INT [color=green] +[/color] | CHA [color=red] -[/color] | LUC [color=green] ++++[/color] | Innate: Righteous
[u]Major[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
What the hell do you know about surfing, Major? You're from...New Jersey!
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]General[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
I don't know, General. If I had the choice between mice and Mausers, I think I'd take the mice every time.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Overheated[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]Sergeant[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
You are fighting for the biggest nothing in history.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub] N/A[/sub]
[u]Colonel[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
Hey, man, you don't talk to the Colonel. You listen to him. The man's enlarged my mind.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]Captain[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
What difference do you think you can make, one man in all this madness?
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]First Lieutenant[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
Lieutenant, bomb that tree line about 100 yards back! Give me some room to breathe!
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] +[/color] | LUC [color=green] +[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color][/sub]
[u]Second Lieutenant[/u]\t [sub][b]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
You can tell her that when you found me, I was with the only brothers I had left. And that there was no way I was deserting them. I think she'd understand that.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +[/color] | CHA [color=green] +[/color] | LUC [color=green] ·[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color][/sub]
[u]Lieutenant Colonel[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
In this world, a man, himself, is nothing. And there ain’t no world but this one.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] +·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Dutiful
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]Brigadier General[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
Someday this war's gonna end. That'd be just fine with the boys on the boat.
STR [color=green] ++[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ++[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Overheated[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]Major General[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
He better be worth it. He better go home and cure a disease, or invent a longer-lasting light bulb.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ++[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Overheated[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]Lieutenant General[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
The war was being run by a bunch of four-star clowns who were gonna end up giving the whole circus away.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +[/color] | Innate: Reinforced
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=yellow]Overheated[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]
[u]Warrant Officer[/u]\t [sub][b]\t [color=yellow]Grinder[/color]\t [color=green]Adventurer[/color]\t [color=blue]Evolves[/color]\t Converts: Soldier[/b][/sub]
The man is clear in his mind, but his soul is mad.
STR [color=green] +·[/color] | VIT [color=green] +·[/color] | DEX [color=green] +·[/color] | INT [color=green] ·[/color] | CHA [color=green] ·[/color] | LUC [color=green] ·[/color] | Innate: Fodder
Buffs/Debuffs:[sub] N/A[/sub]
[u]Field Marshal[/u]\t [sub][b]\t [color=white]Support[/color]\t [color=green]Adventurer[/color]\t [color=orange]Monster[/color]\t Converts: Soldier[/b][/sub]
I like the smell of napalm in the morning. It smells like...victory.
STR [color=green] ++[/color] | VIT [color=green] ++[/color] | DEX [color=green] +·[/color] | INT [color=green] ++·[/color] | CHA [color=green] +·[/color] | LUC [color=green] +·[/color] | Innate: Mastery
Buffs/Debuffs:[sub]  [color=cyan]Berserk[/color]  [color=pink]Boring[/color]  [color=yellow]Crushed[/color]  [color=pink]Daring[/color]  [color=orange]Disarmed[/color]  [color=white]First-Aid[/color]  [color=white]Irradiated[/color]  [color=yellow]Overheated[/color]  [color=yellow]Pulverized[/color]  [color=white]Questing[/color]  [color=white]Reinforced[/color]  [color=cyan]Vicious[/color][/sub]`;
    }
}