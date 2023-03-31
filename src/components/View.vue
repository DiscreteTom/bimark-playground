<template>
  <v-container>
    <div ref="container" class="markdown-body"></div>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, defineProps, ref } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const container = ref<HTMLElement | null>(null);

onMounted(async () => {
  const bimark = await import("bimark");
  const bm = new bimark.BiMark();
  bm.collect("", props.text);
  container.value!.innerHTML = bm.render("", props.text, {
    output: {
      html: true,
    },
  });
});
</script>
