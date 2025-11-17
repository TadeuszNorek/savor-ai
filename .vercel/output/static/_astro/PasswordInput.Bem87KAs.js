import{c,j as s}from"./createLucideIcon.Dkxjm4wi.js";import{r as d}from"./index.BkdHoFEG.js";import{L as w,I as x}from"./label.CRoT3Fms.js";import{B as y}from"./supabase.client.D2OLuBHL.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],j=c("eye-off",f);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],N=c("eye",v),g=d.forwardRef(({value:i,onChange:n,error:t,disabled:o,onBlur:p,label:l="Password"},h)=>{const[a,m]=d.useState(!1),e=!!t,u=()=>{m(r=>!r)};return s.jsxs("div",{className:"space-y-2",children:[s.jsx(w,{htmlFor:"password",children:l}),s.jsxs("div",{className:"relative",children:[s.jsx(x,{ref:h,id:"password",type:a?"text":"password",autoComplete:"current-password",value:i,onChange:r=>n(r.target.value),onBlur:p,disabled:o,"aria-invalid":e,"aria-describedby":e?"password-error":void 0,className:`pr-10 ${e?"border-destructive":""}`}),s.jsx(y,{type:"button",variant:"ghost",size:"sm",className:"absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent",onClick:u,disabled:o,"aria-label":a?"Hide password":"Show password",children:a?s.jsx(j,{className:"h-4 w-4 text-muted-foreground","aria-hidden":"true"}):s.jsx(N,{className:"h-4 w-4 text-muted-foreground","aria-hidden":"true"})})]}),e&&s.jsx("p",{id:"password-error",className:"text-sm text-destructive",role:"alert",children:t})]})});g.displayName="PasswordInput";export{g as P};
