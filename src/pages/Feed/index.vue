<template>
  <div class="main"></div>

  <div class="main">
    <Name />
    <Now @click="$emit('open')" />
    <Target />
    <Graph />
    <TimeLine />
    <ToAuth v-if="IS_DEMO" class="to-auth" />
  </div>
</template>

<script setup lang="ts">
import Graph from './components/Graph/index.vue'
import Name from './components/Name.vue'
import Now from './components/Now/index.vue'
import Target from './components/Target.vue'
import TimeLine from './components/TimeLine.vue'

import ToAuth from '@/components/blocks/ToAuth.vue'

const emit = defineEmits(['open'])

const IS_DEMO =
  location.hostname.startsWith('demo.') || location.pathname.startsWith('/demo')
</script>

<style scoped lang="scss">
@media (width >1000px) {
  .to-auth {
    display: none;
  }
}
</style>
