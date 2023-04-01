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
          :key="link.to"
          :to="link.to"
          density="compact"
        >
          <span v-for="x in link.lvl - 1" :key="x" class="ml-3"></span>
          <span :style="{ 'font-weight': 1000 / link.lvl }">
            {{ link.title }}
          </span>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="rightDrawer"
      location="right"
      @scroll.capture="updateArrow"
    >
      <v-list nav density="compact" v-if="reverseLinks.length == 0">
        <v-list-item>
          <span style="font-weight: bold; color: gray">
            Select a Definition to see reverse references in View Mode
          </span>
        </v-list-item>
      </v-list>
      <v-list nav density="compact" v-else>
        <v-list-item>
          <span style="font-weight: bold; color: gray"> Definition </span>
        </v-list-item>
        <v-list-item
          :to="'#' + reverseLinks[0].ref.def.id"
          density="compact"
          @mousemove="showArrow($event, '#' + reverseLinks[0].ref.def.id)"
          @mouseleave="removeArrow"
          >{{ reverseLinks[0].ref.def.name }}</v-list-item
        >
        <v-divider class="mb-3"></v-divider>
        <v-list-item style="font-weight: bold; color: gray">
          <span> Reverse References </span>
        </v-list-item>
        <v-list-item
          v-for="link in reverseLinks"
          :key="link.to"
          :to="link.to"
          density="compact"
          @mousemove="showArrow($event, link.to)"
          @mouseleave="removeArrow"
        >
          {{ link.title }}
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main v-scroll="updateArrow">
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
import { BiMark, Reference } from "bimark";
import { parse } from "node-html-parser";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import { useRoute, useRouter } from "vue-router";
import * as d3 from "d3";

// mode: edit | view
const view = ref(false);
let bm = new BiMark();
const leftDrawer = ref(true);
const rightDrawer = ref(true);
const tocLinks = ref<{ title: string; to: string; lvl: number }[]>([]);
const reverseLinks = ref<{ title: string; to: string; ref: Reference }[]>([]);
const container = ref<HTMLElement | null>(null);
const indicateFrom = ref<d3.Selection<
  HTMLElement,
  unknown,
  null,
  undefined
> | null>(null);
const indicateTo = ref<d3.Selection<
  d3.BaseType,
  unknown,
  HTMLElement,
  any
> | null>(null);
const route = useRoute();
const router = useRouter();
const text = ref(`# [[BiMark]]

BiMark is a tool to auto create [[bidirectional links]] between markdown files.

Once bidirectional links are created, you can use it to navigate between markdown files.

## [[Definition|definition]]

You can create definitions by using double square brackets. For example, \`[[BiMark]]\` is a definition.

For advanced usage, you can use \`|\` to specify the alias of the definition. For example, \`[[BiMark|bimark]]\` is a definition with alias \`bimark\`.
You can also use \`:\` to specify the id of the definition. For example, \`[[BiMark:bm]]\` is a definition with id \`bm\`.

As you can see, you can create definitions in paragraphs, headings, quotes, lists, etc.

### This is a [[heading]]

> This is a [[quote]].

- This is a [[list]].

## [[Reference|reference]]

BiMark will auto identify references and create bidirectional links between definitions and references.

You can auto explicitly create references. For example, \`[[@BiMark]]\` or \`[[#bimark]]\`.

If you don't want some content to be a reference, you can use \`!\` to escape it. For example, [[!this sentence will not be a reference.]]

## Other Playground Features

You can edit this markdown content in the edit view. Click the button in the top to toggle the view.

When you view the rendered markdown, you will see a table of contents on the left. You can click the links to navigate to the corresponding section.

When you click a definition/reference, you will see a list of reverse references on the right. You can click the links to navigate to the corresponding reference.

This playground support GFM (Github Flavored Markdown) and HTML. For example, literal URL will be transformed to a link, e.g. https://github.com/DiscreteTom/bimark.

Besides, all headings will be assigned an id. For example, \`<h1 id="heading">Heading</h1>\`.

## Other Resources

- API, see [bimark](https://github.com/DiscreteTom/bimark).
- CLI, see [bimark-cli](https://github.com/DiscreteTom/bimark-cli).
- VSCode extension, see [vscode-bimark](https://github.com/DiscreteTom/vscode-bimark).
`);

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

  // register router links to realize smooth scrolling
  container.value?.querySelectorAll("a").forEach((el) => {
    el.addEventListener("click", (e) => {
      const href = el.href;
      const url = new URL(href);
      if (url.hash.startsWith("#") && url.pathname === route.path) {
        e.preventDefault();
        router.push(url.hash);
      }
    });
  });

  // collect toc links
  tocLinks.value = [];
  parse(html)
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .forEach((el) => {
      tocLinks.value.push({
        title: el.text,
        to: `#${el.id}`,
        lvl: Number(el.tagName[1]),
      });
    });

  updateReverseLinks();
};

const updateReverseLinks = () => {
  const id = route.hash.slice(1);
  reverseLinks.value = [];

  // get def
  let def = bm.id2def.get(id);
  if (!def) {
    // maybe ref?
    for (const [_, d] of bm.id2def) {
      for (const ref of d.refs) {
        if (ref.id === id) {
          def = d;
          break;
        }
      }
    }
  }

  def?.refs.forEach((ref) => {
    const line = text.value.split("\n")[ref.fragment.position.start.line - 1];
    const before = line.slice(0, ref.fragment.position.start.column - 1);
    const after = line.slice(ref.fragment.position.end.column);
    reverseLinks.value.push({
      title: before + "..." + after,
      to: "#" + ref.id,
      ref,
    });
  });
  removeArrow();
};

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight)
  .style("position", "fixed")
  .style("top", 0)
  .style("pointer-events", "none")
  .style("z-index", 9999);
const showArrow = (e: MouseEvent, targetHash: string) => {
  indicateFrom.value = d3.select(e.target as HTMLElement);
  indicateTo.value = d3.select(targetHash);
  updateArrow();
};
const updateArrow = () => {
  svg.selectAll("*").remove(); // clear svg

  if (!indicateFrom.value || !indicateTo.value) {
    return;
  }

  const fromRect = indicateFrom.value.node()!.getBoundingClientRect();
  const toRect = (indicateTo.value.node()! as Element).getBoundingClientRect();

  // draw a bounding box for the target element
  svg
    .append("rect")
    .attr("x", toRect.left)
    .attr("y", toRect.top)
    .attr("width", toRect.width)
    .attr("height", toRect.height)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("fill", "none")
    .attr("stroke", "pink")
    .attr("stroke-width", 2);

  // Define the shape of the folded line
  var line = d3
    .line()
    .x(function (d) {
      return d[0];
    })
    .y(function (d) {
      return d[1];
    })
    .curve(d3.curveNatural);

  // Create an array of points for the folded line
  var points = [
    [fromRect.left, fromRect.top + fromRect.height / 2],
    [(fromRect.left + toRect.right) / 2, fromRect.top + fromRect.height / 2],
    [(fromRect.left + toRect.right) / 2, toRect.top + toRect.height / 2],
    [toRect.right, toRect.top + toRect.height / 2],
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
    .attr("fill", "red")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z");

  // Draw the folded line
  svg
    .append("path")
    .attr("d", line(points))
    .attr("stroke", "pink")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .attr("marker-end", "url(#arrowhead)");
};
const removeArrow = () => {
  indicateFrom.value = null;
  indicateTo.value = null;
  updateArrow();
};
</script>
