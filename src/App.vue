<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>
        BiMark Playground
        <v-tooltip text="Toggle View/Edit">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon @click="toggleView">
              <v-icon v-if="view">mdi-pencil-outline</v-icon>
              <v-icon v-else>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-app-bar-title>
    </v-app-bar>
    <v-navigation-drawer v-model="leftDrawer" location="left">
    </v-navigation-drawer>
    <v-navigation-drawer v-model="rightDrawer" location="right">
    </v-navigation-drawer>
    <v-main>
      <v-textarea
        v-show="!view"
        auto-grow
        clearable
        rows="20"
        v-model="text"
        label="Markdown (BiMark)"
        placeholder="Markdown Content"
        style="margin: 20px"
      ></v-textarea>
      <div
        v-show="view"
        ref="container"
        class="markdown-body"
        style="padding: 32px; border: 1px solid #c4c6ca; margin: 20px"
      ></div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import "./assets/github.css";
import { BiMark } from "bimark";

// mode: edit | view
const view = ref(false);

const leftDrawer = ref(true);
const rightDrawer = ref(true);
const container = ref<HTMLElement | null>(null);
const text = ref(`# [[BiMark]]

BiMark is a tool to auto create [[bidirectional links]] between markdown files.

Once bidirectional links are created, you can use it to navigate between markdown files.`);

const toggleView = () => {
  view.value = !view.value;

  if (view.value) {
    const bm = new BiMark();
    bm.collect("", text.value);
    container.value!.innerHTML = bm.render("", text.value, {
      output: {
        html: true,
      },
    });
  }
};
</script>
