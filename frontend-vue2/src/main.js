import Vue from 'vue'
import App from './App.vue'

// auth0 cloud
// https://manage.auth0.com/dashboard/us/{...}/applications/{...}/settings
// https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin
import router from "./router";
import { Auth0Plugin } from "./services/auth";
import { domain, clientId } from "./services/auth.json";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/github.css";

Vue.use(hljs.vuePlugin);
Vue.use(Auth0Plugin, {
  domain,
  clientId,
  onRedirectCallback: appState => {
    router.push(
      appState && appState.targetUrl
        ? appState.targetUrl
        : window.location.pathname
    );
  }
});

// font awesome
// https://fontawesome.com/v5.15/icons?d=gallery&p=2&s=solid&m=free
// https://github.com/FortAwesome/vue-fontawesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { 
  faCheckCircle, faCloudDownloadAlt, faDatabase, faLink, faList, faMobile, faPowerOff, faRobot, faSearch, faServer, faStar, faSyncAlt, faUser
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
library.add(faCheckCircle, faCloudDownloadAlt, faDatabase, faLink, faList, faMobile, faPowerOff, faRobot, faSearch, faServer, faStar, faSyncAlt, faUser)
Vue.component("font-awesome", FontAwesomeIcon);

// grid table
// https://kr.vuejs.org/v2/examples/grid-component.html

// modal popup
// https://www.npmjs.com/package/vue-js-modal
import VModal from 'vue-js-modal'
Vue.use(VModal, {
  componentName: 'Modal',
  dialog: true,
  dynamicDefault: { adaptive: true, draggable: true, resizable: true },
})

// toggle button
// https://www.npmjs.com/package/vue-js-toggle-button
import { ToggleButton } from 'vue-js-toggle-button'
Vue.component('toggle-btn', ToggleButton)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
