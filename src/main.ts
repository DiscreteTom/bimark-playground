import App from "./App.vue";
import { createApp } from "vue";
import { registerPlugins } from "@/plugins";
import * as VueRouter from "vue-router";

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [],
});

const app = createApp(App);

registerPlugins(app);
app.use(router);

app.mount("#app");
