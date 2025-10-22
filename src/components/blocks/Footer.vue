<template>
  <div class="mainBlockFooter">
    <RouterLink to="/feed">
      <div class="blockItem">
        <img class="icon1" src="@/assets/Footer/home.svg"></img>
        <div class="textUnderIcon">Главная</div>
      </div>
    </RouterLink>

    <RouterLink to="/scales">
      <div class="blockItem">
        <img class="icon1" src="@/assets/Footer/scales.svg"></img>
        <div class="textUnderIcon">Весы</div>
      </div>
    </RouterLink>

    <a>
      <div class="blockItem" @click="$emit('open')">
        <img class="icon1" src="@/assets/Footer/add.svg"></img>
        <div class="textUnderIcon">Добавить</div>
      </div>
    </a>

    <RouterLink to="/settings">
      <div class="blockItem">
        <img class="icon1" src="@/assets/Footer/settings.svg"></img>
        <div class="textUnderIcon">Настройки</div>
      </div>
    </RouterLink>
    <RouterLink to="/profile">
      <div class="blockItem">
        <img class="icon1" src="@/assets/Footer/auth.svg"></img>
        <div class="textUnderIcon">Аккаунт</div>
      </div>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">

const emit = defineEmits(['open'])

defineProps({
  msg: String,
})
</script>

<style scoped lang="scss">
.mainBlockFooter {
  background-color: #fff;
  border-top: 0.5px solid #d9d9d9;
  bottom: 0;
  display: flex;
  height: 52px;
  justify-content: space-around;
  left: 0;
  padding: 4px 0;
  position: fixed;
  right: 0;
  z-index: 1050;

    & :deep(a) { // ибо routerLink после рендера будет <a> 
    text-decoration: none;
  }

  .router-link-active {
    .blockItem {
      color: #2688EB;
      filter: invert(52%) sepia(93%) saturate(4900%) hue-rotate(203deg) brightness(99%) contrast(101%);
    }
  }



.blockItem {
  align-items: center;
  color: #a4a4a6;
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: 10px;
  font-weight: 500;

  .icon1 {
  color: #959595;
  height: 28px;
  width: 28px;
}

.textUnderIcon {
  margin-top: 2px;
}
}





}




</style>
