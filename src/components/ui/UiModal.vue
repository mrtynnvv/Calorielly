<template>
  <Teleport to="body">
    <transition name="overlay-fade" appear>
      <div class="overlay" v-show="open" @click.self="$emit('close')"></div>
    </transition>
    <transition name="modal-anim" appear>
      <div class="mainBlockAdd" v-show="open">
        <div class="close" @click="$emit('close')">
          <img class="img-white" src="@/assets/close.svg" />
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
  margin: 0 auto;
  max-height: 99dvh;
  max-width: 400px;
  padding: 0 36px 36px;
  position: fixed;
  width: 100%;
  z-index: 3301;

  @media (width >1000px) {
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
  }

  @media (width <=1000px) {
    inset: auto 0 0;
  }

  .close {
    background-color: rgb(0 0 0 / 40%);
    border-radius: 100%;
    color: #666;
    padding: 4px;
    position: absolute;
    right: -45px;
    top: 14px;
    transition: 0.3s;

    &:hover {
      background-color: rgb(0 0 0 / 50%);
      color: #9b9b9b;
      cursor: pointer;
      transition: 0.3s;
    }

    @media (width <=1000px) {
      background: none;
      right: 10px;
      top: 10px;

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

/* для модалок: десктоп - плавное появление, моб - выезжает снизу */
.modal-anim-enter-active,
.modal-anim-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
  will-change: transform, opacity;
}

@media (width < 1000px) {
  .modal-anim-enter-from,
  .modal-anim-leave-to {
    opacity: 0.001;
    transform: translateY(100%);
  }

  .modal-anim-enter-to,
  .modal-anim-leave-from {
    opacity: 1;
    transform: translateY(0%);
  }
}

@media (width >=1000px) {
  .modal-anim-enter-active,
  .modal-anim-leave-active {
    transition: opacity 0.25s ease;
    will-change: opacity;
  }

  .modal-anim-enter-from,
  .modal-anim-leave-to {
    opacity: 0;
  }

  .modal-anim-enter-to,
  .modal-anim-leave-from {
    opacity: 1;
  }
}
</style>
