<template>
    <div class="job-preview">
        <div v-if="job" class="row">
            <div class="col-12">
                <h1 class="user-view">
                    <span class="job-name">{{ job.name }}</span>
                </h1>
                <bbcode :text="`[b]\t${job.getTagString()}[/b]`"></bbcode>
                <h3 class="desc">{{ job.desc }}</h3>
                <bbcode :text="job.scaling"></bbcode> | Innate: <bbcode v-if="job.innate" :text="`${job.innate.taglessName()}`"></bbcode><span v-else>N/A</span><br>
                <bbcode :text="`[b]Inflicts:[/b] ${job.getBuffsString()}`"></bbcode>

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
import {Job, JobRepository} from "./LevelDrainData";

@Component({
    components: {
        bbcode: BBCodeView(core.bbCodeParser)
    }
})
export default class JobPreview extends Vue {
    job?: Job;
    jobName: string = '';


    @Hook('mounted')
    mounted(): void {
        this.load(this.jobName, true);
    }


    @Hook('beforeDestroy')
    beforeDestroy(): void {

    }


    load(jobName: string, force: boolean = false): void {
        if (
            (this.jobName === jobName)
            && (!force)
        ) {
            return;
        }

        this.jobName = jobName;

        setTimeout(async () => {
            this.job = JobRepository.getInstance().getJob(jobName) as Job;
        }, 0);
    }
}
</script>

<style lang="scss">
.job-preview {
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
