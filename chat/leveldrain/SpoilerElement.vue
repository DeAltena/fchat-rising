<template>
  <a href="#" v-if="hidden" @click="show()">
    [click to show spoiler]
  </a>
  <span v-else>
    <template v-for="[job, str] in jobs">
      <job-view :job="job" :underlined="true" :click-event="clickEvent"></job-view>{{ str }}<br>
    </template>
  </span>
</template>

<script lang="ts">
import {Component, Prop} from '@f-list/vue-ts';
import {Buff, Job, Tag} from './LevelDrainData';
import JobView from './JobView.vue';
import {StatSheet} from './StatSheet';
import Vue from 'vue';

@Component({
  components: {
    'job-view': JobView
  }
})
export default class SpoilerElement extends Vue {
  @Prop({required: true})
  jobs!: [Job, string][];
  @Prop()
  readonly clickEvent: ((j: StatSheet | Job | Buff | Tag) => void) | undefined = undefined;

  hidden = true;

  show(): void {
    this.hidden = false;
  }
}
</script>

<style lang="scss">

</style>
