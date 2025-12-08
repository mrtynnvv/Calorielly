<template>
    <!-- <Teleport to="body">
      <div class="overlay" ></div>


  </Teleport> -->
    <UiBlock class="ui-block">
        <div class="desktop">
            <div class="icon">
                <img src="@/assets/default_avatar.png" />
            </div>

            <div class="text">
                <p class="t-title">Guest</p>
                <p class="t-comment">ID: 0</p>
            </div>
        </div>
        <div class="section">
            <img src="@/assets/Header/logout.svg"></img>
            <span class="t-main">Выйти</span>
        </div>

    </UiBlock>
</template>

<script setup lang="ts">
import UiBlock from '@/components/ui/UiBlock.vue';
</script>

<style scoped lang="scss">
.ui-block {
    padding: 8px;
    width: 280px;

    @media (width <=720px) {
        & {
            margin: 7px;
            width: calc(100% - 14px);
        }
    }

    .desktop {
        align-items: center;
        justify-content: center;
        padding: 14px;
        text-align: center;

        .icon {
            img {
                margin: 0 auto;
                width: 48px;
            }
        }

        @media (width <=720px) {
            & {
                display: none;
            }
        }
    }

    .section {
        padding: 14px;
        transition: 0.3s;

        &:hover {
            background-color: rgb(242 242 242);
            border-radius: 12px;
            cursor: pointer;
            transition: 0.3s;
        }

        img {
            float: left;
            margin-right: 10px;
            margin-top: -4px;
            stroke: #2688EB;
            width: 32px;
        }

    }

}
</style>