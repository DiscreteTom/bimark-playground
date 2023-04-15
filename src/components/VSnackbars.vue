<template>
  <div>
    <v-snackbar
      v-for="(s, i) in snackbars"
      :key="s.id"
      v-model="s.show"
      :timeout="timeout"
      :color="color"
      :style="{
        marginBottom: `${
          (snackbars.slice(i).filter((s) => s.show).length - 1) * 50 + 8
        }px`,
      }"
    >
      <template v-slot:actions>
        <v-btn text @click="remove(s.id)"> Close </v-btn>
      </template>
      {{ s.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineExpose } from "vue";

const snackbars = ref<{ show: boolean; message: string; id: number }[]>([]);
const props = defineProps({
  timeout: {
    type: Number,
    default: 5000,
  },
  color: {
    type: String,
  },
});

let currentId = 0;
const append = (message: string) => {
  const id = currentId++;
  snackbars.value.push({ show: true, message, id: currentId });
  setTimeout(() => {
    remove(id);
  }, props.timeout);
};
const remove = (id: number) => {
  // set invisible
  snackbars.value = snackbars.value.map((s) => {
    if (s.id === id) {
      s.show = false;
    }
    return s;
  });
  // remove after timeout
  setTimeout(() => {
    snackbars.value = snackbars.value.filter((s) => s.id !== id); // remove by id
  }, 2000);
};

defineExpose({
  append,
  remove,
});
</script>
