(()=>{"use strict";var t="[1-9]\\d?",n="\\d\\d",e="[^\\s]+";function r(t,n){for(var e=[],r=0,i=t.length;r<i;r++)e.push(t[r].substr(0,n));return e}var i=function(t){return function(n,e){var r=e[t].map((function(t){return t.toLowerCase()})).indexOf(n.toLowerCase());return r>-1?r:null}};function o(t){for(var n=[],e=1;e<arguments.length;e++)n[e-1]=arguments[e];for(var r=0,i=n;r<i.length;r++){var o=i[r];for(var a in o)t[a]=o[a]}return t}var a=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],c=["January","February","March","April","May","June","July","August","September","October","November","December"],u=r(c,3),s={dayNamesShort:r(a,3),dayNames:a,monthNamesShort:u,monthNames:c,amPm:["am","pm"],DoFn:function(t){return t+["th","st","nd","rd"][t%10>3?0:(t-t%10!=10?1:0)*t%10]}},f=(o({},s),function(t){return+t-1}),l=[null,t],y=[null,e],h=["isPm",e,function(t,n){var e=t.toLowerCase();return e===n.amPm[0]?0:e===n.amPm[1]?1:null}],d=["timezoneOffset","[^\\s]*?[\\+\\-]\\d\\d:?\\d\\d|[^\\s]*?Z?",function(t){var n=(t+"").match(/([+-]|\d\d)/gi);if(n){var e=60*+n[1]+parseInt(n[2],10);return"+"===n[0]?e:-e}return 0}];i("monthNamesShort"),i("monthNames");(function(){try{(new Date).toLocaleDateString("i")}catch(t){return"RangeError"===t.name}})(),function(){try{(new Date).toLocaleString("i")}catch(t){return"RangeError"===t.name}}(),function(){try{(new Date).toLocaleTimeString("i")}catch(t){return"RangeError"===t.name}}();var p=function(t){return t<10?"0"+t:t};function b(t){return t.substr(0,t.indexOf("."))}var v=["closed","locked","off"],m=(new Set(["fan","input_boolean","light","switch","group","automation"]),function(t,n,e,r){r=r||{},e=null==e?{}:e;var i=new Event(n,{bubbles:void 0===r.bubbles||r.bubbles,cancelable:Boolean(r.cancelable),composed:void 0===r.composed||r.composed});return i.detail=e,t.dispatchEvent(i),i});new Set(["call-service","divider","section","weblink","cast","select"]);var g=function(t){m(window,"haptic",t)};function _(t){return(_="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}var w=["entity-id","last-changed","last-updated","last-triggered","position","tilt-position","brightness"],O=function(t){return"object"===_(t)&&!Array.isArray(t)&&!!t},j=function(t){return!t||["unknown","unavailable"].includes(t.state)},k=function(t){if(O(t)&&!(t.entity||t.attribute||t.icon))throw new Error("Entity object requires at least one 'entity', 'attribute' or 'icon'.");if("string"==typeof t&&""===t)throw new Error("Entity ID string must not be blank.");if("string"!=typeof t&&!O(t))throw new Error("Entity config must be a valid entity ID string or entity object.")},S=function(t,n){return!1===n.name?null:n.name||(n.entity?t.attributes.friendly_name||(e=t.entity_id).substr(e.indexOf(".")+1):null)||null;var e},E=function(t){return O(null==t?void 0:t.styles)?Object.keys(t.styles).map((function(n){return"".concat(n,": ").concat(t.styles[n],";")})).join(""):""};function P(){var t,n,e=(t=["\n    .icon-small {\n        width: auto;\n    }\n    .entity {\n        text-align: center;\n        cursor: pointer;\n    }\n    .entity span {\n        font-size: 10px;\n        color: var(--secondary-text-color);\n    }\n    .entities-row {\n        flex-direction: row;\n        display: inline-flex;\n        justify-content: space-between;\n        align-items: center;\n    }\n    .entities-row .entity {\n        margin-right: 16px;\n    }\n    .entities-row .entity:last-of-type {\n        margin-right: 0;\n    }\n    .entities-column {\n        flex-direction: column;\n        display: flex;\n        align-items: flex-end;\n        justify-content: space-evenly;\n    }\n    .entities-column .entity div {\n        display: inline-block;\n        vertical-align: middle;\n    }\n"],n||(n=t.slice(0)),Object.freeze(Object.defineProperties(t,{raw:{value:Object.freeze(n)}})));return P=function(){return e},e}function x(t){return(x="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function D(t,n){var e=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(t,n).enumerable}))),e.push.apply(e,r)}return e}function I(t){for(var n=1;n<arguments.length;n++){var e=null!=arguments[n]?arguments[n]:{};n%2?D(Object(e),!0).forEach((function(n){R(t,n,e[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(e)):D(Object(e)).forEach((function(n){Object.defineProperty(t,n,Object.getOwnPropertyDescriptor(e,n))}))}return t}function R(t,n,e){return n in t?Object.defineProperty(t,n,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[n]=e,t}function z(){var t=J(["<hui-warning>\n            ","\n        </hui-warning>"]);return z=function(){return t},t}function L(){var t=J(['<state-badge\n            class="icon-small"\n            .stateObj="','"\n            .overrideIcon="','"\n            .stateColor="','"\n        ></state-badge>']);return L=function(){return t},t}function M(){var t=J(["<hui-timestamp-display\n                .ts=","\n                .format=","\n                .hass=","\n            ></hui-timestamp-display>"]);return M=function(){return t},t}function T(){var t=J(['<ha-entity-toggle .stateObj="','" .hass="','"></ha-entity-toggle>']);return T=function(){return t},t}function C(){var t=J(['<div class="entity" style="','" @click="','">\n            <span>',"</span>\n            <div>","</div>\n        </div>"]);return C=function(){return t},t}function N(){var t=J(["<span>","</span>"]);return N=function(){return t},t}function F(){var t=J(['<div class="state entity" style="','" @click="','">\n            ',"\n            <div>","</div>\n        </div>"]);return F=function(){return t},t}function A(){var t=J([""," ",""]);return A=function(){return t},t}function W(){var t=J(["",""]);return W=function(){return t},t}function V(){var t=J(['<hui-generic-entity-row\n            .hass="','"\n            .config="','"\n            .secondaryText="','"\n        >\n            <div class="','">\n                ',"","\n            </div>\n        </hui-generic-entity-row>"]);return V=function(){return t},t}function H(){var t=J([""]);return H=function(){return t},t}function J(t,n){return n||(n=t.slice(0)),Object.freeze(Object.defineProperties(t,{raw:{value:Object.freeze(n)}}))}function U(t,n){if(!(t instanceof n))throw new TypeError("Cannot call a class as a function")}function q(t,n){for(var e=0;e<n.length;e++){var r=n[e];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function B(t,n){return(B=Object.setPrototypeOf||function(t,n){return t.__proto__=n,t})(t,n)}function Y(t,n){return!n||"object"!==x(n)&&"function"!=typeof n?function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t):n}function Z(t){return(Z=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}var G=window.LitElement||Object.getPrototypeOf(customElements.get("hui-masonry-view")||customElements.get("hui-view")),K=G.prototype,Q=K.html,X=K.css;console.info("%c MULTIPLE-ENTITY-ROW %c 4.0.0 ","color: cyan; background: black; font-weight: bold;","color: darkblue; background: white; font-weight: bold;");var $=function(t){!function(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(n&&n.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),n&&B(t,n)}(c,t);var n,e,r,i,o,a=(i=c,o=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,n=Z(i);if(o){var e=Z(this).constructor;t=Reflect.construct(n,arguments,e)}else t=n.apply(this,arguments);return Y(this,t)});function c(){return U(this,c),a.apply(this,arguments)}return n=c,r=[{key:"properties",get:function(){return{_hass:Object,config:Object,stateObj:Object}}},{key:"styles",get:function(){return function(t){return t(P())}(X)}}],(e=[{key:"setConfig",value:function(t){if(!t||!t.entity)throw new Error("Please define a main entity.");t.entities&&t.entities.forEach((function(t){return k(t)})),t.secondary_info&&k(t.secondary_info),this.entityIds=function(t){var n,e;return[t.entity,null===(n=t.secondary_info)||void 0===n?void 0:n.entity].concat(null===(e=t.entities)||void 0===e?void 0:e.map((function(t){return"string"==typeof t?t:t.entity}))).filter((function(t){return t}))}(t),this.onRowClick=this.clickHandler(t.entity,t.tap_action),this.config=t}},{key:"shouldUpdate",value:function(t){return function(t,n){if(n.has("config"))return!0;var e=n.get("_hass");return!!e&&t.entityIds.some((function(n){return e.states[n]!==t._hass.states[n]}))}(this,t)}},{key:"render",value:function(){var t=this;return this._hass&&this.config?this.stateObj?Q(V(),this._hass,this.config,this.renderSecondaryInfo(),this.config.column?"entities-column":"entities-row",this.entities.map((function(n){return t.renderEntity(n.stateObj,n)})),this.renderMainEntity()):this.renderWarning():Q(H())}},{key:"renderSecondaryInfo",value:function(){if(!this.config.secondary_info||"string"==typeof(t=this.config.secondary_info)&&w.includes(t))return null;var t;if("string"==typeof this.config.secondary_info)return Q(W(),this.config.secondary_info);var n=S(this.info,this.config.secondary_info);return Q(A(),n,this.renderValue(this.info,this.config.secondary_info))}},{key:"renderMainEntity",value:function(){return!1===this.config.show_state?null:Q(F(),E(this.config),this.onRowClick,this.config.state_header&&Q(N(),this.config.state_header),this.renderValue(this.stateObj,this.config))}},{key:"renderEntity",value:function(t,n){if(!t||function(t,n){return n.hide_unavailable&&(j(t)||n.attribute&&void 0===t.attributes[n.attribute])}(t,n))return null;var e=this.clickHandler(t.entity_id,n.tap_action);return Q(C(),E(n),e,S(t,n),n.icon?this.renderIcon(t,n):this.renderValue(t,n))}},{key:"renderValue",value:function(t,n){if(function(t,n){return!0===n.toggle&&!j(t)}(t,n))return Q(T(),t,this._hass);if(n.format){var e=function(t,n){return void 0!==n.attribute?t.attributes[n.attribute]:t.state}(t,n),r=function(t,n){return void 0!==n.attribute?n.unit:n.unit||t.attributes.unit_of_measurement}(t,n);if("duration"===n.format)return o=e,a=Math.floor(o/3600),c=Math.floor(o%3600/60),u=Math.floor(o%3600%60),a>0?a+":"+p(c)+":"+p(u):c>0?c+":"+p(u):u>0?""+u:null;if(n.format.startsWith("precision")){var i=parseInt(n.format.slice(-1),10);return"".concat(parseFloat(e).toFixed(i)).concat(r?" ".concat(r):"")}return"brightness_pct"===n.format?"".concat(parseFloat(e/2.55).toFixed(2)).concat(r?" ".concat(r):""):Q(M(),new Date(e),n.format,this._hass)}var o,a,c,u;return function(t,n,e){if(j(n))return t.localize("state.default.".concat(n.state));if(e.attribute)return e.attribute in n.attributes?"".concat(n.attributes[e.attribute]).concat(e.unit?" ".concat(e.unit):""):t.localize("state.default.unavailable");if(!1!==e.unit&&(e.unit||n.attributes.unit_of_measurement))return"".concat(n.state," ").concat(e.unit||n.attributes.unit_of_measurement);var r=function(t){return b(t.entity_id)}(n);return n.attributes.device_class&&t.localize("component.".concat(r,".state.").concat(n.attributes.device_class,".").concat(n.state))||t.localize("component.".concat(r,".state._.").concat(n.state))||n.state}(this._hass,t,n)}},{key:"renderIcon",value:function(t,n){return Q(L(),t,!0===n.icon?t.attributes.icon||null:n.icon,n.state_color)}},{key:"renderWarning",value:function(){return Q(z(),this._hass.localize("ui.panel.lovelace.warning.entity_not_found","entity",this.config.entity))}},{key:"clickHandler",value:function(t,n){var e=this;return function(){return function(t,n,e,r,i){var o;if(e.tap_action&&(o=e.tap_action),o||(o={action:"more-info"}),!o.confirmation||o.confirmation.exemptions&&o.confirmation.exemptions.some((function(t){return t.user===n.user.id}))||confirm(o.confirmation.text||"Are you sure you want to "+o.action+"?"))switch(o.action){case"more-info":(o.entity||e.entity||e.camera_image)&&(m(t,"hass-more-info",{entityId:o.entity?o.entity:e.entity?e.entity:e.camera_image}),o.haptic&&g(o.haptic));break;case"navigate":o.navigation_path&&(function(t,n,e){void 0===e&&(e=!1),e?history.replaceState(null,"",n):history.pushState(null,"",n),m(window,"location-changed",{replace:e})}(0,o.navigation_path),o.haptic&&g(o.haptic));break;case"url":o.url_path&&window.open(o.url_path),o.haptic&&g(o.haptic);break;case"toggle":e.entity&&(function(t,n){(function(t,n,e){void 0===e&&(e=!0);var r,i=b(n),o="group"===i?"homeassistant":i;switch(i){case"lock":r=e?"unlock":"lock";break;case"cover":r=e?"open_cover":"close_cover";break;default:r=e?"turn_on":"turn_off"}t.callService(o,r,{entity_id:n})})(t,n,v.includes(t.states[n].state))}(n,e.entity),o.haptic&&g(o.haptic));break;case"call-service":if(!o.service)return;var a=o.service.split(".",2),c=a[0],u=a[1],s=Object.assign({},o.service_data);"entity"===s.entity_id&&(s.entity_id=e.entity),n.callService(c,u,s),o.haptic&&g(o.haptic)}}(e,e._hass,{entity:t,tap_action:n})}}},{key:"hass",set:function(t){var n,e,r,i=this;this._hass=t,t&&this.config&&(this.stateObj=t.states[this.config.entity],O(this.config.secondary_info)&&(this.info=null!==(r=t.states[this.config.secondary_info.entity])&&void 0!==r?r:this.stateObj),this.entities=null!==(n=null===(e=this.config.entities)||void 0===e?void 0:e.map((function(n){var e="string"==typeof n?{entity:n}:n;return I(I({},e),{},{stateObj:e.entity?t.states[e.entity]:i.stateObj})})))&&void 0!==n?n:[])}}])&&q(n.prototype,e),r&&q(n,r),c}(G);customElements.define("multiple-entity-row",$)})();