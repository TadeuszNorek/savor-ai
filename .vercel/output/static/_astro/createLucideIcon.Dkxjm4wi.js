import{r as c}from"./index.BkdHoFEG.js";var l={exports:{}},i={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var d;function f(){if(d)return i;d=1;var e=Symbol.for("react.transitional.element"),r=Symbol.for("react.fragment");function s(n,t,o){var a=null;if(o!==void 0&&(a=""+o),t.key!==void 0&&(a=""+t.key),"key"in t){o={};for(var u in t)u!=="key"&&(o[u]=t[u])}else o=t;return t=o.ref,{$$typeof:e,type:n,key:a,ref:t!==void 0?t:null,props:o}}return i.Fragment=r,i.jsx=s,i.jsxs=s,i}var p;function E(){return p||(p=1,l.exports=f()),l.exports}var _=E();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),k=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(r,s,n)=>n?n.toUpperCase():s.toLowerCase()),x=e=>{const r=k(e);return r.charAt(0).toUpperCase()+r.slice(1)},m=(...e)=>e.filter((r,s,n)=>!!r&&r.trim()!==""&&n.indexOf(r)===s).join(" ").trim();/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var h={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=c.forwardRef(({color:e="currentColor",size:r=24,strokeWidth:s=2,absoluteStrokeWidth:n,className:t="",children:o,iconNode:a,...u},R)=>c.createElement("svg",{ref:R,...h,width:r,height:r,stroke:e,strokeWidth:n?Number(s)*24/Number(r):s,className:m("lucide",t),...u},[...a.map(([v,C])=>c.createElement(v,C)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=(e,r)=>{const s=c.forwardRef(({className:n,...t},o)=>c.createElement(A,{ref:o,iconNode:r,className:m(`lucide-${w(x(e))}`,`lucide-${e}`,n),...t}));return s.displayName=x(e),s};export{L as c,_ as j};
