<template>
  <v-container>
    <v-textarea
      auto-grow
      clearable
      rows="20"
      v-model="_text"
      label="Markdown (BiMark)"
      placeholder="Markdown Content"
      @update="$emit('update:text', _text)"
    ></v-textarea>
  </v-container>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const _text = ref(props.text);
</script>
