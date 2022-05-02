import {Component, Hook, Prop} from '@f-list/vue-ts';
import {CreateElement, default as Vue, VNode, VNodeChildrenArrayContents} from 'vue';
import {Channel} from '../fchat';
import {Score} from '../learn/matcher';
import {BBCodeView} from '../bbcode/view';
import {formatTime} from './common';
import core from './core';
import {Conversation} from './interfaces';
import UserView from './UserView.vue';
import {Scoring} from '../learn/matcher-types';
import ChatMessage = Conversation.ChatMessage;
import {Buff, BuffRepository, Job, JobRepository, Tag} from './leveldrain/LevelDrainData';
import JobView from './leveldrain/JobView.vue';
import BuffView from './leveldrain/BuffView.vue';
import {StatSheet} from './leveldrain/StatSheet';
import SpoilerElement from './leveldrain/SpoilerElement.vue';

const userPostfix: { [key: number]: string | undefined } = {
    [Conversation.Message.Type.Message]: ': ',
    [Conversation.Message.Type.Ad]: ': ',
    [Conversation.Message.Type.Action]: ''
};

@Component({
    render(this: MessageView, createElement: CreateElement): VNode {
        function getUnclosedTags(text: string): string {
            const tags = getOpenedTags(text);
            const ret: string[] = [];

            tags.forEach((tag) => {
                const idx = text.lastIndexOf(tag);
                if (text.indexOf(getClosingTag(tag), idx) === -1) {
                    ret.push(tag);
                }
            });

            return ret.join('');
        }

        const tagRegex = /(\[[^\/\[]*])/isg;

        function getOpenedTags(text: string): string[] {
            const ret: string[] = [];
            let match;
            while ((match = tagRegex.exec(text)) !== null) {
                ret.push(match[0]);
            }
            return ret;
        }

        function getClosingTag(tag: string): string {
            if (tag.startsWith('[color='))
                return '[/color]';
            return `[/${tag.substring(1)}`;
        }

        function getBuffsFromString(str: string, sep: string): Buff[] {
            const ret: Buff[] = [];
            if(sep === '') {
                const b = BuffRepository.getInstance().getBuff(str);
                if(b)
                    ret.push(b);
            } else {
                const arr = str.trim().split(sep);
                arr.forEach((s) => {
                    const b = BuffRepository.getInstance().getBuff(s);
                    if(b)
                        ret.push(b);
                });
            }
            return ret;
        }

        function getJobsFromString(str: string, sep: string): Job[] {
            const ret: Job[] = [];
            if(sep === '') {
                const j = JobRepository.getInstance().getJob(str);
                if(j)
                    ret.push(j);
            } else {
                const arr = str.trim().split(sep);
                arr.forEach((s) => {
                    const j = JobRepository.getInstance().getJob(s);
                    if(j)
                        ret.push(j);
                });
            }
            return ret;
        }

        const message = this.message;

        // setTimeout(
        //     () => {
        //         console.log('Now scoring high!', message.text.substr(0, 64));
        //         message.score = Scoring.MATCH;
        //     },
        //     5000
        // );

        const children: VNodeChildrenArrayContents =
            [createElement('span', {staticClass: 'message-time'}, `${formatTime(message.time)}`)];
        const separators = core.connection.isOpen ? core.state.settings.messageSeparators : false;
        /*tslint:disable-next-line:prefer-template*///unreasonable here
        let classes = `message message-${Conversation.Message.Type[message.type].toLowerCase()}` + (separators ? ' message-block' : '') +
            (message.type !== Conversation.Message.Type.Event && message.sender.name === core.connection.character ? ' message-own' : '') +
            ((this.classes !== undefined) ? ` ${this.classes}` : '') +
            ` ${this.scoreClasses}` +
            ` ${this.filterClasses}`;
        if (message.type !== Conversation.Message.Type.Event) {
            children.push(
                (message.type === Conversation.Message.Type.Action) ? createElement('i', {class: 'message-pre fas fa-star'}) : '',
                createElement(UserView, {props: {character: message.sender, channel: this.channel}}),
                userPostfix[message.type] !== undefined ? createElement('span', {class: 'message-post'}, userPostfix[message.type]) : ' '
            );
            if (message.isHighlight) classes += ' message-highlight';
        }

        const replacements = [
            /(\[b]level drain stat sheet\[\/b].*?\D*\d* )(?<job>[^\[]*)( \[.*?color=white]\[b])(?:(Status Conditions[^\r\n]*[\r\n]+\[b]\t)(?<boldbuffs>\[color=[^\]]*][^\[]*\[\/color](?<sep> \| )?[^\r\n]*)|(Stats))(\[\/b].*)$/is, //Stat Sheet
            /^(.*class is now.*?])(?<job>[^\[]*)(.*)$/is, //Class Change Result + Dungeon Force Change
            /^(.*you have.*?unlocked.*?] )(?<job>[^\[]*)(.*)$/is, //Dungeon Unlock
            /^(.*you are now affected by \[b]\[color=[^\]]*])(?<boldbuff>[^[]*)(.*)$/is, //Dungeon inflict
            /(^.*you were inflicted with \[b])(?<boldbuff>[^[]*)(\[\/b]!.*)$/is, //Grind Result
            /^(.*is registered as a.*?Level.*] )(?<job>[^.]*)(\. status effects: )?(?<buffs>\[color=[^\]]*][^\[]*\[\/color](?<sep>, )?[^.]*)?(.)$/is, //!check result
            /^(.*class-change .*? into )(?<job>[^!]*)(.*)$/is, //Class Change Request
            /^(.*?is attempting to.*inflict \[b])(?<boldbuff>[^!]*)(\[\/b]!.*)$/is, //Inflict Request
            /^( ?Drain successful!.*got the status condition \[b])(?<boldbuff>[^!]*)(\[\/b]! ?)$/is, //Inflict Result
            /^(status conditions )(?<job>.*?)( may inflict: ?[\r\n]+)(?<boldbuffs>\[b]\[color=[^\]]*][^\[]*\[\/color]\[\/b](?<sep> ).*)?$/is, //inflict
            /^(\[b]\[color=[^\]]*])(?<boldbuff>[^[]*)(.*?\[sup]From: )(?<supjobs>[^,]*(?<sep>, )[^[]*)?(.*)$/is, //inflict to bot
            /^(\[u])(?<job>[^\[]*)(\[\/u]\t \[sub]\[b](?:\t \[color=[^\]]*][^\[]*\[\/color])*)(?:(\t converts: )(?<subjob>[^\[]*))?(\[\/b]\[\/sub].*?Innate: )(?<innate>[^\r\n]*)(.*?buffs\/debuffs:\[sub]  )(?<subbuffs>\[color=[^\]]*][^\[]*\[\/color](?<sep>  )?.*)(\[\/sub])$/is //!jobinfo result
        ];
        const historyRegex = /^(?<first>Levels:[\r\n]+)(?<historylist>.*?[\n])(?<second>[\r\n]+Total Levels:)\[spoiler][\r\n]+(?<spoilerlist>[^\[]*)(?<third>\[\/spoiler])$/is;
        const fromStatTrack = message.type === Conversation.Message.Type.Message && (message as ChatMessage).sender?.name === 'StatTrack';
        let foundReplacement = false;
        let closingTags = '';
        if (fromStatTrack) {
            replacements.every((regex) => {
                const match = message?.text.match(regex);
                if (match) {
                    const groups = match.groups;
                    match.forEach((m) => {
                        if (!m || m === match[0] || m.trim() === '' || (groups && m === groups.sep) || m.trim() === message?.text.trim())
                            return;
                        foundReplacement = false;

                        if (m === groups?.job || m === groups?.subjob) {
                            const j = JobRepository.getInstance().getJob(m);
                            if (j) {
                                foundReplacement = true;
                                let vnode: VNode;
                                if (m === groups?.subjob) {
                                    const subnode = createElement(JobView,
                                        {props: {job: j, underlined: true, clickEvent: this.clickEvent}});
                                    vnode = createElement('sub', {}, [subnode]);
                                } else {
                                    vnode = createElement(JobView,
                                        {props: {job: j, underlined: true, clickEvent: this.clickEvent}});
                                }
                                children.push(vnode);
                            } else {
                                foundReplacement = false;
                            }
                        } else if(m === groups?.supjobs) {
                            const sep = groups?.sep;
                            let tag = '';
                            switch (m) {
                                case groups?.supjobs:
                                    tag = 'sup';
                                    break;
                            }

                            const jbs = getJobsFromString(m, sep);
                            if(jbs.length > 0) {
                                sep.replace(' ', '&nbsp;');
                                foundReplacement = true;
                                let subnodes: VNode[] = [];
                                jbs.forEach((j) => {
                                    subnodes.push(createElement(JobView,
                                        {props: {job: j, underlined: true, clickEvent: this.clickEvent}}));
                                    if(j !== jbs[jbs.length - 1]) {
                                        subnodes.push(createElement('span', sep));
                                    }
                                });
                                if(tag !== '')
                                    children.push(createElement(tag, {}, subnodes));
                                else
                                    children.push(subnodes);
                            } else {
                                foundReplacement = false;
                            }
                        } else if(m === groups?.innate || m === groups?.boldbuff) {
                            const b = BuffRepository.getInstance().getBuff(m);
                            let col = false;
                            if(m === groups?.boldbuff)
                                col = true;
                            if(b) {
                                foundReplacement = true;
                                if(m === groups?.boldbuff) {
                                    children.push(createElement('strong', {}, [createElement(BuffView,
                                        {props: {buff: b, coloured: col, clickEvent: this.clickEvent}})]));
                                } else {
                                    children.push(createElement(BuffView,
                                        {props: {buff: b, coloured: col, clickEvent: this.clickEvent}}));
                                }
                            } else {
                                foundReplacement = false;
                            }
                        } else if(m === groups?.buffs || m === groups?.subbuffs || m === groups?.boldbuffs) {
                            const sep = groups?.sep;
                            let tag = '';
                            switch (m) {
                                case groups?.buffs:
                                    tag = '';
                                    break;
                                case groups?.subbuffs:
                                    tag = 'sub';
                                    break;
                                case groups?.boldbuffs:
                                    tag = 'strong';
                                    break;
                            }

                            const bfs = getBuffsFromString(m, sep);
                            if(bfs.length > 0) {
                                sep.replace(' ', '&nbsp;');
                                foundReplacement = true;
                                let subnodes: VNode[] = [];
                                bfs.forEach((b) => {
                                    subnodes.push(createElement(BuffView,
                                        {props: {buff: b, coloured: true, clickEvent: this.clickEvent}}));
                                    if(b !== bfs[bfs.length - 1]) {
                                        subnodes.push(createElement('span', sep));
                                    }
                                });
                                if(tag !== '')
                                    children.push(createElement(tag, {}, subnodes));
                                else
                                    children.push(subnodes);
                            } else {
                                foundReplacement = false;
                            }
                        }

                        if(!foundReplacement) {
                            foundReplacement = true;
                            m = closingTags + m;
                            children.push(createElement(BBCodeView(core.bbCodeParser),
                                {props: {unsafeText: m}}));
                            closingTags = getUnclosedTags(m);
                        }
                    });
                    return false;
                }
                return true;
            });
            if(!foundReplacement){
                const historyGroups = message?.text.match(historyRegex)?.groups;
                if (historyGroups) {
                    foundReplacement = true;
                    const jobscan = /^(?<job>[^:]*)(?<trail>:\t\d+[^\[\r\n]*)/igm;
                    children.push(createElement('span', historyGroups.first));
                    children.push(createElement('br'));

                    let match;
                    while ((match = jobscan.exec(historyGroups.historylist)) !== null) {
                        const j = JobRepository.getInstance().getJob(match.groups?.job);
                        if(j) {
                            children.push(createElement(JobView,
                                {props: {job: j, underlined: true, clickEvent: this.clickEvent}}));
                            children.push(createElement('span', match.groups?.trail));
                            children.push(createElement('br'));
                        } else {
                            children.push(createElement('span', match[0]));
                            children.push(createElement('br'));
                        }
                    }

                    children.push(createElement('br'));
                    children.push(createElement('span', historyGroups.second));
                    children.push(createElement('br'));
                    const jobs: [Job, string][] = [];
                    jobscan.lastIndex = 0;
                    while ((match = jobscan.exec(historyGroups.spoilerlist)) !== null) {
                        const j = JobRepository.getInstance().getJob(match.groups?.job);
                        if(j) {
                            jobs.push([j, match.groups?.trail as string]);
                        }
                    }
                    children.push(createElement(SpoilerElement,
                        {props: {jobs: jobs, clickEvent: this.clickEvent}}));
                }
            }
        }


        if (!foundReplacement) {
            const isAd = message.type === Conversation.Message.Type.Ad && !this.logs;
            children.push(createElement(BBCodeView(core.bbCodeParser),
                {
                    props: {
                        unsafeText: message.text, afterInsert: isAd ? (elm: HTMLElement) => {
                            setImmediate(() => {
                                elm = elm.parentElement!;
                                if (elm.scrollHeight > elm.offsetHeight) {
                                    const expand = document.createElement('div');
                                    expand.className = 'expand fas fa-caret-down';
                                    expand.addEventListener('click', function(): void {
                                        this.parentElement!.className += ' expanded';
                                    });
                                    elm.appendChild(expand);
                                }
                            });
                        } : undefined
                    }
                }));
        }
        const node = createElement('div', {attrs: {class: classes}}, children);
        node.key = message.id;
        return node;
    }
})
export default class MessageView extends Vue {
    @Prop({required: true})
    readonly message!: Conversation.Message;
    @Prop
    readonly classes?: string;
    @Prop
    readonly channel?: Channel;
    @Prop
    readonly logs?: true;
    @Prop()
    readonly clickEvent: ((j: StatSheet | Job | Buff | Tag) => void) | undefined = undefined;

    scoreClasses = this.getMessageScoreClasses(this.message);
    filterClasses = this.getMessageFilterClasses(this.message);

    scoreWatcher: (() => void) | null = ((this.message.type === Conversation.Message.Type.Ad) && (this.message.score === 0))
        ? this.$watch('message.score', () => this.scoreUpdate())
        : null;


    @Hook('beforeDestroy')
    onBeforeDestroy(): void {
        // console.log('onbeforedestroy');

        if (this.scoreWatcher) {
            // console.log('onbeforedestroy killed');

            this.scoreWatcher(); // stop watching
            this.scoreWatcher = null;
        }
    }

    // @Watch('message.score')
    scoreUpdate(): void {
        const oldScoreClasses = this.scoreClasses;
        const oldFilterClasses = this.filterClasses;

        this.scoreClasses = this.getMessageScoreClasses(this.message);
        this.filterClasses = this.getMessageFilterClasses(this.message);

        if (this.scoreClasses !== oldScoreClasses || this.filterClasses !== oldFilterClasses) {
            this.$forceUpdate();
        }

        if (this.scoreWatcher) {
            // console.log('watch killed');

            this.scoreWatcher(); // stop watching
            this.scoreWatcher = null;
        }
    }

    getMessageScoreClasses(message: Conversation.Message): string {
        if ((!core.state.settings.risingAdScore) || (message.type !== Conversation.Message.Type.Ad)) {
            return '';
        }

        return `message-score ${Score.getClasses(message.score as Scoring)}`;
    }

    getMessageFilterClasses(message: Conversation.Message): string {
        if (!message.filterMatch) {
            return '';
        }

        return 'filter-match';
    }
}
