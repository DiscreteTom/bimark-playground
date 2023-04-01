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
        <v-divider class="mb-3"></v-divider>
        <v-list-item v-if="tocLinks.length == 0">
          <span style="font-weight: bold; color: gray">
            Render the Markdown with Headings to see the Toc.
          </span>
        </v-list-item>
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
        <v-divider class="mb-3"></v-divider>
        <v-list-item v-if="reverseLinks.length == 0">
          <span style="font-weight: bold; color: gray">
            Select a Definition to see reverse references in View Mode
          </span>
        </v-list-item>
        <v-list-item
          v-for="link in reverseLinks"
          :key="link.href"
          :href="link.href"
          density="compact"
          @mouseenter="showArrow($event, link.href)"
          @mouseleave="removeArrow"
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
import * as d3 from "d3";

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
  () => route.hash,
  () => updateReverseLinks()
);

onMounted(() => {
  updateReverseLinks();
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
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeStringify, { allowDangerousHtml: true })
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

  updateReverseLinks();
};

const updateReverseLinks = () => {
  const id = route.hash.slice(1);
  reverseLinks.value = [];
  bm.id2def.get(id)?.refs.forEach((ref) => {
    const line = text.value.split("\n")[ref.fragment.position.start.line - 1];
    const before = line.slice(0, ref.fragment.position.start.column - 1);
    const after = line.slice(ref.fragment.position.end.column);
    reverseLinks.value.push({
      title: before + "..." + after,
      href: "#" + ref.id,
    });
  });
  removeArrow();
};

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight)
  .style("position", "absolute")
  .style("top", 0)
  .style("pointer-events", "none");
const showArrow = (e: MouseEvent, targetHash: string) => {
  removeArrow();

  // Select the two elements to connect
  const fromElement = d3.select(e.target as HTMLElement);
  const toElement = d3.select(targetHash);

  // Get the positions of the two elements
  const fromRect = fromElement.node()!.getBoundingClientRect();
  const toRect = (toElement.node()! as Element).getBoundingClientRect();

  // Define the shape of the folded line
  var line = d3
    .line()
    .x(function (d) {
      return d[0];
    })
    .y(function (d) {
      return d[1];
    })
    .curve(d3.curveBasis);

  // Create an array of points for the folded line
  var points = [
    [fromRect.left + fromRect.width / 2, fromRect.top + fromRect.height / 2],
    [
      fromRect.left + fromRect.width / 2,
      (fromRect.top + toRect.top + toRect.height) / 2,
    ],
    [
      toRect.left + toRect.width / 2,
      (fromRect.top + toRect.top + toRect.height) / 2,
    ],
    [toRect.left + toRect.width / 2, toRect.top + toRect.height / 2],
  ] as [number, number][];

  // Create a marker for the arrowhead
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 8)
    .attr("refY", 5)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z");

  // Draw the folded line
  svg
    .append("path")
    .attr("d", line(points))
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .attr("marker-end", "url(#arrowhead)");
};
const removeArrow = () => {
  svg.selectAll("*").remove();
};
</script>
