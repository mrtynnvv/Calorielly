<template>
  <Teleport to="body">
    <transition name="overlay-fade" appear>
      <div class="overlay" v-show="open" @click.self="$emit('close')"></div>
    </transition>
    <transition name="modal-anim" appear>
      <div class="mainBlockAdd" v-show="open">
        <div class="close" @click="$emit('close')">
          <img class="img-white" src="@/assets/Add/close.svg" />
          <img class="img-gray" src="@/assets/close-gray.svg" />
        </div>

        <slot />
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
</script>

<style scoped lang="scss">
.overlay {
  background-color: rgb(0 0 0 / 50%);
  bottom: 0;
  height: 100%;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1100;
}

.mainBlockAdd {
  background-color: rgb(255 255 255 / 100%);
  border: 0.5px solid #d9d9d9;
  border-radius: 16px;
  bottom: 35%;
  height: max-content;
  left: 0;
  margin: 0 auto;
  max-width: 400px;
  padding: 0 36px 36px;
  position: fixed;
  right: 0;
  width: 100%;
  z-index: 3301;

  @media (width <=1000px) {
    bottom: 1%;
  }

  .close {
    background-color: rgb(0 0 0 / 40%);
    border-radius: 100%;
    color: #666;
    float: right;
    margin-right: -80px;
    margin-top: 14px;
    padding: 4px;
    transition: 0.3s;

    &:hover {
      background-color: rgb(0 0 0 / 50%);
      color: #9b9b9b;
      cursor: pointer;
      transition: 0.3s;
    }

    @media (width <=1000px) {
      background: none;
      margin-right: -20px;

      .img-white {
        display: none;
      }
    }

    @media (width >1000px) {
      .img-gray {
        display: none;
      }
    }
  }
}
</style>
