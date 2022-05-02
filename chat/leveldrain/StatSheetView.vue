<template>
    <modal :buttons="false" ref="dialog" style="width:98%" dialogClass="" :back="backAction" :is-back-enabled="canBack" :forward="forwardAction" :is-forward-enabled="canForward">
        <template slot="title" v-if="title">
            <span class="title"><bbcode :text="title"></bbcode> <br>
                <span v-if="tags.length > 0" class="tags"><template v-for="tag in tags"><tag-view :tag="tag" :click-event="clickEvent"></tag-view>&nbsp;&nbsp;</template>
                    <template v-if="convert">Converts: <job-view :job="convert" :click-event="clickEvent"></job-view></template></span>
                <span v-if="costAndDrain" class="tags">{{ costAndDrain }}</span>
            </span>
        </template>
        <template slot="title" v-else>
            No Data Provided!
        </template>

        <div ref="pageBody" v-if="!currentData">
            No Data!
        </div>
        <div class="stat-sheet" ref="pageBody" v-else-if="currentData !== null && currentData.constructor.name === 'StatSheet'">

        </div>
        <div class="job-sheet" ref="pageBody" v-else-if="currentData !== null && currentData.constructor.name === 'Job'">
            <div class="desc">{{ desc }}</div>
            <bbcode :text="scaling"></bbcode> | Innate: <buff-view v-if="innate" :buff="innate" :coloured="false" :click-event="clickEvent"></buff-view><span v-else>N/A</span><br>
            <span class="inflict">Inflicts: </span>
            <template v-for="buff in buffs"><buff-view :buff="buff" :coloured="true" :click-event="clickEvent"></buff-view><span v-if="!isLastBuff(buff)">, </span></template>
        </div>
        <div class="buff-sheet" ref="pageBody" v-else-if="currentData !== null && currentData.constructor.name === 'Buff'">
            <div class="desc">{{ desc }}</div>
            <template v-for="job in fromJobs"><job-view :job="job" :click-event="clickEvent"></job-view><span v-if="!isLastFrom(job)">, </span></template>
        </div>
        <div class="tag-sheet" ref="pageBody" v-else-if="currentData !== null && currentData.constructor.name === 'Tag'">
            <div class="desc">
                <template v-for="feature in features"><bbcode :text="feature"></bbcode><br v-if="!isLastFeature(feature)"></template>
            </div>
        </div>

    </modal>
</template>


<script lang="ts">

import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
import CustomDialog from '../../components/custom_dialog';
import Modal from '../../components/Modal.vue';
import {StatSheet} from "./StatSheet";
import {Buff, Job, Tag} from './LevelDrainData';
import BuffView from './BuffView.vue';
import JobView from './JobView.vue';
import TagView from './TagView.vue';

@Component({
    components: {
        modal: Modal,
        'buff-view': BuffView,
        'job-view': JobView,
        'tag-view': TagView
    }
})
export default class StatSheetView extends CustomDialog {
    @Prop({required: true})
    data!: StatSheet | Job | Buff | Tag | null;

    @Prop({required: true})
    clickEvent!: ((j: StatSheet | Job | Buff | Tag) => void);

    prevData: (StatSheet | Job | Buff | Tag)[] = [];
    postData: (StatSheet | Job | Buff | Tag)[] = [];
    currentData: StatSheet | Job | Buff | Tag | null = null;

    @Watch('data')
    onDataChanged(): void {
        if(this.currentData !== this.data){
            if(this.data){
                this.prevData.push(this.data);
                this.postData = [];
                this.currentData = this.data;
            }
        }
    }

    @Hook('mounted')
    onMounted(): void {

    }

    backAction(): void {
        if(!this.canBack())
            return;
        //The current element is already added -> remove it
        let p = this.prevData.pop();
        if(p)
            this.postData.push(p);
        this.currentData = this.prevData[this.prevData.length - 1];
    }

    canBack(): boolean {
        return this.prevData.length > 1;
    }

    forwardAction(): void {
        if(!this.canForward())
            return;

        let p = this.postData.pop();
        if(p) {
            this.currentData = p;
            this.prevData.push(p);
        }
    }

    canForward(): boolean {
        return this.postData.length > 0;
    }

    get title(): string | undefined {
        return this.currentData?.name;
    }

    get tags(): Tag[] {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).tags;
        return [];
    }

    get convert(): Job | null {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).convertJob;
        return null;
    }

    get desc(): string {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).desc;
        else if (this.currentData && this.currentData.constructor.name === 'Buff')
            return (this.currentData as Buff).desc;
        return '';
    }

    get scaling(): string {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).scaling;
        return '';
    }

    get innate(): Buff | null {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).innate;
        return null;
    }

    get buffs(): Buff[] {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).buffs;
        return [];
    }

    isLastBuff(buff: Buff): boolean {
        if(this.currentData && this.currentData.constructor.name === 'Job')
            return (this.currentData as Job).buffs[(this.currentData as Job).buffs.length-1] === buff;
        return false;
    }

    get costAndDrain(): string | null {
        if(this.currentData && this.currentData.constructor.name === 'Buff')
            return `Cost: ${(this.currentData as Buff).cost} | Drained Stat: ${(this.currentData as Buff).getStat()}`;
        return null;
    }

    get fromJobs(): Job[] {
        if(this.currentData && this.currentData.constructor.name === 'Buff')
            return (this.currentData as Buff).fromJobs;
        return [];
    }

    isLastFrom(job: Job): boolean {
        if(this.currentData && this.currentData.constructor.name === 'Buff')
            return (this.currentData as Buff).fromJobs[(this.currentData as Buff).fromJobs.length-1] === job;
        return false;
    }

    get features(): string[] {
        if(this.currentData && this.currentData.constructor.name === 'Tag')
            return (this.currentData as Tag).features;
        return [];
    }

    isLastFeature(feature: string): boolean {
        if(this.currentData && this.currentData.constructor.name === 'Tag')
            return (this.currentData as Tag).features[(this.currentData as Tag).features.length-1] === feature;
        return false;
    }
}
</script>


<style lang="scss">
.user-channel-list h3 {
    font-size: 120%;
}
.desc {
    font-size: 1.1rem;
    display: block;
    background-color: var(--light);
    padding: 10px;
    border-radius: 5px;
    margin-top: 0.5rem;
}
.inflict {
    font-size: 1.1rem;
}
.tags {
    font-size: 50% !important;
}
.modal-title {
    margin-bottom: 0;
    line-height: 1 !important;
}
.modal-body {
    padding: 0rem 1rem 1rem 1rem !important;
}
</style>
