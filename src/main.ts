import App from "./App.vue";
import { createApp } from "vue";
import { registerPlugins } from "@/plugins";
import * as VueRouter from "vue-router";

const app = createApp(App);

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [
    {
      path: "/",
      component: app,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // clear highlight
    if (from.hash) {
      const id = from.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove("highlight");
      }
    }
    if (to.hash) {
      const id = to.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.classList.add("highlight");
        return {
          el,
          top: 64 + 20, // app bar height + margin
          behavior: "smooth",
        };
      }
    }
    if (savedPosition) {
      return savedPosition;
    }

    return { top: 0 };
  },
});

registerPlugins(app);
app.use(router);

app.mount("#app");
