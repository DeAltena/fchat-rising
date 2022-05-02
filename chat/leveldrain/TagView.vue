<!-- Linebreaks inside this template will break the inline display -->
<template><span class="tag-view" :class="tag.getClass()" @click="onClick()" @mouseover.prevent="show()" @mouseenter.prevent="show()" @mouseleave.prevent="dismiss()" @click.middle.prevent.stop="toggleStickyness()" @click.right.passive="dismiss(true)" @click.left.passive="dismiss(true)">{{ tag.getTaglessName() }}</span></template>


<script lang="ts">
import {Component, Hook, Prop} from '@f-list/vue-ts';
import Vue from 'vue';
import {Buff, Job, Tag} from './LevelDrainData';
import {EventBus} from '../preview/event-bus';
import {StatSheet} from './StatSheet';


@Component({
    components: {}
})
export default class TagView extends Vue {
    @Prop({required: true})
    readonly tag!: Tag;

    @Prop()
    readonly clickEvent: ((j: StatSheet | Job | Buff | Tag) => void) | undefined = undefined;

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
        EventBus.$emit('imagepreview-dismiss', {url: this.getTagUrl(this.tag), force});
    }


    show(): void {
        EventBus.$emit('imagepreview-show', {url: this.getTagUrl(this.tag)});
    }


    toggleStickyness(): void {
        EventBus.$emit('imagepreview-toggle-stickyness', {url: this.getTagUrl(this.tag)});
    }

    getTagUrl(tag: Tag): string {
        return `tag://${tag.getTaglessName()}`;
    }

    onClick(): void {
        if (this.clickEvent)
            this.clickEvent(this.tag);
    }
}
</script>
<style lang="scss">
.tag-view {
    cursor: pointer;
}

.tag-view:hover {
    text-decoration: underline;
}
</style>