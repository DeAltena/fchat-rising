<!-- Linebreaks inside this template will break the inline display -->
<template><span class="job-view" :style="underlined ? 'text-decoration: underline;' : ''" @click="onClick()" @mouseover.prevent="show()" @mouseenter.prevent="show()" @mouseleave.prevent="dismiss()" @click.middle.prevent.stop="toggleStickyness()"  @click.right.passive="dismiss(true)" @click.left.passive="dismiss(true)">{{job.name}}</span></template>


<script lang="ts">
import { Component, Hook, Prop } from '@f-list/vue-ts';
import Vue from 'vue';
import {Buff, Job} from "./LevelDrainData";
import {EventBus} from "../preview/event-bus";
import {StatSheet} from "./StatSheet";


@Component({
    components: {

    }
})
export default class JobView extends Vue {
    @Prop({required: true})
    readonly job!: Job;

    @Prop()
    readonly clickEvent: ((j: StatSheet | Job | Buff) => void) | undefined = undefined;

    @Prop()
    readonly underlined = false;

    @Hook('mounted')
    onMounted(): void {
        this.update();
    }

    @Hook('beforeDestroy')
    onBeforeDestroy(): void {
        this.dismiss();
    }

    @Hook('deactivated')
    deactivate(): void {
        this.dismiss();
    }

    @Hook('beforeUpdate')
    onBeforeUpdate(): void {
        this.update();
    }

    update(): void {

    }

    dismiss(force: boolean = false): void {
        EventBus.$emit('imagepreview-dismiss', {url: this.getJobUrl(this.job), force});
    }


    show(): void {
        EventBus.$emit('imagepreview-show', {url: this.getJobUrl(this.job)});
    }


    toggleStickyness(): void {
        EventBus.$emit('imagepreview-toggle-stickyness', {url: this.getJobUrl(this.job)});
    }

    getJobUrl(job: Job): string {
        return `job://${job.name}`;
    }

    onClick(): void {
        if(this.clickEvent)
            this.clickEvent(this.job);
    }
}
</script>
<style lang="scss">
.job-view {
    cursor: pointer;
}

.job-view:hover {
    text-decoration: underline;
}
</style>