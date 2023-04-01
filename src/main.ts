import App from "./App.vue";
import { createApp } from "vue";
import { registerPlugins } from "@/plugins";
import * as VueRouter from "vue-router";

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      const id = to.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        return {
          el,
          top: 64, // app bar height
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

const app = createApp(App);

registerPlugins(app);
app.use(router);

app.mount("#app");
