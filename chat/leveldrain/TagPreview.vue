<template>
    <div class="tag-preview">
        <div v-if="tag" class="row">
            <div class="col-12">
                <h1 class="user-view">
                    <span class="tag-name" :class="tag.getClass()">{{ tag.getTaglessName() }}</span>
                </h1>
                <h3 class="desc"><template v-for="feature in tag.features"><bbcode :text="feature"></bbcode><br></template></h3>
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
import {Tag, TagRepository} from './LevelDrainData';

@Component({
    components: {
        bbcode: BBCodeView(core.bbCodeParser),
    }
})
export default class JobPreview extends Vue {
    tag?: Tag;
    tagName: string = '';


    @Hook('mounted')
    mounted(): void {
        this.load(this.tagName, true);
    }


    @Hook('beforeDestroy')
    beforeDestroy(): void {

    }


    load(tagName: string, force: boolean = false): void {
        if (
            (this.tagName === tagName)
            && (!force)
        ) {
            return;
        }

        this.tagName = tagName;

        setTimeout(async () => {
            this.tag = TagRepository.getInstance().getTag(this.tagName) as Tag;
        }, 0);
    }
}
</script>

<style lang="scss">
.tag-preview {
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
