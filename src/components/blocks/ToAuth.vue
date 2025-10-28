<template>

  <UiBlock class="uiBlock">

    <a href="/auth">
      <div class="section">

        <img src="@/assets/LeftBar/left-arrow.svg"></img>
        <span>Вернуться к авторизации</span>
      </div>
    </a>

  </UiBlock>


</template>

<script setup lang='ts'>
import UiBlock from '@/components/ui/UiBlock.vue';


</script>

<style scoped lang="scss">
.uiBlock {
  margin-bottom: 2px;
  margin-right: 20px;
  padding: 8px;
  text-decoration: none;
  width: 320px;
  width: 100%;

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
