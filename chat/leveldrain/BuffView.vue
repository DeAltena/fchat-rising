<!-- Linebreaks inside this template will break the inline display -->
<template><span class="buff-view" :class="coloured ? buff.getClass() : ''" @click="onClick()" @mouseover.prevent="show()" @mouseenter.prevent="show()" @mouseleave.prevent="dismiss()" @click.middle.prevent.stop="toggleStickyness()"  @click.right.passive="dismiss(true)" @click.left.passive="dismiss(true)">{{ buff.taglessName() }}</span></template>


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
export default class BuffView extends Vue {
    @Prop({required: true})
    readonly buff!: Buff;

    @Prop
    readonly coloured = true;

    @Prop()
    readonly clickEvent: ((j: StatSheet | Job | Buff) => void) | undefined = undefined;

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
        EventBus.$emit('imagepreview-dismiss', {url: this.getBuffUrl(this.buff), force});
    }


    show(): void {
        EventBus.$emit('imagepreview-show', {url: this.getBuffUrl(this.buff)});
    }


    toggleStickyness(): void {
        EventBus.$emit('imagepreview-toggle-stickyness', {url: this.getBuffUrl(this.buff)});
    }

    getBuffUrl(buff: Buff): string {
        return `buff://${buff.name}`;
    }

    onClick(): void {
        if(this.clickEvent)
            this.clickEvent(this.buff);
    }
}
</script>
<style lang="scss">
@import "~bootstrap/scss/functions";
@import "../../scss/functions";
@import "../../scss/themes/variables/default_variables";
@import "~bootstrap/scss/variables";
@import "../../scss/flist_derived";
@import "../../scss/themes/variables/default_derived";

.buff-view {
    cursor: pointer;
}

.buff-view:hover {
    text-decoration: underline;
}

.buff-view .redText {
    text-decoration-color: $red-color;
}

.blueText {
    text-decoration-color: $blue-color;
}

.greenText {
    text-decoration-color: $green-color;
}

.yellowText {
    text-decoration-color: $yellow-color;
}

.cyanText {
    text-decoration-color: $cyan-color;
}

.purpleText {
    text-decoration-color: $purple-color;
}

.brownText {
    text-decoration-color: $brown-color;
}

.pinkText {
    text-decoration-color: $pink-color;
}

.grayText {
    text-decoration-color: $gray-color;
}

.orangeText {
    text-decoration-color: $orange-color;
}

.whiteText {
    text-decoration-color: $white-color;
}

.blackText {
    text-decoration-color: $black-color;
}
</style>