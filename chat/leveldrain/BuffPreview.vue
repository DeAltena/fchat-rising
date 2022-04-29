<template>
    <div class="buff-preview">
        <div v-if="buff" class="row">
            <div class="col-12">
                <h1 class="user-view">
                    <span class="buff-name" :class="buff.getClass()">{{ buff.taglessName() }}</span>
                </h1>
                Cost: {{ buff.cost }} | Drained Stat: {{ buff.getStat() }}
                <h3 class="desc">{{ buff.desc }}</h3>
                <bbcode :text="`[b]From:[/b] `"></bbcode>
                <template v-for="job in buff.fromJobs"> <job-view :job="job"></job-view><span v-if="buff.fromJobs[buff.fromJobs.length - 1] !== job">, </span></template>
            </div>
        </div>
        <div v-else>
            Loading...
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Hook} from '@f-list/vue-ts';
import Vue from 'vue';
import core from '../core';
import {BBCodeView} from '../../bbcode/view';
import {Buff, BuffRepository} from "./LevelDrainData";
import JobView from "./JobView.vue";

@Component({
    components: {
        bbcode: BBCodeView(core.bbCodeParser),
        'job-view': JobView
    }
})
export default class JobPreview extends Vue {
    buff?: Buff;
    buffName: string = '';


    @Hook('mounted')
    mounted(): void {
        this.load(this.buffName, true);
    }


    @Hook('beforeDestroy')
    beforeDestroy(): void {

    }


    load(buffName: string, force: boolean = false): void {
        if (
            (this.buffName === buffName)
            && (!force)
        ) {
            return;
        }

        this.buffName = buffName;

        setTimeout(async () => {
            this.buff = BuffRepository.getInstance().getBuff(this.buffName) as Buff;
        }, 0);
    }
}
</script>

<style lang="scss">
.buff-preview {
    padding: 10px;
    padding-right: 15px;
    background-color: var(--input-bg);
    max-height: 100%;
    overflow: hidden;
    opacity: 0.95;
    border-radius: 0 5px 5px 5px;
    border: 1px solid var(--secondary);


    h1 {
        line-height: 100%;
        margin-bottom: 0;
        font-size: 2em;
        display: inline;
    }

    h3 {
        font-size: 1.1rem;
        color: var(--dark);
    }

    .desc {
        display: block;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 5px;
        margin-top: 1.3rem;
    }
}
</style>
