<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>
        BiMark Playground
        <v-tooltip text="Toggle View/Edit">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon @click="view = !view">
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
      <Edit v-if="!view" :text="text"></Edit>
      <View v-else :text="text"></View>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Edit from "./components/Edit.vue";
import View from "./components/View.vue";
import "./assets/github.css";

// mode: edit | view
const view = ref(false);

const leftDrawer = ref(true);
const rightDrawer = ref(true);

const text = ref(`# [[BiMark]]

BiMark is a tool to auto create [[bidirectional links]] between markdown files.

Once bidirectional links are created, you can use it to navigate between markdown files.`);
</script>
