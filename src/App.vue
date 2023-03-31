<template>
  <v-app>
    <v-app-bar>
      <v-tooltip text="Toggle TOC" location="bottom">
        <template v-slot:activator="{ props }">
          <v-app-bar-nav-icon
            v-bind="props"
            @click="leftDrawer = !leftDrawer"
          ></v-app-bar-nav-icon>
        </template>
      </v-tooltip>
      <v-app-bar-title>
        BiMark Playground
        <v-tooltip text="Toggle View/Edit" location="right">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon @click="toggleView">
              <v-icon v-if="view">mdi-pencil-outline</v-icon>
              <v-icon v-else>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-app-bar-title>
      <template v-slot:append>
        <v-tooltip text="Toggle Reversed References" location="left">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon @click="rightDrawer = !rightDrawer">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="leftDrawer" location="left">
      <v-list nav density="compact">
        <v-list-item>Table of Content</v-list-item>
        <v-divider></v-divider>
        <v-list-item
          v-for="link in tocLinks"
          :key="link.href"
          :href="link.href"
          density="compact"
        >
          <span v-for="x in link.lvl - 1" :key="x" class="ml-3"></span>
          <span :style="{ 'font-weight': 1000 / link.lvl }">
            {{ link.title }}
          </span>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="rightDrawer" location="right">
      <v-list nav density="compact">
        <v-list-item>Reverse References</v-list-item>
        <v-divider></v-divider>
        <v-list-item
          v-for="link in reverseLinks"
          :key="link.href"
          :href="link.href"
          density="compact"
        >
          {{ link.title }}
        </v-list-item>
      </v-list>
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
import { ref, watch, onMounted } from "vue";
import "./assets/github.css";
import { BiMark } from "bimark";
import { parse } from "node-html-parser";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import { useRoute } from "vue-router";

// mode: edit | view
const view = ref(false);
let bm = new BiMark();
const leftDrawer = ref(true);
const rightDrawer = ref(true);
const tocLinks = ref<{ title: string; href: string; lvl: number }[]>([]);
const reverseLinks = ref<{ title: string; href: string }[]>([]);
const container = ref<HTMLElement | null>(null);
const route = useRoute();
const text = ref(`# [[BiMark]]

BiMark is a tool to auto create [[bidirectional links]] between markdown files.

Once bidirectional links are created, you can use it to navigate between markdown files.`);

const toggleView = () => {
  view.value = !view.value;
  if (view.value) {
    render();
  }
};

watch(
  () => route?.hash,
  () => {
    if (route?.hash.length > 1) updateReverseLinks(route?.hash.slice(1));
  }
);

onMounted(() => {
  if (route?.hash.length > 1) updateReverseLinks(route?.hash.slice(1));
});

const render = async () => {
  bm = new BiMark();
  // render html
  bm.collect("", text.value);
  const markdown = bm.render("", text.value);
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .process(markdown)
  );
  container.value!.innerHTML = html;

  // collect toc links
  tocLinks.value = [];
  parse(html)
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .forEach((el) => {
      tocLinks.value.push({
        title: el.text,
        href: `#${el.id}`,
        lvl: Number(el.tagName[1]),
      });
    });
};

const updateReverseLinks = (hash: string) => {
  reverseLinks.value = [];
  bm.id2def.get(hash)?.refs.forEach((ref) => {
    reverseLinks.value.push({
      title: `Line: ${ref.fragment.position.start.line}`,
      href: "#" + bm.refIdGenerator(ref),
    });
  });
};
</script>
