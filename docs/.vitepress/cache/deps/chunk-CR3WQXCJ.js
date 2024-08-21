// node_modules/.pnpm/vitepress@1.3.3_@algolia+client-search@4.24.0_@types+node@18.19.45_@types+react@18.3.4_less@4_asjiwckjb6n7z7bfpbkv5dsi4q/node_modules/vitepress/lib/vue-demi.mjs
var isVue2 = false;
var isVue3 = true;
var Vue2 = void 0;
function install() {
}
function set(target, key, val) {
  if (Array.isArray(target)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val;
  }
  target[key] = val;
  return val;
}
function del(target, key) {
  if (Array.isArray(target)) {
    target.splice(key, 1);
    return;
  }
  delete target[key];
}

export {
  isVue2,
  isVue3,
  Vue2,
  install,
  set,
  del
};
/*! Bundled license information:

vitepress/lib/vue-demi.mjs:
  (**
   * vue-demi v0.14.7
   * Copyright (c) 2020-present, Anthony Fu
   * @license MIT
   *)
*/
//# sourceMappingURL=chunk-CR3WQXCJ.js.map
