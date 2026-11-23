<template>
  <div :class="$style.answer" v-html="html"></div>
</template>

<script lang="ts">
import MarkdownIt from 'markdown-it'
import remend from 'remend'
import { computed } from 'vue'

// HTML в ответах модели остаётся текстом, в том числе в примерах верстки.
const markdown = new MarkdownIt('commonmark', {
  html: false,
  breaks: true,
}).disable('image')
</script>

<script setup lang="ts">
const props = defineProps<{ text: string; streaming?: boolean }>()
const html = computed(() => {
  if (!props.streaming) return markdown.render(props.text)
  if (/^\*{1,3}$/.test(props.text.trim())) return ''
  const preview = remend(props.text, {
    links: false,
    images: false,
    katex: false,
  })
  return markdown.render(preview)
})
</script>

<style module lang="scss">
.answer {
  font-size: $size-main;
  overflow-wrap: anywhere;

  > * + * {
    margin-block-start: 0.65em;
  }

  ul,
  ol {
    padding-inline-start: 1.5em;
  }

  li + li,
  li > * + * {
    margin-block-start: 0.3em;
  }

  :is(h1, h2, h3, h4, h5, h6) {
    font-size: 1.1em;
  }

  :not(pre) > code {
    background: #fff;
    border-radius: 4px;
    padding: 0.05em 0.3em;
  }

  pre {
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    margin-block: 0.5em;
    overflow-wrap: normal;
    overflow-x: auto;
    padding: 0.6em 0.8em;
    white-space: pre;
  }
}
</style>
