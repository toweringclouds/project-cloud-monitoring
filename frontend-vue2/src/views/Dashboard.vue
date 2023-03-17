<template>
  <div class="noauth" v-if="!$auth.isAuthenticated && !$auth.loading">
    <a
      href="#"
      id="login"
      ref="login"
      @click="onClickLogin"
      @mouseover="onClickLogin"
    >
      <img src="../assets/logo.png" width="250" />
    </a>
    <p style="color: skyblue">Dashboard Login</p>
  </div>
  <div class="container-fluid" v-else>
    <v-dialog />
    <h2>
      {{ msg }}&nbsp;
      <a
        href="#"
        @click.prevent="onClickSync"
        style="color: rgb(165, 218, 181)"
      >
        <font-awesome icon="sync-alt" /> </a
      >&nbsp;
      <a href="#" @click.prevent="onClickLogout" style="color: orange">
        <font-awesome icon="power-off" /> </a
      >&nbsp;
      <a
        href="#"
        @click.prevent="onClickProfile"
        style="font-size: 15pt; color: skyblue"
      >
        {{ $auth.user.nickname }}
      </a>
    </h2>
    <br />
    <div class="wrapper">
      <div id="grid-svr">
        <form id="search-svr" style="text-align: left">
          <h3>
            <font-awesome icon="search" size="1x" />
            Server Search&nbsp;
            <input id="query-svr" v-model="filterKeyS" />
          </h3>
        </form>
        <table>
          <thead>
            <tr>
              <th
                v-for="(ck, ci) in colSvr"
                v-bind:key="ci"
                @click.prevent="sortBySvr(ck)"
                :class="{ active: sortKeyS == ck }"
              >
                {{ ck | capitalize }}
                <span
                  class="arrow"
                  :class="sortOrdersS[ck] > 0 ? 'asc' : 'dsc'"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, ri) in filteredSvrs" v-bind:key="ri">
              <td
                v-for="(dv, dk, di) in entry"
                v-bind:key="di"
                style="text-align: left"
              >
                <span v-if="dk == 'alive'">
                  <span v-if="dv == true">
                    <font-awesome icon="check-circle" size="2x" color="green" />
                  </span>
                  <span v-else>
                    <font-awesome icon="check-circle" size="2x" color="red" />
                  </span>
                </span>
                <span v-else-if="dk == 'log'">
                  <font-awesome icon="check-circle" size="2x" color="gray" />
                </span>
                <span v-else-if="dk == 'more'">
                  <span v-if="dv != '-'">
                    <span v-if="dv.result[0] == true">
                      <font-awesome
                        icon="check-circle"
                        size="2x"
                        color="red"
                        @click.prevent="onClickSvrMore($event, dv.data)"
                        style="cursor: hand"
                      />
                    </span>
                    <span v-else-if="dv.result[1] == true">
                      <font-awesome
                        icon="check-circle"
                        size="2x"
                        color="orange"
                        @click.prevent="onClickSvrMore($event, dv.data)"
                        style="cursor: hand"
                      />
                    </span>
                    <span v-else>
                      <font-awesome
                        icon="check-circle"
                        size="2x"
                        color="green"
                        @click.prevent="onClickSvrMore($event, dv.data)"
                        style="cursor: hand"
                      />
                    </span>
                  </span>
                  <span v-else>
                    <font-awesome icon="check-circle" size="2x" color="gray" />
                  </span>
                </span>
                <span v-else-if="dk == 'name'">
                  <font-awesome icon="server" color="skyblue" />
                  <a href="#" @click.prevent="onClickSvrName($event, dv)">
                    {{ dv | shortenHost }}
                  </a>
                </span>
                <span v-else>
                  {{ dv }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";

export default {
  name: "Dashboard",
  props: {
    colSvr: {
      type: Array,
      default: function () {
        return [
          "div",
          "name",
          "role",
          "zone",
          "ipAddr",
          "port",
          "alive",
          "more",
          "log",
        ];
      },
    },
    msg: { type: String },
  },
  methods: {
    initialize() {
      // server sort options
      this.sortKeyS = "alive";
      this.sortOrdersS = {
        div: 1,
        alive: 1,
        name: 1,
        more: 1,
        log: 1,
        role: 1,
        zone: 1,
        ipAddr: 1,
        port: 1,
      };

      // clean grid dataset
      this.svrData = {};
      this.svrList = [];

      // refresh grid dataset
      const healthCheck = (_div) => {
        return new Promise(async (resolve, reject) => {
          try {
            const res = await axios.get(
              `http://localhost:50990/v1/metrics?metricType=${_div}`,
              {
                headers: {
                  Accept: "application/json",
                },
              }
            );
            if (res.data.data) Object.keys(res.data.data).sort();
            resolve(res.data);
          } catch (ex) {
            console.log(`@ healthCheck.e : ${ex}`);
            reject(ex);
          }
        });
      };
      healthCheck("S").then((res) => {
        this.queryStatusList("svrs", res);
        const currTime = moment().format("YYYY-MM-DDTHH:mm:ss.SSS");
        console.log(`dashboard initialed at ${currTime}.`);
      });
    },
    isEmptyOrSpaces(str) {
      return str === null || str.match(/^ *$/) !== null;
    },
    onClickLogin() {
      this.$auth.loginWithRedirect();
    },
    onClickLogout() {
      this.$auth.logout();
      this.$router.push({ path: "/" });
    },
    onClickProfile() {
      this.$modal.show("dialog", {
        title: `<h4>auth0(${this.$auth.user.nickname}) profile</h4>`,
        text: `<pre style="font-size:12pt">${JSON.stringify(
          this.$auth.user,
          null,
          4
        )}</pre>`,
      });
    },
    onClickSvrMore(event, data) {
      if (event.isTrusted) {
        console.log(data);
      }
    },
    onClickSvrName(event, key) {
      if (event.isTrusted) {
        const name = key.split("-")[1];
        const item = this.svrData[name];
        this.$modal.show("dialog", {
          title: `<h4>server(${name}) status backlog</h4>`,
          text: `<pre style="font-size:12pt">${JSON.stringify(
            item,
            null,
            4
          )}</pre>`,
        });
      }
    },
    onClickSync() {
      this.initialize();
    },
    queryStatusList(_div, _data) {
      return new Promise((resolve, reject) => {
        try {
          if (_div == "svrs") {
            this.setupStatusSvr(_data);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (ex) {
          reject(ex);
        }
      });
    },
    setupStatusSvr(res) {
      this.svrData = res.data;
      this.svrList = Object.keys(this.svrData).reduce((acc, svr) => {
        const item = this.svrData[svr];

        if ("use" in item && item.use == true) {
          let gridItem = {
            div: item.div,
            name: svr,
            role: item.role,
            zone: item.cloud ? "public" : "private",
            ipAddr: item.ip,
            port: item.port,
            alive: item.alive,
            more: "-",
            log: "-",
          };
          acc.push(gridItem);
        }
        return acc;
      }, []);
    },
    sortBySvr(key) {
      this.sortKeyS = key;
      this.sortOrdersS[key] = this.sortOrdersS[key] * -1;
    },
  },
  filters: {
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    shortenHost(str) {
      const hostTokens = str.split("-");
      return hostTokens.length > 1 ? hostTokens[1] : str;
    },
  },
  computed: {
    // server search by filter or sort option
    filteredSvrs() {
      let sortKey = this.sortKeyS;
      let filterKey = this.filterKeyS && this.filterKeyS.toLowerCase();
      let order = this.sortOrdersS[sortKey] || 1;
      let option = this.optionKeyS;
      let itemList = this.svrList;

      if (filterKey) {
        itemList = itemList.filter((row) => {
          return Object.keys(row).some((key) => {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1;
          });
        });
      }
      if (sortKey) {
        itemList = itemList.slice().sort((a, b) => {
          a = a[sortKey];
          b = b[sortKey];
          return (a === b ? 0 : a > b ? 1 : -1) * order;
        });
      }
      // filter matching group
      if (option) {
        itemList = itemList.reduce((acc, item) => {
          if (option.find((i) => i == item.name.split("-")[1]) != undefined) {
            acc.push(item);
          }
          return acc;
        }, []);
      }
      return itemList;
    },
  },
  data() {
    return {
      // grid control
      filterKeyS: "",
      optionKeyS: "",
      sortKeyS: "",
      sortOrdersS: {},
      // grid dataset
      svrData: {},
      svrList: [],
      // test option
      test: true,
    };
  },
  created() {
    // after authentication
    if (this.$auth.isAuthenticated || this.$auth.loading) {
      this.initialize();

      // refresh on every 5 minutes
      setInterval(() => {
        this.initialize();
      }, 5 * 60 * 1000);
    } else {
      this.onClickLogin();
    }
  },
  mounted() {
    // before authentication
    if (!this.$auth.isAuthenticated && !this.$auth.loading) {
      this.onClickLogin();
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
@media (max-width: 720) and (min-width: 1023px) {
  .wrapper > * {
    max-width: 640px;
  }
}

@media (max-width: 1024px) and (min-width: 1919px) {
  .wrapper > * {
    max-width: 780px;
  }
}

@media (min-width: 1920px) {
  .wrapper > * {
    max-width: 1140px;
  }
}

.noauth {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.wrapper {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  justify-content: space-around;
  align-items: flex-start;
}

#grid-svr {
  width: 100%;
  margin: 15px;
}

#query-svr {
  width: 250px;
  font-size: 18pt;
  background-color: rgb(165, 218, 181);
}

h2 {
  color: rgb(255, 255, 255);
  white-space: nowrap;
  text-align: center;
}

h3 {
  color: rgb(0, 255, 170);
  white-space: nowrap;
}

body {
  font-family: Helvetica Neue, Arial, sans-serif;
  font-size: 14px;
  color: #444;
}

table {
  border: 2px solid #42b983;
  border-radius: 3px;
  background-color: #fff;
}

th {
  background-color: #42b983;
  color: rgba(255, 255, 255, 0.66);
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

td {
  background-color: #f9f9f9;
}

th,
td {
  min-width: 120px;
  padding: 10px 20px;
}

th.active {
  color: #fff;
}

th.active .arrow {
  opacity: 1;
}

.arrow {
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  margin-left: 5px;
  opacity: 0.66;
}
</style>
