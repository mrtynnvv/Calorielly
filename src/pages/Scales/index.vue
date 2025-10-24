<template>
  <div class="mainBlockScales">
    <div class="title">Калькулятор граммов</div>

    <div class="nameInput">Калорийность продукта</div>

    <UiInput
      placeholder="Ккал/100гр"
      v-model.number="stoGR"
      @update:modelValue="chetGR()"
      type="number"
    />

    <div class="nameInput">Желаемая калорийность</div>

    <UiInput
      placeholder="Нужно калорий"
      v-model.number="ccalGR"
      @update:modelValue="chetGR()"
      type="number"
    />

    <button class="buttonGo" disabled>
      {{ itogGR }} грамм
      <p>Положите на весы</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import UiInput from '@/components/ui/UiInput.vue'

let stoGR = ref<number | null>(null)
let ccalGR = ref<number | null>(null)
let itogGR = ref<number>(0)
function chetGR() {
  if (stoGR.value && stoGR.value > 0 && ccalGR.value) {
    itogGR.value = Math.floor(ccalGR.value / (stoGR.value / 100))
  } else {
    itogGR.value = 0
  }
}
</script>

<style scoped lang="scss">
.mainBlockScales {
  background-color: #fff;
  border: 0.5px solid #d9d9d9;
  border-radius: 16px;
  padding: 20px 22px;

  .title {
    font-size: 17px;
    font-weight: 600;
  }

  .nameInput {
    color: rgb(88 99 111);
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 4px;
    margin-top: 18px;
  }

  .buttonGo {
    background-color: rgb(245 245 245);
    border: none;
    border-radius: 7px;
    color: #000;
    font-size: 17px;
    font-weight: 600;
    margin-top: 20px;
    padding: 8px 0;
    width: 100%;

    p {
      color: rgb(88 99 111);
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
