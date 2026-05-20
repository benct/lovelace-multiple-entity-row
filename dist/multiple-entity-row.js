!function(){const t={DEBUG:!1,BUILD_TIME:"20/05/2026, 18:08"};try{if(process)return process.env=Object.assign({},process.env),void Object.assign(process.env,t)}catch(t){}globalThis.process={env:t}}();var t="5.2.0";function e(t,e,i,s){var n,o=arguments.length,a=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,s);else for(var r=t.length-1;r>=0;r--)(n=t[r])&&(a=(o<3?n(a):o>3?n(e,i,a):n(e,i))||a);return o>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const i=globalThis,s=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),o=new WeakMap;let a=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(i,t,n)},c=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,n))(e)})(t):t,{is:l,defineProperty:h,getOwnPropertyDescriptor:d,getOwnPropertyNames:u,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,f=globalThis,m=f.trustedTypes,b=m?m.emptyScript:"",g=f.reactiveElementPolyfillSupport,y=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?b:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!l(t,e),A={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=A){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??A}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...u(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(c(t))}else void 0!==t&&e.push(c(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(s)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of e){const e=document.createElement("style"),n=i.litNonce;void 0!==n&&e.setAttribute("nonce",n),e.textContent=s.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:$).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??v)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[y("elementProperties")]=new Map,x[y("finalized")]=new Map,g?.({ReactiveElement:x}),(f.reactiveElementVersions??=[]).push("2.1.2");const C=globalThis,E=t=>t,w=C.trustedTypes,S=w?w.createPolicy("lit-html",{createHTML:t=>t}):void 0,T="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+k,P=`<${M}>`,O=document,H=()=>O.createComment(""),U=t=>null===t||"object"!=typeof t&&"function"!=typeof t,L=Array.isArray,N="[ \t\n\f\r]",I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,D=/>/g,V=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,z=/"/g,B=/^(?:script|style|textarea|title)$/i,F=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),q=new WeakMap,Z=O.createTreeWalker(O,129);function J(t,e){if(!L(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const G=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",a=I;for(let e=0;e<i;e++){const i=t[e];let r,c,l=-1,h=0;for(;h<i.length&&(a.lastIndex=h,c=a.exec(i),null!==c);)h=a.lastIndex,a===I?"!--"===c[1]?a=j:void 0!==c[1]?a=D:void 0!==c[2]?(B.test(c[2])&&(n=RegExp("</"+c[2],"g")),a=V):void 0!==c[3]&&(a=V):a===V?">"===c[0]?(a=n??I,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,r=c[1],a=void 0===c[3]?V:'"'===c[3]?z:R):a===z||a===R?a=V:a===j||a===D?a=I:(a=V,n=void 0);const d=a===V&&t[e+1].startsWith("/>")?" ":"";o+=a===I?i+P:l>=0?(s.push(r),i.slice(0,l)+T+i.slice(l)+k+d):i+k+(-2===l?e:d)}return[J(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Y{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const a=t.length-1,r=this.parts,[c,l]=G(t,e);if(this.el=Y.createElement(c,i),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Z.nextNode())&&r.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(T)){const e=l[o++],i=s.getAttribute(t).split(k),a=/([.?@])?(.*)/.exec(e);r.push({type:1,index:n,name:a[2],strings:i,ctor:"."===a[1]?it:"?"===a[1]?st:"@"===a[1]?nt:et}),s.removeAttribute(t)}else t.startsWith(k)&&(r.push({type:6,index:n}),s.removeAttribute(t));if(B.test(s.tagName)){const t=s.textContent.split(k),e=t.length-1;if(e>0){s.textContent=w?w.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],H()),Z.nextNode(),r.push({type:2,index:++n});s.append(t[e],H())}}}else if(8===s.nodeType)if(s.data===M)r.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(k,t+1));)r.push({type:7,index:n}),t+=k.length-1}n++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===W)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=U(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Q(t,n._$AS(t,e.values),n,s)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);Z.currentNode=s;let n=Z.nextNode(),o=0,a=0,r=i[0];for(;void 0!==r;){if(o===r.index){let e;2===r.type?e=new tt(n,n.nextSibling,this,t):1===r.type?e=new r.ctor(n,r.name,r.strings,this,t):6===r.type&&(e=new ot(n,this,t)),this._$AV.push(e),r=i[++a]}o!==r?.index&&(n=Z.nextNode(),o++)}return Z.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),U(t)?t===K||null==t||""===t?(this._$AH!==K&&this._$AR(),this._$AH=K):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>L(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==K&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Y.createElement(J(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new X(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new Y(t)),e}k(t){L(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new tt(this.O(H()),this.O(H()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=E(t).nextSibling;E(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=K,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=Q(this,t,e,0),o=!U(t)||t!==this._$AH&&t!==W,o&&(this._$AH=t);else{const s=t;let a,r;for(t=n[0],a=0;a<n.length-1;a++)r=Q(this,s[i+a],e,a),r===W&&(r=this._$AH[a]),o||=!U(r)||r!==this._$AH[a],r===K?t=K:t!==K&&(t+=(r??"")+n[a+1]),this._$AH[a]=r}o&&!s&&this.j(t)}j(t){t===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===K?void 0:t}}class st extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==K)}}class nt extends et{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??K)===W)return;const i=this._$AH,s=t===K&&i!==K||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==K&&(i===K||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const at=C.litHtmlPolyfillSupport;at?.(Y,tt),(C.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;let ct=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new tt(e.insertBefore(H(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}};ct._$litElement$=!0,ct.finalized=!0,rt.litElementHydrateSupport?.({LitElement:ct});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:ct}),(rt.litElementVersions??=[]).push("4.2.2");const ht={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:v},dt=(t=ht,e,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ut(t){return function(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}({...t,state:!0,attribute:!1})}function pt(t,e,i={},s={}){const n=new Event(e,{bubbles:s.bubbles??!0,cancelable:Boolean(s.cancelable),composed:s.composed??!0});return n.detail=i,t.dispatchEvent(n),n}const _t=["unavailable","unknown"],ft=["last-changed","last-updated"],mt=["relative","total","date","time","datetime"],bt=["entity-id","last-changed","last-updated","last-triggered","position","tilt-position","brightness"],gt=t=>"object"==typeof t&&!Array.isArray(t)&&!!t,yt=t=>!t||_t.includes(t.state),$t=(t,e)=>{return!1===e.name?null:"string"==typeof e.name&&e.name.length?e.name:e.entity&&t&&(t.attributes.friendly_name||(i=t.entity_id).substring(i.indexOf(".")+1))||null;var i},vt=t=>gt(t?.styles)?Object.keys(t.styles).map(e=>`${e}: ${t.styles[e]};`).join(""):"",At=t=>t?`--paper-item-icon-color: ${t}; --mdc-icon-color: ${t}; --state-icon-color: ${t};`:"",xt=t=>{if(gt(t)){const e=t,i=Object.keys(e).length>0,s=e.entity||e.attribute||e.icon;if(i&&!s)throw new Error("Entity object requires at least one 'entity', 'attribute' or 'icon'.");return}if("string"==typeof t&&""===t)throw new Error("Entity ID string must not be blank.");if("string"!=typeof t)throw new Error("Entity config must be a valid entity ID string or entity object.")},Ct=(t,e,i)=>{if(((t,e)=>!!e.hide_unavailable&&(yt(t)||!!e.attribute&&!ft.includes(e.attribute)&&void 0===t.attributes[e.attribute]))(t,e))return!0;if(void 0===e.hide_if)return!1;let s=t,n=e.attribute;if(gt(e.hide_if)){const t=e.hide_if;t.entity&&i&&(s=i.states[t.entity],t.attribute&&(n=t.attribute))}if(!s)return!1;const o=n?s.attributes[n]:s.state;let a=[];if(gt(e.hide_if)){const t=e.hide_if;if(void 0!==t.below&&o<t.below)return!0;if(void 0!==t.above&&o>t.above)return!0;void 0!==t.value&&(a=a.concat(t.value))}else a=a.concat(e.hide_if);return a.some(t=>"number"==typeof t?t===+o:t===o)},Et=t=>{if(gt(t)&&"string"==typeof t.entity)return t.entity},wt=t=>{const e=Math.floor(t/3600),i=Math.floor(t%3600/60),s=Math.floor(t%3600%60);return e>0?`${e}:${i.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`:i>0?`${i}:${s.toString().padStart(2,"0")}`:`${s}`},St=(t,e,i={})=>{const s=e.locale?.language||"en";try{return new Intl.NumberFormat(s,i).format(t)}catch{return String(t)}};var Tt=r`.icon-small {
  width: auto;
}
.entity {
  text-align: center;
  cursor: pointer;
}
.entity span {
  font-size: 10px;
  color: var(--secondary-text-color);
}
.entity ha-entity-toggle {
  display: inline-block;
}
.entities-row {
  flex-direction: row;
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
}
.entities-row .entity {
  margin-right: 16px;
}
.entities-row .entity:last-of-type {
  margin-right: 0;
}
.entities-column {
  flex-direction: column;
  display: flex;
  align-items: flex-end;
  justify-content: space-evenly;
}
.entities-column .entity div {
  display: inline-block;
  vertical-align: middle;
}
`;!function(t,e){void 0===e&&(e={});var i=e.insertAt;if(t&&"undefined"!=typeof document){var s=document.head||document.getElementsByTagName("head")[0],n=document.createElement("style");n.type="text/css","top"===i&&s.firstChild?s.insertBefore(n,s.firstChild):s.appendChild(n),n.styleSheet?n.styleSheet.cssText=t:n.appendChild(document.createTextNode(t))}}(Tt);class kt extends ct{constructor(){super(...arguments),this._entities=[],this._entityIds=[],this._holdFired=!1,this._clickCount=0,this._onPointerDown=t=>e=>{0!==e.button&&"mouse"===e.pointerType||(this._activeAction=t,this._holdFired=!1,this._holdTimer&&clearTimeout(this._holdTimer),t.hold_action&&(this._holdTimer=window.setTimeout(()=>{this._holdFired=!0,this._holdTimer=void 0,this._runActiveAction("hold")},500)))},this._onPointerUp=()=>{this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=void 0)},this._onPointerCancel=()=>{this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=void 0),this._holdFired=!1,this._activeAction=void 0},this._onClick=t=>e=>{if(e.stopPropagation(),this._holdFired)return this._holdFired=!1,void(this._activeAction=void 0);this._activeAction=t,t.double_tap_action?(this._clickCount+=1,1===this._clickCount?(this._clickTimer&&clearTimeout(this._clickTimer),this._clickTimer=window.setTimeout(()=>{this._clickCount=0,this._clickTimer=void 0,this._runActiveAction("tap")},250)):(this._clickTimer&&clearTimeout(this._clickTimer),this._clickTimer=void 0,this._clickCount=0,this._runActiveAction("double_tap"))):this._runActiveAction("tap")}}static getConfigElement(){return document.createElement("multiple-entity-row-editor")}setConfig(t){if(!t||!t.entity)throw new Error("Please define a main entity.");t.entities&&t.entities.forEach(t=>xt(t)),t.secondary_info&&xt(t.secondary_info),this._entityIds=(t=>{const e=[t.entity,Et(t.hide_if)];if(gt(t.secondary_info)){const i=t.secondary_info;e.push(i.entity,Et(i.hide_if))}for(const i of t.entities??[])"string"==typeof i?e.push(i):e.push(i.entity,Et(i.hide_if));return e.filter(t=>!!t)})(t),this._config={...t,name:!1===t.name?" ":t.name}}set hass(t){if(this._hass=t,this._config){if(this._stateObj=t.states[this._config.entity],gt(this._config.secondary_info)){const e=this._config.secondary_info.entity;this._info=e?t.states[e]:this._stateObj}else this._info=void 0;this._entities=this._config.entities?.filter(t=>"string"==typeof t?t.length>0:!!(t.entity||t.attribute||t.icon)).map(e=>{const i="string"==typeof e?{entity:e}:e;return{...i,stateObj:i.entity?t.states[i.entity]:this._stateObj}})??[]}}disconnectedCallback(){super.disconnectedCallback(),this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=void 0),this._clickTimer&&(clearTimeout(this._clickTimer),this._clickTimer=void 0),this._holdFired=!1,this._clickCount=0,this._activeAction=void 0}shouldUpdate(t){if(t.has("_config"))return!0;const e=t.get("_hass");return e?e.formatEntityName!==this._hass?.formatEntityName||this._entityIds.some(t=>e.states[t]!==this._hass.states[t]):t.has("_hass")}render(){if(!this._hass||!this._config)return K;if(!this._stateObj)return this._renderWarning();const t=this._resolveStateIcon(this._stateObj,this._config),e=t?{...this._config,icon:t}:this._config,i=At(this._config.icon_color);return F`<hui-generic-entity-row
      style=${i}
      .hass=${this._hass}
      .config=${e}
      .secondaryText=${this._renderSecondaryInfo()}
      .catchInteraction=${!1}
    >
      <div class=${this._config.column?"entities-column":"entities-row"}>
        ${this._entities.map(t=>this._renderEntity(t.stateObj,t))}
        ${this._renderMainEntity()}
      </div>
    </hui-generic-entity-row>`}_resolveStateIcon(t,e){if(!t||!gt(e.state_icon))return;return e.state_icon[t.state]}_renderSecondaryInfo(){const t=this._config?.secondary_info;if(!t||"string"==typeof(e=t)&&bt.includes(e)||Ct(this._info,t,this._hass))return null;var e;if("string"==typeof t)return t;const i=$t(this._info,t);return F`${i} ${this._renderValue(this._info,t)}`}_renderMainEntity(){if(!this._config||!1===this._config.show_state)return null;if(Ct(this._stateObj,this._config,this._hass))return null;const t={entityId:this._config.entity,tap_action:this._config.tap_action,hold_action:this._config.hold_action,double_tap_action:this._config.double_tap_action};return F`<div
      class="state entity"
      style=${vt(this._config)}
      @pointerdown=${this._onPointerDown(t)}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
      @click=${this._onClick(t)}
    >
      ${this._config.state_header?F`<span>${this._config.state_header}</span>`:K}
      <div>${this._renderValue(this._stateObj,this._config)}</div>
    </div>`}_renderEntity(t,e){if(!t||Ct(t,e,this._hass))return e.default?F`<div class="entity" style=${vt(e)}>
          <span>${e.name}</span>
          <div>${e.default}</div>
        </div>`:null;const i={entityId:t.entity_id,tap_action:e.tap_action,hold_action:e.hold_action,double_tap_action:e.double_tap_action},s=!(!e.icon&&!gt(e.state_icon));return F`<div
      class="entity"
      style=${vt(e)}
      @pointerdown=${this._onPointerDown(i)}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
      @click=${this._onClick(i)}
    >
      <span>${$t(t,e)}</span>
      <div>${s?this._renderIcon(t,e):this._renderValue(t,e)}</div>
    </div>`}_renderValue(t,e){if(!t||!this._hass)return"";if(!0===e.toggle)return F`<ha-entity-toggle
        .stateObj=${t}
        .hass=${this._hass}
      ></ha-entity-toggle>`;if(e.attribute&&ft.includes(e.attribute)){const i=t[e.attribute.replace("-","_")];return F`<ha-relative-time
        .hass=${this._hass}
        .datetime=${i}
        capitalize
      ></ha-relative-time>`}if(e.format&&mt.includes(e.format)){const i=e.attribute?t.attributes[e.attribute]??t[e.attribute]:t.state,s=new Date(i);return s instanceof Date&&!isNaN(s.getTime())?F`<hui-timestamp-display
        .hass=${this._hass}
        .ts=${s}
        .format=${e.format}
        capitalize
      ></hui-timestamp-display>`:String(i)}return((t,e,i)=>{if(!e)return"";if(yt(e))return t.localize(`state.default.${e.state}`)||e.state;let s=i.attribute?e.attributes[i.attribute]:e.state,n=!1===i.unit?void 0:void 0!==i.attribute?i.unit:i.unit||e.attributes.unit_of_measurement;if(i.format){switch(i.format){case"upper":return`${String(s).toUpperCase()}${n?` ${n}`:""}`;case"lower":return`${String(s).toLowerCase()}${n?` ${n}`:""}`;case"capitalize":{const t=String(s);return`${t.charAt(0).toUpperCase()+t.slice(1)}${n?` ${n}`:""}`}case"title":return`${String(s).replace(/\b\w/g,t=>t.toUpperCase())}${n?` ${n}`:""}`}const e=parseFloat(s);if(!isNaN(e)&&isFinite(e))switch(i.format){case"brightness":s=Math.round(e/255*100),n="%";break;case"percent":s=St(100*e,t,{maximumFractionDigits:2}),n="%";break;case"duration":s=wt(e),n=void 0;break;case"duration-m":s=wt(e/1e3),n=void 0;break;case"duration-h":s=wt(3600*e),n=void 0;break;case"kilo":s=St(e/1e3,t,{maximumFractionDigits:2});break;case"invert":s=St(-e,t);break;case"position":s=St(100-e,t);break;case"celsius_to_fahrenheit":s=St(1.8*e+32,t,{maximumFractionDigits:0});break;case"fahrenheit_to_celsius":s=St(5*(e-32)/9,t,{maximumFractionDigits:1});break;default:if(i.format.startsWith("precision")){const n=parseInt(i.format.slice(-1),10);s=St(e,t,{minimumFractionDigits:n,maximumFractionDigits:n})}}return`${s}${n?` ${n}`:""}`}if(i.attribute){if(t.formatEntityAttributeValue)return`${t.formatEntityAttributeValue(e,i.attribute,s)}${n?` ${n}`:""}`;const o=parseFloat(s);return`${isNaN(o)?String(s):St(o,t)}${n?` ${n}`:""}`}const o=void 0!==n&&n!==e.attributes.unit_of_measurement?{...e,attributes:{...e.attributes,unit_of_measurement:n}}:e;return t.formatEntityState?t.formatEntityState(o):`${o.state}${n?` ${n}`:""}`})(this._hass,t,e)}_renderIcon(t,e){const i=this._resolveStateIcon(t,e)??(!0===e.icon?t.attributes.icon||null:e.icon);return F`<state-badge
      class="icon-small"
      style=${At(e.icon_color)}
      .hass=${this._hass}
      .stateObj=${t}
      .overrideIcon=${i}
      .stateColor=${e.state_color}
    ></state-badge>`}_renderWarning(){return F`<hui-warning>
      ${this._hass.localize("ui.panel.lovelace.warning.entity_not_found","entity",this._config.entity)}
    </hui-warning>`}_runActiveAction(t){const e=this._activeAction;if(!e||!this._hass)return;const i="tap"===t?e.tap_action??{action:"more-info"}:"hold"===t?e.hold_action:e.double_tap_action;i&&((t,e,i,s)=>{switch(s?.action??"none"){case"none":return;case"more-info":return void pt(t,"hass-more-info",{entityId:s?.entity||i});case"toggle":return void e.callService("homeassistant","toggle",{entity_id:i});case"call-service":{const t=s?.service;if(!t)return;const[i,n]=t.split(".");return void e.callService(i,n,s?.service_data??s?.data??{})}case"navigate":{const t=s?.navigation_path;return void(t&&(history.pushState(null,"",t),pt(window,"location-changed",{replace:!1})))}case"url":{const t=s?.url_path;t&&window.open(t)}}})(this,this._hass,e.entityId,i),this._activeAction=void 0}}kt.styles=Tt,e([ut()],kt.prototype,"_hass",void 0),e([ut()],kt.prototype,"_config",void 0),e([ut()],kt.prototype,"_stateObj",void 0),e([ut()],kt.prototype,"_info",void 0),e([ut()],kt.prototype,"_entities",void 0);let Mt=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const Pt={},Ot=(t=>(...e)=>({_$litDirective$:t,values:e}))(class extends Mt{constructor(){super(...arguments),this.key=K}render(t,e){return this.key=t,e}update(t,[e,i]){return e!==this.key&&(((t,e=Pt)=>{t._$AH=e})(t),this.key=e),i}});var Ht="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",Ut="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z";const Lt=[{value:"",label:"No format"},{value:"brightness",label:"Brightness (0-255 → %)"},{value:"percent",label:"Percent (value × 100 → x %)"},{value:"duration",label:"Duration (seconds → h:mm:ss)"},{value:"duration-m",label:"Duration (milliseconds)"},{value:"duration-h",label:"Duration (hours)"},{value:"precision0",label:"Precision 0 decimals"},{value:"precision1",label:"Precision 1 decimal"},{value:"precision2",label:"Precision 2 decimals"},{value:"precision3",label:"Precision 3 decimals"},{value:"kilo",label:"Kilo (value / 1000)"},{value:"invert",label:"Invert (value × -1)"},{value:"position",label:"Position (100 - value)"},{value:"celsius_to_fahrenheit",label:"°C → °F"},{value:"fahrenheit_to_celsius",label:"°F → °C"},{value:"upper",label:"Text: UPPERCASE"},{value:"lower",label:"Text: lowercase"},{value:"capitalize",label:"Text: Capitalize first letter"},{value:"title",label:"Text: Title Case"},{value:"relative",label:"Timestamp: relative"},{value:"total",label:"Timestamp: total"},{value:"date",label:"Timestamp: date"},{value:"time",label:"Timestamp: time"},{value:"datetime",label:"Timestamp: date + time"}],Nt=[{name:"entity",required:!0,selector:{entity:{}}},{type:"grid",schema:[{name:"name",selector:{text:{}}},{name:"attribute",selector:{text:{}}}]},{type:"grid",schema:[{name:"unit",selector:{text:{}}},{name:"icon",selector:{icon:{}}}]},{name:"icon_color",selector:{text:{}}},{type:"grid",schema:[{name:"show_state",default:!0,selector:{boolean:{}}},{name:"state_color",selector:{boolean:{}}}]},{type:"grid",schema:[{name:"toggle",selector:{boolean:{}}},{name:"column",selector:{boolean:{}}}]},{name:"hide_unavailable",selector:{boolean:{}}},{name:"state_header",selector:{text:{}}},{name:"image",selector:{text:{}}},{name:"format",selector:{select:{mode:"dropdown",options:Lt}}}],It=[{name:"entity",selector:{entity:{}}},{type:"grid",schema:[{name:"name",selector:{text:{}}},{name:"attribute",selector:{text:{}}}]},{type:"grid",schema:[{name:"unit",selector:{text:{}}},{name:"icon",selector:{icon:{}}}]},{name:"icon_color",selector:{text:{}}},{type:"grid",schema:[{name:"state_color",selector:{boolean:{}}},{name:"toggle",selector:{boolean:{}}}]},{name:"hide_unavailable",selector:{boolean:{}}},{name:"format",selector:{select:{mode:"dropdown",options:Lt}}},{name:"tap_action",selector:{ui_action:{default_action:"more-info"}}}],jt=[{name:"tap_action",selector:{ui_action:{default_action:"more-info"}}},{name:"hold_action",selector:{ui_action:{default_action:"none"}}},{name:"double_tap_action",selector:{ui_action:{default_action:"none"}}}],Dt={entity:"Entity",attribute:"Attribute",name:"Name override",unit:"Unit",icon:"Icon",icon_color:"Icon color (CSS value, e.g. red, #ff0000, var(--my-color))",state_icon:"State-based icons",image:"Image URL",format:"Format",show_state:"Show main entity state",state_header:"State header label",state_color:"State color",column:"Column layout",toggle:"Show as toggle",hide_unavailable:"Hide if unavailable",tap_action:"Tap action",hold_action:"Hold action",double_tap_action:"Double-tap action"},Vt=[{name:"mode",selector:{select:{mode:"dropdown",options:[{value:"none",label:"None"},{value:"text",label:"Custom text"},{value:"generic",label:"HA built-in token"},{value:"entity",label:"Entity-based"}]}}}],Rt=[{name:"token",selector:{select:{mode:"dropdown",options:bt.map(t=>({value:t,label:t}))}}}],zt=[{name:"text",selector:{text:{multiline:!0}}}],Bt=t=>{const e={};if(!t)return e;for(const i of t.split("\n")){const t=i.trim();if(!t||t.startsWith("#"))continue;const s=t.indexOf(":");if(s<1)continue;const n=t.slice(0,s).trim();let o=t.slice(s+1).trim();(o.startsWith('"')&&o.endsWith('"')||o.startsWith("'")&&o.endsWith("'"))&&(o=o.slice(1,-1)),n&&o&&(e[n]=o)}return e},Ft="multipleEntityRowClipboard",Wt=["entity","name","attribute","unit","icon","icon_color","state_icon","state_color","toggle","hide_unavailable","format","tap_action","styles"];class Kt extends ct{constructor(){super(...arguments),this._selectedTab=0,this._entitiesExpanded=!0,this._keys=new Map,this._onEntitiesExpandedChanged=t=>{const e=t.target;"boolean"==typeof e?.expanded&&(this._entitiesExpanded=e.expanded)},this._computeLabel=t=>Dt[t.name]??t.name,this._mainKeyMapChanged=(t,e)=>{if(!this._config)return;const i=Bt(t.detail.value),s={...this._config};Object.keys(i).length>0?s[e]=i:delete s[e],pt(this,"config-changed",{config:s})},this._additionalKeyMapChanged=(t,e,i)=>{if(!this._config)return;const s=Bt(t.detail.value),n=[...this._config.entities??[]],o=n[e],a="string"==typeof o?{entity:o}:{...o};Object.keys(s).length>0?a[i]=s:delete a[i],n[e]=a,this._updateConfig({entities:n})},this._onTabShow=t=>{const e=t.detail?.name;if(null==e)return;const i=parseInt(e,10);Number.isNaN(i)||i===this._selectedTab||(this._selectedTab=i)},this._selectTab=t=>{this._selectedTab=t},this._mainValueChanged=t=>{if(!this._config)return;pt(this,"config-changed",{config:t.detail.value})},this._additionalValueChanged=(t,e)=>{if(!this._config)return;const i=t.detail.value,s=[...this._config.entities??[]];s[e]=i,this._updateConfig({entities:s})},this._addEntity=()=>{if(!this._config)return;const t=[...this._config.entities??[],{}];this._selectedTab=t.length,this._keys.clear(),this._updateConfig({entities:t})},this._deleteAdditional=t=>{if(!this._config)return;const e=[...this._config.entities??[]];e.splice(t,1),this._selectedTab>e.length&&(this._selectedTab=e.length),this._keys.clear(),this._updateConfig({entities:e.length?e:void 0})},this._moveAdditional=(t,e)=>{if(!this._config)return;const i=[...this._config.entities??[]],s=t+e;s<0||s>=i.length||([i[t],i[s]]=[i[s],i[t]],this._selectedTab=s+1,this._keys.clear(),this._updateConfig({entities:i}))},this._copyAdditional=t=>{const e=this._config?.entities?.[t];if(null==e)return;const i="string"==typeof e?{entity:e}:{...e};this._writeClipboard(i)},this._cutAdditional=t=>{this._copyAdditional(t),this._deleteAdditional(t)},this._copyMainAsTemplate=()=>{if(!this._config)return;const t={};for(const e of Wt){const i=this._config[e];void 0!==i&&(t[e]=i)}this._writeClipboard(t)},this._pasteEntity=()=>{if(!this._config)return;const t=this._readClipboard();if(!t)return;const e=[...this._config.entities??[],t];this._selectedTab=e.length,this._keys.clear(),this._updateConfig({entities:e})},this._secondaryModeChanged=t=>{if(!this._config)return;const e=t.detail.value.mode;if(e===this._secondaryInfoMode())return;let i;switch(e){case"none":i=void 0;break;case"text":i="";break;case"generic":i="last-changed";break;case"entity":i={entity:this._config.entity}}this._updateConfig({secondary_info:i})},this._secondaryTextChanged=t=>{this._updateConfig({secondary_info:t.detail.value.text})},this._secondaryTokenChanged=t=>{this._updateConfig({secondary_info:t.detail.value.token})},this._secondaryEntityChanged=t=>{this._updateConfig({secondary_info:t.detail.value})}}setConfig(t){this._config=t;const e=t.entities?.length??0;this._selectedTab>e&&(this._selectedTab=e),this._clipboardEntity=this._readClipboard()}_readClipboard(){try{const t=sessionStorage.getItem(Ft);if(!t)return;const e=JSON.parse(t);if(e&&"object"==typeof e)return e}catch{}}_writeClipboard(t){try{sessionStorage.setItem(Ft,JSON.stringify(t)),this._clipboardEntity=t}catch{}}get _hasNativeTabs(){return!!customElements.get("ha-tab-group")&&!!customElements.get("ha-tab-group-tab")}render(){return this.hass&&this._config?F`
      <ha-expansion-panel
        .header=${"Entities"}
        outlined
        ?expanded=${this._entitiesExpanded}
        @expanded-changed=${this._onEntitiesExpandedChanged}
      >
        ${this._renderEntitiesPanel()}
      </ha-expansion-panel>

      <ha-expansion-panel .header=${"Interactions"} outlined>
        <div class="panel-content">
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${jt}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._mainValueChanged}
          ></ha-form>
        </div>
      </ha-expansion-panel>

      <div class="footer">v${t} · ${process.env.BUILD_TIME}</div>
    `:K}_keyFor(t){return this._keys.has(t)||this._keys.set(t,`${t}-${Math.random().toString(36).slice(2,10)}`),this._keys.get(t)}_renderEntitiesPanel(){const t=this._config?.entities??[],e=this._selectedTab,i=1+t.length;return F`
      <div class="panel-content">
        <div class="tabs-row">
          ${this._hasNativeTabs?F`
                <ha-tab-group class="tabs" @wa-tab-show=${this._onTabShow}>
                  <ha-tab-group-tab slot="nav" .panel=${0} .active=${0===e}>
                    1
                  </ha-tab-group-tab>
                  ${t.map((t,i)=>F`
                      <ha-tab-group-tab
                        slot="nav"
                        .panel=${i+1}
                        .active=${e===i+1}
                      >
                        ${i+2}
                      </ha-tab-group-tab>
                    `)}
                </ha-tab-group>
              `:F`
                <div class="tab-bar--fallback" role="tablist">
                  <button
                    type="button"
                    class=${"tab "+(0===e?"tab--active":"")}
                    role="tab"
                    aria-selected=${0===e?"true":"false"}
                    aria-controls="mer-tab-panel"
                    @click=${()=>this._selectTab(0)}
                  >
                    1
                  </button>
                  ${t.map((t,i)=>F`
                      <button
                        type="button"
                        class=${"tab "+(e===i+1?"tab--active":"")}
                        role="tab"
                        aria-selected=${e===i+1?"true":"false"}
                        aria-controls="mer-tab-panel"
                        @click=${()=>this._selectTab(i+1)}
                      >
                        ${i+2}
                      </button>
                    `)}
                </div>
              `}
          <ha-icon-button
            class="tabs__add"
            .label=${"Add entity"}
            .path=${"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"}
            @click=${this._addEntity}
          ></ha-icon-button>
        </div>

        <div id="mer-tab-panel" role="tabpanel">
          ${Ot(this._keyFor(e),0===e?this._renderMainTab():this._renderAdditionalTab(e-1,i))}
        </div>
      </div>
    `}_renderMainTab(){return F`
      <div class="child-actions">
        <ha-icon-button
          .label=${"Copy main as template"}
          .path=${Ht}
          @click=${this._copyMainAsTemplate}
        ></ha-icon-button>
        <ha-icon-button
          .label=${"Paste as new entity"}
          .path=${Ut}
          .disabled=${!this._clipboardEntity}
          @click=${this._pasteEntity}
        ></ha-icon-button>
      </div>
      <div class="child-editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${Nt}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._mainValueChanged}
        ></ha-form>
        <div class="section-label">Secondary info</div>
        ${this._renderSecondaryInfoBlock()}
        <div class="section-label">State-based icons</div>
        ${this._renderKeyMapBlock(this._config?.state_icon,t=>this._mainKeyMapChanged(t,"state_icon"))}
        <div class="section-label">Custom CSS</div>
        ${this._renderKeyMapBlock(this._config?.styles,t=>this._mainKeyMapChanged(t,"styles"))}
      </div>
    `}_renderKeyMapBlock(t,e){return F`
      <ha-code-editor
        mode="yaml"
        autocomplete-entities
        autocomplete-icons
        .hass=${this.hass}
        .value=${i=t,!i||"object"!=typeof i||Array.isArray(i)?"":Object.entries(i).filter(([,t])=>null!=t).map(([t,e])=>`${t}: ${e}`).join("\n")}
        @value-changed=${e}
      ></ha-code-editor>
    `;var i}_renderAdditionalTab(t,e){const i=this._config.entities[t],s="string"==typeof i?{entity:i}:i,n=(this._config?.entities?.length??1)-1;return F`
      <div class="child-actions">
        <ha-icon-button
          .label=${"Move before"}
          .path=${"M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"}
          .disabled=${0===t}
          @click=${()=>this._moveAdditional(t,-1)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${"Move after"}
          .path=${"M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"}
          .disabled=${t===n}
          @click=${()=>this._moveAdditional(t,1)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${"Copy entity"}
          .path=${Ht}
          @click=${()=>this._copyAdditional(t)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${"Cut entity"}
          .path=${"M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z"}
          @click=${()=>this._cutAdditional(t)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${"Paste from clipboard"}
          .path=${Ut}
          .disabled=${!this._clipboardEntity}
          @click=${this._pasteEntity}
        ></ha-icon-button>
        <ha-icon-button
          .label=${"Delete entity"}
          .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
          @click=${()=>this._deleteAdditional(t)}
        ></ha-icon-button>
      </div>
      <div class="child-editor">
        <ha-form
          .hass=${this.hass}
          .data=${s}
          .schema=${It}
          .computeLabel=${this._computeLabel}
          @value-changed=${e=>this._additionalValueChanged(e,t)}
        ></ha-form>
        <div class="section-label">State-based icons</div>
        ${this._renderKeyMapBlock(s.state_icon,e=>this._additionalKeyMapChanged(e,t,"state_icon"))}
        <div class="section-label">Custom CSS</div>
        ${this._renderKeyMapBlock(s.styles,e=>this._additionalKeyMapChanged(e,t,"styles"))}
      </div>
    `}_secondaryInfoMode(){const t=this._config?.secondary_info;return null==t?"none":"object"==typeof t?"entity":"string"==typeof t&&bt.includes(t)?"generic":"text"}_renderSecondaryInfoBlock(){const t=this._secondaryInfoMode(),e=this._config?.secondary_info;return F`
      <div>
        <ha-form
          .hass=${this.hass}
          .data=${{mode:t}}
          .schema=${Vt}
          .computeLabel=${()=>"Mode"}
          @value-changed=${this._secondaryModeChanged}
        ></ha-form>
        ${"text"===t?F`<div class="secondary-sub-form">
              <ha-form
                .hass=${this.hass}
                .data=${{text:e??""}}
                .schema=${zt}
                .computeLabel=${()=>"Custom text"}
                @value-changed=${this._secondaryTextChanged}
              ></ha-form>
            </div>`:K}
        ${"generic"===t?F`<div class="secondary-sub-form">
              <ha-form
                .hass=${this.hass}
                .data=${{token:e}}
                .schema=${Rt}
                .computeLabel=${()=>"HA built-in"}
                @value-changed=${this._secondaryTokenChanged}
              ></ha-form>
            </div>`:K}
        ${"entity"===t?F`<div class="secondary-sub-form">
              <ha-form
                .hass=${this.hass}
                .data=${e}
                .schema=${It}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._secondaryEntityChanged}
              ></ha-form>
            </div>`:K}
      </div>
    `}_updateConfig(t){if(!this._config)return;const e={...this._config};for(const[i,s]of Object.entries(t))void 0===s?delete e[i]:e[i]=s;pt(this,"config-changed",{config:e})}}Kt.styles=r`
    ha-expansion-panel {
      display: block;
      margin-top: 12px;
    }
    .panel-content {
      padding: 12px 0;
    }
    .tabs-row {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      margin-bottom: 8px;
    }
    ha-tab-group.tabs {
      flex: 1;
      min-width: 0;
    }
    .tab-bar--fallback {
      display: flex;
      flex: 1;
      gap: 4px;
      overflow-x: auto;
    }
    .tab-bar--fallback .tab {
      padding: 8px 12px;
      cursor: pointer;
      border: 1px solid transparent;
      border-bottom: none;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      white-space: nowrap;
      color: var(--secondary-text-color);
      background: transparent;
      font: inherit;
    }
    .tab-bar--fallback .tab--active {
      background: var(--card-background-color);
      border-color: var(--divider-color);
      color: var(--primary-text-color);
    }
    .tabs__add {
      flex: 0 0 auto;
    }
    .child-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0 8px;
    }
    .child-actions ha-icon-button[disabled] {
      opacity: 0.4;
      pointer-events: none;
    }
    .child-editor {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px;
      background: var(--card-background-color);
    }
    .secondary-sub-form {
      margin-top: 8px;
    }
    .section-label {
      margin-top: 16px;
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      font-size: 11px;
      color: var(--secondary-text-color);
      text-align: right;
    }
  `,e([ut()],Kt.prototype,"_config",void 0),e([ut()],Kt.prototype,"_selectedTab",void 0),e([ut()],Kt.prototype,"_entitiesExpanded",void 0),e([ut()],Kt.prototype,"_clipboardEntity",void 0);const qt="multiple-entity-row",Zt="multiple-entity-row-editor";!function(){const t=window;t.customCards=t.customCards||[],t.customCards.find(t=>t.type===qt)||t.customCards.push({type:qt,name:"Multiple Entity Row",description:"Show multiple entity states, attributes and icons on a single entity row",documentationURL:"https://github.com/duczz/ha-multiple-entity-row"})}(),customElements.get(qt)||(customElements.define(qt,kt),console.info(`%c MULTIPLE-ENTITY-ROW %c v${t} `,"color: cyan; background: black; font-weight: bold; padding: 2px 6px; border-radius: 3px 0 0 3px;","color: darkblue; background: white; font-weight: bold; padding: 2px 6px; border-radius: 0 3px 3px 0;")),customElements.get(Zt)||customElements.define(Zt,Kt);
