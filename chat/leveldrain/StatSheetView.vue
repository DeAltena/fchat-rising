<template>
    <modal :buttons="false" ref="dialog" style="width:98%" dialogClass="">
        <template slot="title" v-if="title">
            <span class="title"><bbcode :text="title"></bbcode> <br>
                <span v-if="tags" class="tags"><bbcode :text="`[b]${tags}[/b]`"></bbcode><template v-if="convert">&nbsp;    Converts: <job-view :job="convert" :click-event="clickEvent"></job-view></template></span>
                <span v-if="costAndDrain" class="tags">{{ costAndDrain }}</span>
            </span>
        </template>
        <template slot="title" v-else>
            No Data Provided!
        </template>

        <div ref="pageBody" v-if="!data">
            No Data!
        </div>
        <div class="stat-sheet" ref="pageBody" v-else-if="data !== null && data.constructor.name === 'StatSheet'">

        </div>
        <div class="job-sheet" ref="pageBody" v-else-if="data !== null && data.constructor.name === 'Job'">
            <div class="desc">{{ desc }}</div>
            <bbcode :text="scaling"></bbcode> | Innate: <buff-view v-if="innate" :buff="innate" :coloured="false" :click-event="clickEvent"></buff-view><span v-else>N/A</span><br>
            <span class="inflict">Inflicts: </span>
            <span v-for="buff in buffs"><buff-view :buff="buff" :coloured="true" :click-event="clickEvent"></buff-view><span v-if="!isLastBuff(buff)">, </span></span>
        </div>
        <div class="buff-sheet" ref="pageBody" v-else-if="data !== null && data.constructor.name === 'Buff'">
            <div class="desc">{{ desc }}</div>
            <span v-for="job in fromJobs"><job-view :job="job" :click-event="clickEvent"></job-view><span v-if="!isLastFrom(job)">, </span></span>
        </div>

    </modal>
</template>


<script lang="ts">

import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
import CustomDialog from '../../components/custom_dialog';
import Modal from '../../components/Modal.vue';
import {StatSheet} from "./StatSheet";
import {Buff, Job} from "./LevelDrainData";
import BuffView from './BuffView.vue';
import JobView from './JobView.vue';

@Component({
    components: {
        modal: Modal,
        'buff-view': BuffView,
        'job-view': JobView
    }
})
export default class StatSheetView extends CustomDialog {
    @Prop({required: true})
    data!: StatSheet | Job | Buff | null;

    @Prop({required: true})
    clickEvent!: ((j: StatSheet | Job | Buff) => void);

    @Watch('character')
    onNameUpdate(): void {
        this.update();
    }


    @Hook('mounted')
    onMounted(): void {
        this.update();
    }

    update(): void {

    }

    get title(): string | undefined {
        return this.data?.name;
    }

    get tags(): string {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).getTagString();
        return '';
    }

    get convert(): Job | null {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).convertJob;
        return null;
    }

    get desc(): string {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).desc;
        else if (this.data && this.data.constructor.name === 'Buff')
            return (this.data as Buff).desc;
        return '';
    }

    get scaling(): string {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).scaling;
        return '';
    }

    get innate(): Buff | null {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).innate;
        return null;
    }

    get buffs(): Buff[] {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).buffs;
        return [];
    }

    isLastBuff(buff: Buff): boolean {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).buffs[(this.data as Job).buffs.length-1] === buff;
        return false;
    }

    get costAndDrain(): string | null {
        if(this.data && this.data.constructor.name === 'Buff')
            return `Cost: ${(this.data as Buff).cost} | Drained Stat: ${(this.data as Buff).getStat()}`;
        return null;
    }

    get fromJobs(): Job[] {
        if(this.data && this.data.constructor.name === 'Buff')
            return (this.data as Buff).fromJobs;
        return [];
    }

    isLastFrom(job: Job): boolean {
        if(this.data && this.data.constructor.name === 'Buff')
            return (this.data as Buff).fromJobs[(this.data as Buff).fromJobs.length-1] === job;
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
