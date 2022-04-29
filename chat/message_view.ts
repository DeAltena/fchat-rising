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
import {Buff, Job, JobRepository} from './leveldrain/LevelDrainData';
import JobView from './leveldrain/JobView.vue';
import {StatSheet} from './leveldrain/StatSheet';

const userPostfix: { [key: number]: string | undefined } = {
    [Conversation.Message.Type.Message]: ': ',
    [Conversation.Message.Type.Ad]: ': ',
    [Conversation.Message.Type.Action]: ''
};

@Component({
    render(this: MessageView, createElement: CreateElement): VNode {
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

        const replacements = [/(\[b\]level drain stat sheet\[\/b\].*?\D*\d* )(?<job>[^ ]*)(.*)/is, //Stat Sheet
            /^(.*class is now.*?\])(?<job>[^\[]*)(.*)$/is, //Class Change Result + Dungeon Force Change
            /^(.*you have.*?unlocked.*?\] )(?<job>[^\[]*)(.*)$/is, //Dungeon Unlock
            /^(.*is registered as a.*?Level.*\] )(?<job>[^.]*)(.*)$/is, //!check result
            /^(.*class-change .*? into )(?<job>[^!]*)(.*)$/is, //Class Change Request
            /^(\[u])(?<job>[^\[]*)(\[\/u]\t \[sub].*?Converts: )(?<subjob>[^\[]*)(.*)/is //!jobinfo result
        ];
        const fromStatTrack = message.type === Conversation.Message.Type.Message && (message as ChatMessage).sender?.name === 'StatTrack';
        let foundReplacement = false;
        let closingTags = '';
        if (fromStatTrack) {
            replacements.every((regex) => {
                const match = message?.text.match(regex);
                if (match) {
                    const groups = match.groups;
                    match.forEach((m) => {
                        if (m === message.text)
                            return;

                        if (m === groups?.job || m === groups?.subjob) {
                            const j = JobRepository.getInstance().getJob(groups.job);
                            if (j) {
                                let vnode: VNode;
                                if(m === groups?.subjob) {
                                    let subnode = createElement(JobView,
                                        {props: {job: j, clickEvent: this.clickEvent}});
                                    vnode = createElement('sub', {}, [subnode]);
                                } else {
                                    vnode = createElement(JobView,
                                        {props: {job: j, clickEvent: this.clickEvent}});
                                }
                                children.push(vnode);
                            } else {
                                m = closingTags + m;
                                children.push(createElement(BBCodeView(core.bbCodeParser),
                                    {props: {unsafeText: m}}));
                                closingTags = MessageView.getUnclosedTags(m);
                            }
                        } else {
                            m = closingTags + m;
                            children.push(createElement(BBCodeView(core.bbCodeParser),
                                {props: {unsafeText: m}}));
                            closingTags = MessageView.getUnclosedTags(m);
                        }
                    });
                    foundReplacement = true;
                    return false;
                }
                return true;
            });
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
                                    expand.addEventListener('click', function (): void {
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
    readonly clickEvent: ((j: StatSheet | Job | Buff) => void) | undefined = undefined;

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

    static getUnclosedTags(text: string): string {
        const tags = MessageView.getOpenedTags(text);
        const ret: string[] = [];

        tags.forEach((tag) => {
            const idx = text.lastIndexOf(tag);
            if(text.indexOf(MessageView.getClosingTag(tag), idx) === -1) {
                ret.push(tag);
            }
        });

        return ret.join();
    }

    static tagRegex = /(\[[^\/\[]*])/isg;
    static getOpenedTags(text: string): string[] {
        const ret: string[] = [];
        let match;
        while ((match = MessageView.tagRegex.exec(text)) !== null) {
            ret.push(match[0]);
        }
        return ret;
    }

    static getClosingTag(tag: string): string {
        if(tag.startsWith('[color='))
            return '[/color]';
        return `[/${tag.substring(1)}`;
    }
}
