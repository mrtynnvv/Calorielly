<template>
  <RouterView v-slot="{ Component, route }">
    <!-- компоненты без хедера и меню -->
    <template v-if="route.meta.blank">
      <component :is="Component" />
    </template>
    <!-- компоненты с хедером и меню -->
    <template v-else>
      <Header />

      <div class="all">
        <div class="leftbar">
          <LeftBar />
        </div>

        <div class="main">
          <component :is="Component" />

          <Footer class="footer" />
        </div>
      </div>
    </template>
  </RouterView>

  <RouterView name="modal" />
</template>

<script setup lang="ts">
import Footer from '@/components/blocks/Footer.vue'
import Header from '@/components/blocks/Header/index.vue'
import LeftBar from '@/components/blocks/LeftBar.vue'
</script>

<style scoped>
.all {
  display: flex;
  margin: 0 auto;
  margin-top: 70px;
  max-width: 900px;
  width: 100%;
}

.main {
  width: 100%;
}

@media (width <=1000px) {
  .leftbar {
    display: none;
  }

  .all {
    padding: 10px 6px;
    padding-bottom: 60px;
  }
}

@media (width >=1000px) {
  .footer {
    display: none;
  }
}
</style>
