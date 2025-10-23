<template>
  <div class="main"></div>

  <div class="main">
    <Name />
    <Now @click="$emit('open')" />
    <Target />
    <Graph />
    <TimeLine />
  </div>
</template>

<script setup lang="ts">
import Graph from './components/Graph/index.vue'
import Name from './components/Name.vue'
import Now from './components/Now/index.vue'
import Target from './components/Target.vue'
import TimeLine from './components/TimeLine.vue'

const emit = defineEmits(['open'])
</script>
