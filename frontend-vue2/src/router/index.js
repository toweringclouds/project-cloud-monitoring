import Vue from "vue";
import Router from "vue-router";
import Profile from "../views/Profile.vue";
import { authGuard } from "../services/auth";

Vue.use(Router);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/profile",
      name: "profile",
      component: Profile,
      beforeEnter: authGuard
    }
  ]
});

export default router;
