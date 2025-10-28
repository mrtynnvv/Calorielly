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
    <RouterLink to="/history">
      <div class="section">
        <img src="@/assets/LeftBar/history.svg"></img>

        <span>История</span>
      </div>
    </RouterLink>
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

  <!-- <UiBlock class="ui-block">

    <a href="/auth">
      <div class="section">

        <img src="@/assets/LeftBar/left-arrow.svg"></img>
        <span>Вернуться к авторизации</span>
      </div>
    </a>

  </UiBlock> -->

  <ToAuth v-if="IS_DEMO" class="ui-block">

    <a href="/auth">
      <div class="section">

        <img src="@/assets/LeftBar/left-arrow.svg"></img>
        <span>Вернуться к авторизации</span>
      </div>
    </a>

  </ToAuth>
</template>

<script setup lang='ts'>
import ToAuth from '@/components/blocks/ToAuth.vue';
import UiBlock from '@/components/ui/UiBlock.vue';
const IS_DEMO = location.hostname.startsWith('demo.') || location.pathname.startsWith('/demo')

</script>

<style scoped lang="scss">
.ui-block {
  margin-bottom: 2px;
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
