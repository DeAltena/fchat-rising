<template>
    <modal :buttons="false" ref="dialog" style="width:98%" dialogClass="">
        <template slot="title" v-if="title">
            <span class="title">{{title}} <br>
                <bbcode class="tags" :text="`[b]${tags}[/b]`"></bbcode></span>
        </template>
        <template slot="title" v-else>
            No Data Provided!
        </template>

        <div ref="pageBody" v-if="!data">
            No Data!
        </div>
        <div class="stat-sheet" ref="pageBody" v-else-if="data.constructor.name === 'StatSheet'">

        </div>
        <div class="job-sheet" ref="pageBody" v-else-if="data.constructor.name === 'Job'">
            <div class="desc">{{ desc }}</div>
            <bbcode :text="scaling"></bbcode> | Innate: <bbcode v-if="innate" :text="`${innate.taglessName()}`"></bbcode><span v-else>N/A</span><br>
            <span class="inflict">Inflicts: </span><bbcode :text="`${buffs}`"></bbcode>
        </div>
        <div class="buff-sheet" ref="pageBody" v-else-if="data.constructor.name === 'Buff'">

        </div>

    </modal>
</template>


<script lang="ts">

import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
import CustomDialog from '../../components/custom_dialog';
import Modal from '../../components/Modal.vue';
import {StatSheet} from "./StatSheet";
import {Buff, Job} from "./LevelDrainData";

@Component({
    components: {modal: Modal}
})
export default class StatSheetView extends CustomDialog {
    @Prop({required: true})
    data!: StatSheet | Job | Buff | null;

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

    get desc(): string {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).desc;
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

    get buffs(): string {
        if(this.data && this.data.constructor.name === 'Job')
            return (this.data as Job).getBuffsString();
        return '';
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
    background-color: rgba(0, 0, 0, 0.2);
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
