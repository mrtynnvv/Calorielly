<template>
  <UiBlock class="ui-block">
    <!-- <div class="mainLeftBar"> -->
    <RouterLink to="/feed">
      <div class="section">

        <img src="@/assets/LeftBar/home.svg"></img>
        <span>Главная</span>
      </div>
    </RouterLink>

    <RouterLink to="/scales">
      <div class="section">

        <img src="@/assets/LeftBar/scales.svg"></img>
        <span>Весы</span>
      </div>
    </RouterLink>
    <div class="section" @click="$emit('open')">
      <img src="@/assets/LeftBar/add.svg"></img>
      Добавить значение
    </div>
    <RouterLink to="/settings">
      <div class="section">
        <img src="@/assets/LeftBar/settings.svg"></img>

        <span>Настройки</span>
      </div>
    </RouterLink>
    <RouterLink to="/profile">
      <div class="section">
        <img src="@/assets/LeftBar/auth.svg"></img>
        <span>Аккаунт</span>
      </div>
    </RouterLink>
    <!-- </div> -->
  </UiBlock>
</template>

<script setup lang='ts'>
import UiBlock from '@/components/ui/UiBlock.vue';

const emit = defineEmits(['open'])
defineProps({
  msg: String,
})
</script>

<style scoped lang="scss">
.ui-block {
  margin-right: 20px;
  padding: 8px;
  text-decoration: none;
  width: 320px;

  .router-link-active {
    .section {
      background-color: rgb(242 242 242);
      border-radius: 12px;
      cursor: pointer;
      transition: 0.3s;
    }
  }

  .section {
    padding: 14px;
    text-decoration: none;
    transition: 0.3s;

    &:hover {
      background-color: rgb(242 242 242);
      border-radius: 12px;
      cursor: pointer;
      transition: 0.3s;
    }
  }

  img {
    float: left;
    margin-right: 10px;
    margin-top: -5px;
    stroke: #2688EB;
    width: 32px;
  }


  & :deep(a) {
    color: black;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
  }
}
</style>
