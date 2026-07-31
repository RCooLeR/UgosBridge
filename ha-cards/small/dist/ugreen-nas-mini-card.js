var Le = globalThis, at = Le.ShadowRoot && (Le.ShadyCSS === void 0 || Le.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ct = /* @__PURE__ */ Symbol(), Nt = /* @__PURE__ */ new WeakMap(), pr = class {
  constructor(e, t, r) {
    if (this._$cssResult$ = !0, r !== ct) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (at && e === void 0) {
      const r = t !== void 0 && t.length === 1;
      r && (e = Nt.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), r && Nt.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
}, qr = (e) => new pr(typeof e == "string" ? e : e + "", void 0, ct), Vr = (e, ...t) => new pr(e.length === 1 ? e[0] : t.reduce((r, n, s) => r + ((o) => {
  if (o._$cssResult$ === !0) return o.cssText;
  if (typeof o == "number") return o;
  throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[s + 1], e[0]), e, ct), Kr = (e, t) => {
  if (at) e.adoptedStyleSheets = t.map((r) => r instanceof CSSStyleSheet ? r : r.styleSheet);
  else for (const r of t) {
    const n = document.createElement("style"), s = Le.litNonce;
    s !== void 0 && n.setAttribute("nonce", s), n.textContent = r.cssText, e.appendChild(n);
  }
}, Ht = at ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let r = "";
  for (const n of t.cssRules) r += n.cssText;
  return qr(r);
})(e) : e, { is: Xr, defineProperty: Jr, getOwnPropertyDescriptor: Zr, getOwnPropertyNames: Yr, getOwnPropertySymbols: Qr, getPrototypeOf: en } = Object, je = globalThis, jt = je.trustedTypes, tn = jt ? jt.emptyScript : "", rn = je.reactiveElementPolyfillSupport, $e = (e, t) => e, Ne = {
  toAttribute(e, t) {
    switch (t) {
      case Boolean:
        e = e ? tn : null;
        break;
      case Object:
      case Array:
        e = e == null ? e : JSON.stringify(e);
    }
    return e;
  },
  fromAttribute(e, t) {
    let r = e;
    switch (t) {
      case Boolean:
        r = e !== null;
        break;
      case Number:
        r = e === null ? null : Number(e);
        break;
      case Object:
      case Array:
        try {
          r = JSON.parse(e);
        } catch {
          r = null;
        }
    }
    return r;
  }
}, lt = (e, t) => !Xr(e, t), Dt = {
  attribute: !0,
  type: String,
  converter: Ne,
  reflect: !1,
  useDefault: !1,
  hasChanged: lt
};
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), je.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var ce = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Dt) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const r = /* @__PURE__ */ Symbol(), n = this.getPropertyDescriptor(e, r, t);
      n !== void 0 && Jr(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, t, r) {
    const { get: n, set: s } = Zr(this.prototype, e) ?? {
      get() {
        return this[t];
      },
      set(o) {
        this[t] = o;
      }
    };
    return {
      get: n,
      set(o) {
        const i = n?.call(this);
        s?.call(this, o), this.requestUpdate(e, i, r);
      },
      configurable: !0,
      enumerable: !0
    };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Dt;
  }
  static _$Ei() {
    if (this.hasOwnProperty($e("elementProperties"))) return;
    const e = en(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty($e("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty($e("properties"))) {
      const t = this.properties, r = [...Yr(t), ...Qr(t)];
      for (const n of r) this.createProperty(n, t[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [r, n] of t) this.elementProperties.set(r, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, r] of this.elementProperties) {
      const n = this._$Eu(t, r);
      n !== void 0 && this._$Eh.set(n, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const r = new Set(e.flat(1 / 0).reverse());
      for (const n of r) t.unshift(Ht(n));
    } else e !== void 0 && t.push(Ht(e));
    return t;
  }
  static _$Eu(e, t) {
    const r = t.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const r of t.keys()) this.hasOwnProperty(r) && (e.set(r, this[r]), delete this[r]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Kr(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, r) {
    this._$AK(e, r);
  }
  _$ET(e, t) {
    const r = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, r);
    if (n !== void 0 && r.reflect === !0) {
      const s = (r.converter?.toAttribute !== void 0 ? r.converter : Ne).toAttribute(t, r.type);
      this._$Em = e, s == null ? this.removeAttribute(n) : this.setAttribute(n, s), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const r = this.constructor, n = r._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const s = r.getPropertyOptions(n), o = typeof s.converter == "function" ? { fromAttribute: s.converter } : s.converter?.fromAttribute !== void 0 ? s.converter : Ne;
      this._$Em = n;
      const i = o.fromAttribute(t, s.type);
      this[n] = i ?? this._$Ej?.get(n) ?? i, this._$Em = null;
    }
  }
  requestUpdate(e, t, r, n = !1, s) {
    if (e !== void 0) {
      const o = this.constructor;
      if (n === !1 && (s = this[e]), r ??= o.getPropertyOptions(e), !((r.hasChanged ?? lt)(s, t) || r.useDefault && r.reflect && s === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, r)))) return;
      this.C(e, t, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: r, reflect: n, wrapped: s }, o) {
    r && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), s !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || r || (t = void 0), this._$AL.set(e, t)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [n, s] of this._$Ep) this[n] = s;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [n, s] of r) {
        const { wrapped: o } = s, i = this[n];
        o !== !0 || this._$AL.has(n) || i === void 0 || this.C(n, void 0, s, i);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((r) => r.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
ce.elementStyles = [], ce.shadowRootOptions = { mode: "open" }, ce[$e("elementProperties")] = /* @__PURE__ */ new Map(), ce[$e("finalized")] = /* @__PURE__ */ new Map(), rn?.({ ReactiveElement: ce }), (je.reactiveElementVersions ??= []).push("2.1.2");
var dt = globalThis, Ot = (e) => e, He = dt.trustedTypes, St = He ? He.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, mr = "$lit$", Z = `lit$${Math.random().toFixed(9).slice(2)}$`, _r = "?" + Z, nn = `<${_r}>`, se = document, Be = () => se.createComment(""), ke = (e) => e === null || typeof e != "object" && typeof e != "function", ut = Array.isArray, sn = (e) => ut(e) || typeof e?.[Symbol.iterator] == "function", Ke = `[ 	
\f\r]`, fe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Wt = /-->/g, Ft = />/g, Q = RegExp(`>|${Ke}(?:([^\\s"'>=/]+)(${Ke}*=${Ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Gt = /'/g, qt = /"/g, yr = /^(?:script|style|textarea|title)$/i, pt = (e) => (t, ...r) => ({
  _$litType$: e,
  strings: t,
  values: r
}), V = pt(1), T = pt(2), Co = pt(3), le = /* @__PURE__ */ Symbol.for("lit-noChange"), k = /* @__PURE__ */ Symbol.for("lit-nothing"), Vt = /* @__PURE__ */ new WeakMap(), te = se.createTreeWalker(se, 129);
function hr(e, t) {
  if (!ut(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return St !== void 0 ? St.createHTML(t) : t;
}
var on = (e, t) => {
  const r = e.length - 1, n = [];
  let s, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", i = fe;
  for (let a = 0; a < r; a++) {
    const c = e[a];
    let l, d, u = -1, v = 0;
    for (; v < c.length && (i.lastIndex = v, d = i.exec(c), d !== null); ) v = i.lastIndex, i === fe ? d[1] === "!--" ? i = Wt : d[1] !== void 0 ? i = Ft : d[2] !== void 0 ? (yr.test(d[2]) && (s = RegExp("</" + d[2], "g")), i = Q) : d[3] !== void 0 && (i = Q) : i === Q ? d[0] === ">" ? (i = s ?? fe, u = -1) : d[1] === void 0 ? u = -2 : (u = i.lastIndex - d[2].length, l = d[1], i = d[3] === void 0 ? Q : d[3] === '"' ? qt : Gt) : i === qt || i === Gt ? i = Q : i === Wt || i === Ft ? i = fe : (i = Q, s = void 0);
    const y = i === Q && e[a + 1].startsWith("/>") ? " " : "";
    o += i === fe ? c + nn : u >= 0 ? (n.push(l), c.slice(0, u) + mr + c.slice(u) + Z + y) : c + Z + (u === -2 ? a : y);
  }
  return [hr(e, o + (e[r] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), n];
}, tt = class gr {
  constructor({ strings: t, _$litType$: r }, n) {
    let s;
    this.parts = [];
    let o = 0, i = 0;
    const a = t.length - 1, c = this.parts, [l, d] = on(t, r);
    if (this.el = gr.createElement(l, n), te.currentNode = this.el.content, r === 2 || r === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (s = te.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const u of s.getAttributeNames()) if (u.endsWith(mr)) {
          const v = d[i++], y = s.getAttribute(u).split(Z), x = /([.?@])?(.*)/.exec(v);
          c.push({
            type: 1,
            index: o,
            name: x[2],
            strings: y,
            ctor: x[1] === "." ? cn : x[1] === "?" ? ln : x[1] === "@" ? dn : De
          }), s.removeAttribute(u);
        } else u.startsWith(Z) && (c.push({
          type: 6,
          index: o
        }), s.removeAttribute(u));
        if (yr.test(s.tagName)) {
          const u = s.textContent.split(Z), v = u.length - 1;
          if (v > 0) {
            s.textContent = He ? He.emptyScript : "";
            for (let y = 0; y < v; y++) s.append(u[y], Be()), te.nextNode(), c.push({
              type: 2,
              index: ++o
            });
            s.append(u[v], Be());
          }
        }
      } else if (s.nodeType === 8) if (s.data === _r) c.push({
        type: 2,
        index: o
      });
      else {
        let u = -1;
        for (; (u = s.data.indexOf(Z, u + 1)) !== -1; ) c.push({
          type: 7,
          index: o
        }), u += Z.length - 1;
      }
      o++;
    }
  }
  static createElement(t, r) {
    const n = se.createElement("template");
    return n.innerHTML = t, n;
  }
};
function de(e, t, r = e, n) {
  if (t === le) return t;
  let s = n !== void 0 ? r._$Co?.[n] : r._$Cl;
  const o = ke(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(e), s._$AT(e, r, n)), n !== void 0 ? (r._$Co ??= [])[n] = s : r._$Cl = s), s !== void 0 && (t = de(e, s._$AS(e, t.values), s, n)), t;
}
var an = class {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: r } = this._$AD, n = (e?.creationScope ?? se).importNode(t, !0);
    te.currentNode = n;
    let s = te.nextNode(), o = 0, i = 0, a = r[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let c;
        a.type === 2 ? c = new mt(s, s.nextSibling, this, e) : a.type === 1 ? c = new a.ctor(s, a.name, a.strings, this, e) : a.type === 6 && (c = new un(s, this, e)), this._$AV.push(c), a = r[++i];
      }
      o !== a?.index && (s = te.nextNode(), o++);
    }
    return te.currentNode = se, n;
  }
  p(e) {
    let t = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(e, r, t), t += r.strings.length - 2) : r._$AI(e[t])), t++;
  }
}, mt = class fr {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, r, n, s) {
    this.type = 2, this._$AH = k, this._$AN = void 0, this._$AA = t, this._$AB = r, this._$AM = n, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const r = this._$AM;
    return r !== void 0 && t?.nodeType === 11 && (t = r.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, r = this) {
    t = de(this, t, r), ke(t) ? t === k || t == null || t === "" ? (this._$AH !== k && this._$AR(), this._$AH = k) : t !== this._$AH && t !== le && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : sn(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== k && ke(this._$AH) ? this._$AA.nextSibling.data = t : this.T(se.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: r, _$litType$: n } = t, s = typeof n == "number" ? this._$AC(t) : (n.el === void 0 && (n.el = tt.createElement(hr(n.h, n.h[0]), this.options)), n);
    if (this._$AH?._$AD === s) this._$AH.p(r);
    else {
      const o = new an(s, this), i = o.u(this.options);
      o.p(r), this.T(i), this._$AH = o;
    }
  }
  _$AC(t) {
    let r = Vt.get(t.strings);
    return r === void 0 && Vt.set(t.strings, r = new tt(t)), r;
  }
  k(t) {
    ut(this._$AH) || (this._$AH = [], this._$AR());
    const r = this._$AH;
    let n, s = 0;
    for (const o of t) s === r.length ? r.push(n = new fr(this.O(Be()), this.O(Be()), this, this.options)) : n = r[s], n._$AI(o), s++;
    s < r.length && (this._$AR(n && n._$AB.nextSibling, s), r.length = s);
  }
  _$AR(t = this._$AA.nextSibling, r) {
    for (this._$AP?.(!1, !0, r); t !== this._$AB; ) {
      const n = Ot(t).nextSibling;
      Ot(t).remove(), t = n;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}, De = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, r, n, s) {
    this.type = 1, this._$AH = k, this._$AN = void 0, this.element = e, this.name = t, this._$AM = n, this.options = s, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(/* @__PURE__ */ new String()), this.strings = r) : this._$AH = k;
  }
  _$AI(e, t = this, r, n) {
    const s = this.strings;
    let o = !1;
    if (s === void 0) e = de(this, e, t, 0), o = !ke(e) || e !== this._$AH && e !== le, o && (this._$AH = e);
    else {
      const i = e;
      let a, c;
      for (e = s[0], a = 0; a < s.length - 1; a++) c = de(this, i[r + a], t, a), c === le && (c = this._$AH[a]), o ||= !ke(c) || c !== this._$AH[a], c === k ? e = k : e !== k && (e += (c ?? "") + s[a + 1]), this._$AH[a] = c;
    }
    o && !n && this.j(e);
  }
  j(e) {
    e === k ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}, cn = class extends De {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === k ? void 0 : e;
  }
}, ln = class extends De {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== k);
  }
}, dn = class extends De {
  constructor(e, t, r, n, s) {
    super(e, t, r, n, s), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = de(this, e, t, 0) ?? k) === le) return;
    const r = this._$AH, n = e === k && r !== k || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, s = e !== k && (r === k || n);
    n && this.element.removeEventListener(this.name, this, r), s && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}, un = class {
  constructor(e, t, r) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    de(this, e);
  }
};
var pn = dt.litHtmlPolyfillSupport;
pn?.(tt, mt), (dt.litHtmlVersions ??= []).push("3.3.2");
var mn = (e, t, r) => {
  const n = r?.renderBefore ?? t;
  let s = n._$litPart$;
  if (s === void 0) {
    const o = r?.renderBefore ?? null;
    n._$litPart$ = s = new mt(t.insertBefore(Be(), o), o, void 0, r ?? {});
  }
  return s._$AI(e), s;
}, _t = globalThis, we = class extends ce {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = mn(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return le;
  }
};
we._$litElement$ = !0, we.finalized = !0, _t.litElementHydrateSupport?.({ LitElement: we });
var _n = _t.litElementPolyfillSupport;
_n?.({ LitElement: we });
(_t.litElementVersions ??= []).push("4.2.2");
var yn = (e) => (t, r) => {
  r !== void 0 ? r.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
}, hn = {
  attribute: !0,
  type: String,
  converter: Ne,
  reflect: !1,
  hasChanged: lt
}, gn = (e = hn, t, r) => {
  const { kind: n, metadata: s } = r;
  let o = globalThis.litPropertyMetadata.get(s);
  if (o === void 0 && globalThis.litPropertyMetadata.set(s, o = /* @__PURE__ */ new Map()), n === "setter" && ((e = Object.create(e)).wrapped = !0), o.set(r.name, e), n === "accessor") {
    const { name: i } = r;
    return {
      set(a) {
        const c = t.get.call(this);
        t.set.call(this, a), this.requestUpdate(i, c, e, !0, a);
      },
      init(a) {
        return a !== void 0 && this.C(i, void 0, e, a), a;
      }
    };
  }
  if (n === "setter") {
    const { name: i } = r;
    return function(a) {
      const c = this[i];
      t.call(this, a), this.requestUpdate(i, c, e, !0, a);
    };
  }
  throw Error("Unsupported decorator location: " + n);
};
function vr(e) {
  return (t, r) => typeof r == "object" ? gn(e, t, r) : ((n, s, o) => {
    const i = s.hasOwnProperty(o);
    return s.constructor.createProperty(o, n), i ? Object.getOwnPropertyDescriptor(s, o) : void 0;
  })(e, t, r);
}
function Oe(e) {
  return vr({
    ...e,
    state: !0,
    attribute: !1
  });
}
var m = {
  panelTop: "rgba(18, 45, 80, 0.42)",
  panelBottom: "rgba(5, 14, 28, 0.96)",
  panelSolid: "rgba(10, 23, 44, 0.92)",
  border: "rgba(61, 126, 216, 0.35)",
  borderStrong: "rgba(61, 185, 255, 0.55)",
  textMain: "#e8f1ff",
  textSoft: "#9fb4d7",
  good: "#69eb57",
  green: "#69eb57",
  purple: "#b26cff",
  cyan: "#17ebff",
  blue: "#2aa7ff",
  softBlue: "#7ea2ff",
  yellow: "#ffd84d",
  danger: "#ff6b7d",
  shellTop: "rgba(7, 18, 35, 0.98)",
  shellBottom: "rgba(2, 11, 24, 0.98)"
}, br = 21, Ae = [
  m.green,
  m.cyan,
  m.purple,
  m.softBlue
], fn = /^sensor\.ugos_bridge_host_(.+?)_cpu_usage_percent$/, vn = /^sensor\.ugos_bridge_project_(.+?)_cpu_usage_percent$/, bn = /^sensor\.([a-z0-9_]+)_\1_cpu(?:_|$)/, $n = /^(?:sensor|binary_sensor)\.ugos_bridge_host_(.+?)_(?:array|bond|cooling|disk|filesystem|gpu|health|network|software|ups)_/, wn = /^(?:sensor|binary_sensor)\.([a-z0-9_]+)_(?:array|bond|cooling|disk|filesystem|gpu|health|network|software|ups)_[a-z0-9][a-z0-9_]*_[a-z0-9_]+(?:_\d+)?$/, Bn = /^(?:sensor|binary_sensor)\.ugos_bridge_container_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/, kn = /^(?:sensor|binary_sensor)\.ugos_bridge_vm_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/, xn = /^sensor\.ugos_bridge_process_(.+?)_(process_count|cpu_usage_percent|memory_usage_bytes|cpu_time_seconds)$/, Pn = {
  cpu: "cpu_usage_percent",
  load1: "load_1",
  cpufreq: "cpu_frequency_mhz",
  memoryUsedBytes: "memory_used_bytes",
  memoryUsedPercent: "memory_used_percent",
  swapUsedPercent: "swap_used_percent",
  uptime: "uptime_seconds"
}, rt = /* @__PURE__ */ new WeakMap(), Kt = /* @__PURE__ */ new WeakMap(), pe = (e) => {
  let t = rt.get(e);
  return t || (t = {
    prefixEntries: /* @__PURE__ */ new Map(),
    computedResults: /* @__PURE__ */ new Map(),
    resolutionResults: /* @__PURE__ */ new Map(),
    booleanResults: /* @__PURE__ */ new Map()
  }, rt.set(e, t)), t;
}, R = (e) => {
  const t = pe(e);
  return t.keys || (t.keys = Object.keys(e)), t.keys;
}, C = (e) => {
  const t = pe(e);
  return t.entries || (t.entries = Object.entries(e)), t.entries;
}, S = (e) => {
  const t = pe(e);
  return t.values || (t.values = Object.values(e)), t.values;
}, xe = (e, t) => {
  const r = pe(e), n = r.prefixEntries.get(t);
  if (n) return n;
  const s = C(e).filter(([o]) => o.startsWith(t));
  return r.prefixEntries.set(t, s), s;
}, j = (e, t) => Array.from(new Map(t.flatMap((r) => xe(e, r))).entries()), W = (e, t) => t.find((r) => yt(e[r])), D = (e, t, r, n = "sensor.") => {
  const s = B(r);
  return C(e).filter(([o, i]) => {
    if (!o.startsWith(n)) return !1;
    const a = o.toLowerCase();
    return B(b(i, "name") ?? "") === s || a.includes(`_${t}_${s}_`) || a.includes(`ugos_bridge_${t}_${s}_`);
  });
}, f = (e, t) => O(e, t) ?? O(e, {
  ...t,
  unit: void 0
}), A = (e, t, r) => {
  const n = pe(e), s = n.computedResults.get(t);
  if (s !== void 0) return s;
  const o = r();
  return n.computedResults.set(t, o), o;
}, z = (e, t, r) => {
  const n = pe(e);
  if (n.resolutionResults.has(t)) return n.resolutionResults.get(t);
  const s = r();
  return n.resolutionResults.set(t, s), s;
}, Pe = (e) => {
  if (!e) return;
  let t = Kt.get(e);
  const r = typeof e.attributes.friendly_name == "string" ? e.attributes.friendly_name : "", n = Ns(typeof e.attributes.unit_of_measurement == "string" ? e.attributes.unit_of_measurement : void 0);
  return !t || t.friendlyName !== r || t.unit !== n ? (t = {
    friendlyName: r,
    friendlyNameLower: r.toLowerCase(),
    state: e.state,
    unit: n
  }, Kt.set(e, t)) : t.state !== e.state && (t.state = e.state, t.parsedNumber = void 0, t.textState = void 0), t;
}, Xt = () => ({ samples: [] }), Cn = (e, t, r) => {
  const n = e?.states;
  if (!n) return null;
  rt.delete(n);
  const s = Vn(n, t?.host);
  if (!s) return null;
  const o = `ugos_bridge_host_${s}`, i = Y(n, s, "cpu"), a = Y(n, s, "memoryUsedBytes"), c = ee(n, s, "cpu") ?? 0, l = ls(n, s), d = l.value, u = ee(n, s, "cpufreq"), v = ee(n, s, "uptime") ?? 0, y = ee(n, s, "memoryUsedBytes") ?? 0, x = ee(n, s, "memoryUsedPercent") ?? 0, F = ee(n, s, "swapUsedPercent") ?? 0, $ = Jn(y, x, t?.memoryTotalBytes), he = Kn(n, s, t?.host), Mr = Rn(n, i), Ir = Nn(n, a, $, y), Er = Dn(n), Me = qn(n, s), wt = er(Me, [
    "cpu",
    "package",
    "soc",
    "core",
    "tctl"
  ]), N = as(n, s, o)[0], Ar = N !== void 0 ? Re(n, s, o, N, "busy") : void 0, Bt = N !== void 0 ? Re(n, s, o, N, "current") : void 0, kt = N !== void 0 ? Re(n, s, o, N, "max") : void 0, ie = N !== void 0 ? Gs(n, s, o, N) : void 0, Ur = N !== void 0 ? w(n, Bt) : void 0, zr = N !== void 0 ? w(n, kt) : void 0, xt = er(Me, [
    "gpu",
    "graphics",
    "igpu",
    "intel"
  ]), Pt = N !== void 0 ? hs(n, s, o, N, [
    Ar,
    Bt,
    kt
  ]) : [], Tr = Hn(n, Pt), Lr = jn(n, Pt), Rr = Zn(Fn(n, s), t?.storageFilesystems), Ct = es(n, s, o).map((p) => In(n, s, he, p)).filter((p) => p !== null).sort((p, E) => p.name.localeCompare(E.name)), Nr = En(Gn(n, s), Rr, Ct), Hr = Qn(n), ge = Array.from(new Set(Hr)).map((p) => An(n, p)).filter((p) => p !== null).sort((p, E) => E.cpuPercent - p.cpuPercent || p.title.localeCompare(E.title)), Ie = rs(n, s, o), jr = ns(n, s, o), Ge = Yn(ss(Array.from(/* @__PURE__ */ new Set([...Ie, ...jr])).sort(), t?.networkInterfaces), t?.networkInterfaces), Dr = Ge.map((p) => Ie.includes(p) ? Sn(n, s, p, Me) : Wn(n, s, p, Me)).filter((p) => p !== null).sort((p, E) => p.name.localeCompare(E.name)), Mt = Ge.filter((p) => Ie.includes(p)), It = Mt.length > 0 ? Mt : Ie, Et = It.reduce((p, E) => p + (w(n, ne(n, s, E, "rx")) ?? 0) * 8, 0), At = It.reduce((p, E) => p + (w(n, ne(n, s, E, "tx")) ?? 0) * 8, 0), qe = os(Ge), Ee = Object.fromEntries(qe.map((p) => [p, wr(n, s, p)])), Ve = (i ? n[i]?.last_updated : void 0) ?? (i ? n[i]?.last_changed : void 0) ?? `${c}:${x}:${ie ?? 0}:${Et}:${At}:${JSON.stringify(Ee)}`, ae = bs(r, {
    key: Ve,
    timestampLabel: eo(Ve),
    cpuPercent: c,
    ramPercent: x,
    gpuPercent: ie ?? 0,
    load1: d,
    networkBpsBySlug: Ee
  }), Ut = ze(ae.samples.map((p) => p.cpuPercent), c, 12), zt = ze(ae.samples.map((p) => p.ramPercent), x, 12), Tt = ze(ae.samples.map((p) => p.gpuPercent), ie ?? 0, 12), Or = ze(ae.samples.map((p) => p.load1), d, 12), Lt = $s(ae.samples, qe, Ee), Sr = qe.map((p, E) => ({
    key: p,
    label: bt(p),
    color: is(p, E),
    currentBps: Ee[p] ?? 0,
    series: Lt.map((Gr) => Gr.totalsByInterface[p] ?? 0)
  })), Wr = [
    {
      kind: "cpu",
      title: "CPU",
      accent: m.blue,
      valuePercent: c,
      temperatureCelsius: wt ?? 0,
      series: Ut
    },
    {
      kind: "ram",
      title: "RAM",
      accent: m.purple,
      valuePercent: x,
      usedBytes: y,
      totalBytes: $,
      series: zt
    },
    ...ie !== void 0 ? [{
      kind: "gpu",
      title: "GPU",
      accent: m.green,
      valuePercent: ie,
      temperatureCelsius: xt ?? 0,
      series: Tt
    }] : [],
    {
      kind: "system-load",
      title: "System Load",
      accent: m.softBlue,
      value: d,
      valuePercent: l.valuePercent,
      valueText: l.valueText,
      unit: l.unit,
      statusText: l.statusText,
      series: Or
    },
    {
      kind: "network",
      title: "Network",
      accent: m.green,
      downloadBps: Et,
      uploadBps: At
    }
  ], Fr = Mn({
    cpuFrequencyMHz: u,
    cpuPercent: c,
    cpuSeries: Ut,
    cpuTemperature: wt,
    gpuBusyPercent: ie,
    gpuCurrentMHz: Ur,
    gpuMaxMHz: zr,
    gpuSeries: Tt,
    gpuTemperature: xt,
    load1: d,
    loadValueText: l.valueText,
    memoryTotalBytes: $,
    memoryUsedBytes: y,
    memoryUsedPercent: x,
    ramSeries: zt,
    swapUsedPercent: F,
    uptimeSeconds: v
  }), Rt = Es(s);
  return {
    history: ae,
    watchEntityIds: As(n, Rt, t?.ipEntity),
    watchPrefixes: Rt,
    model: {
      deviceInfo: {
        model: t?.deviceModel ?? "UGREEN NAS",
        ugosVersion: t?.ugosVersion ?? "Unavailable",
        hostname: he,
        ipAddress: Xn(n, t),
        uptimeSeconds: v,
        lastUpdated: to(Ve)
      },
      hardwareSummary: Wr,
      hardwareDetails: Fr,
      drives: Ct,
      storagePools: Nr,
      dockerProjects: ge,
      dockerTotals: {
        totalContainers: ge.reduce((p, E) => p + E.totalContainers, 0),
        runningContainers: ge.reduce((p, E) => p + E.runningContainers, 0),
        totalProjects: ge.length,
        onlineProjects: ge.filter((p) => p.status === "up").length
      },
      networkInterfaces: Dr,
      networkTrafficHistory: Lt,
      networkTrafficLines: Sr,
      cpuCores: Mr,
      ramBreakdown: Ir,
      gpuEngines: Tr,
      gpuStats: Lr,
      topProcesses: Er
    }
  };
}, Mn = ({ cpuFrequencyMHz: e, cpuPercent: t, cpuSeries: r, cpuTemperature: n, gpuBusyPercent: s, gpuCurrentMHz: o, gpuMaxMHz: i, gpuSeries: a, gpuTemperature: c, load1: l, loadValueText: d, memoryTotalBytes: u, memoryUsedBytes: v, memoryUsedPercent: y, ramSeries: x, swapUsedPercent: F, uptimeSeconds: $ }) => {
  const he = [{
    key: "cpu",
    title: "CPU",
    subtitle: "System Processor",
    accent: m.blue,
    utilizationPercent: t,
    series: r,
    detailRows: [
      {
        label: "Load (1m)",
        value: d
      },
      {
        label: "Frequency",
        value: e ? `${Math.round(e)} MHz` : "Unavailable"
      },
      {
        label: "Temperature",
        value: n !== void 0 ? `${Math.round(n)}°C` : "Unavailable"
      },
      {
        label: "Uptime",
        value: ro($)
      }
    ]
  }, {
    key: "ram",
    title: "RAM",
    subtitle: "System Memory",
    accent: m.purple,
    utilizationPercent: y,
    series: x,
    detailRows: [
      {
        label: "Used",
        value: nr(v)
      },
      {
        label: "Total",
        value: nr(u)
      },
      {
        label: "Usage",
        value: `${y.toFixed(y >= 10 ? 1 : 2)}%`
      },
      {
        label: "Swap Used",
        value: `${F.toFixed(F >= 10 ? 1 : 2)}%`
      }
    ]
  }];
  return s !== void 0 && he.push({
    key: "gpu",
    title: "GPU",
    subtitle: "Integrated Graphics",
    accent: m.green,
    utilizationPercent: s,
    series: a,
    detailRows: [
      {
        label: "Current",
        value: o ? `${Math.round(o)} MHz` : "Unavailable"
      },
      {
        label: "Max",
        value: i ? `${Math.round(i)} MHz` : "Unavailable"
      },
      {
        label: "Temperature",
        value: c !== void 0 ? `${Math.round(c)}°C` : "Unavailable"
      },
      {
        label: "Source",
        value: "UGOS Bridge MQTT"
      }
    ]
  }), he;
}, In = (e, t, r, n) => {
  const s = ve(e, t, n, "size"), o = w(e, s), i = w(e, ve(e, t, n, "temperature")), a = w(e, ve(e, t, n, "read")), c = w(e, ve(e, t, n, "write")), l = w(e, ve(e, t, n, "busy")), d = nt(e, Yt(e, t, n, "model")), u = Ds(nt(e, Yt(e, t, n, "type")));
  if (o === void 0 && i === void 0 && a === void 0 && c === void 0 && l === void 0 && d === void 0 && u === void 0) return null;
  const v = js(d), y = b(e[s ?? ""], "name"), x = K(e[s ?? ""], "Size", r) ?? y ?? ue(n);
  return {
    name: u === "hdd" ? `${v ?? x} ${(y ?? n).toUpperCase()}` : v ?? x,
    model: u ? u.toUpperCase() : i !== void 0 ? "Physical Disk" : "Disk",
    capacityBytes: o ?? 0,
    temperatureCelsius: i,
    readBytesPerSecond: a,
    writeBytesPerSecond: c,
    busyPercent: l,
    status: ws(i),
    mediaType: u,
    diskSlug: n,
    deviceName: y,
    deviceModel: v ?? void 0
  };
}, En = (e, t, r) => {
  if (e.length === 0) return t.map((s, o) => ({
    key: s.slug,
    name: tr(st(s.slug)),
    layout: s.readOnly ? "Filesystem | Read-only" : "Filesystem",
    status: s.readOnly ? "warning" : "healthy",
    usedBytes: s.usedBytes,
    totalBytes: s.totalBytes,
    accent: Ae[o % Ae.length]
  }));
  const n = [...t];
  return e.map((s, o) => {
    const i = n.findIndex((y) => Math.abs(y.totalBytes - s.sizeBytes) / Math.max(s.sizeBytes, 1) < 0.05), a = i >= 0 ? n.splice(i, 1)[0] : void 0, c = Ss(s, r), l = a ? tr(st(a.slug)) : void 0, d = Os(s.level), u = On(s.members, r), v = u.length === 0 && e.length === 1 ? r.map((y) => y.diskSlug).filter((y) => !!y) : u;
    return {
      key: s.slug,
      name: c ?? l ?? s.name,
      layout: [d, l].filter(Boolean).join(" | ") || `${s.slug.toUpperCase()} Array`,
      driveCountText: Ws(s.activeDisks, s.totalDisks),
      status: s.degradedDisks > 0 ? "degraded" : a?.readOnly ? "warning" : "healthy",
      usedBytes: a?.usedBytes ?? 0,
      totalBytes: a?.totalBytes ?? s.sizeBytes,
      accent: Ae[o % Ae.length],
      driveSlugs: v
    };
  });
}, An = (e, t) => {
  const r = fs(e, t), n = Ue(e, t, "cpu"), s = e[r ?? ""], o = _(s, "cpu_usage_percent") ?? w(e, n), i = _(s, "memory_usage_bytes") ?? w(e, Ue(e, t, "memory")), a = _(s, "total_containers") ?? w(e, Ue(e, t, "total")), c = _(s, "running_containers") ?? w(e, Ue(e, t, "running"));
  if (o === void 0 || i === void 0 || a === void 0 || c === void 0) return null;
  const l = Un(t, Tn(e, t, r ?? n)), d = zn(t, i, l);
  return {
    key: t,
    title: Fs(b(s, "project") ?? K(s, "CPU", "") ?? K(e[n ?? ""], "CPU", "") ?? t.split("_").filter(Boolean).map(vt).join(" ")),
    cpuPercent: o,
    memoryBytes: d,
    runningContainers: Math.round(c),
    totalContainers: Math.round(a),
    status: c <= 0 ? "down" : c < a ? "partial" : "up",
    containers: l
  };
}, Un = (e, t) => e !== "virtual_machines" ? t : t.map((r) => r.running ? r : {
  ...r,
  memoryBytes: 0
}), zn = (e, t, r) => e !== "virtual_machines" || r.length === 0 ? t : r.reduce((n, s) => n + (s.running ? s.memoryBytes : 0), 0), Tn = (e, t, r) => {
  const n = L(e[r ?? ""], "containers");
  if (n.length > 0) return n.map((o, i) => Ln(o, t, i)).filter((o) => o !== null).sort((o, i) => Number(i.running) - Number(o.running) || i.cpuPercent - o.cpuPercent || i.memoryBytes - o.memoryBytes || o.name.localeCompare(i.name));
  const s = /* @__PURE__ */ new Map();
  for (const [o, i] of C(e)) {
    const a = Bn.exec(o) ?? kn.exec(o), c = a?.[2], l = b(i, "container"), d = Ce(b(i, "project")), u = b(i, "image"), v = b(i, "status"), y = b(i, "state"), x = kr(i, "running");
    if (!(l || u !== void 0 || v !== void 0 || y !== void 0 || x !== void 0 || _(i, "memory_current_bytes") !== void 0 || _(i, "memory_limit_bytes") !== void 0 || a !== null)) continue;
    const F = B(l ?? b(i, "container_id") ?? a?.[1] ?? o), $ = s.get(F) ?? { key: F };
    $.projectSlug = $.projectSlug ?? d ?? Ys(F, i, t), $.name = $.name ?? l ?? K(i, "", "") ?? ue(F), $.image = $.image ?? u ?? "Unknown", $.status = $.status ?? v ?? "Unavailable", $.state = $.state ?? y ?? (c === "running" ? Js(i) : void 0), $.memoryCurrentBytes = $.memoryCurrentBytes ?? _(i, "memory_current_bytes"), $.memoryLimitBytes = $.memoryLimitBytes ?? _(i, "memory_limit_bytes"), $.cpuPercent = _(i, "cpu_usage_percent") ?? (c === "cpu_usage_percent" ? q(i.state) : void 0) ?? $.cpuPercent ?? 0, $.memoryBytes = _(i, "memory_usage_bytes") ?? (c === "memory_usage_bytes" ? q(i.state) : void 0) ?? $.memoryBytes ?? 0, $.running = x ?? (c === "running" ? Zs(i, $.state) : void 0) ?? $.running, s.set(F, $);
  }
  return Array.from(s.values()).filter((o) => o.projectSlug === t || Qs(o, t)).map((o) => ({
    key: o.key,
    name: o.name ?? ue(o.key),
    image: o.image ?? "Unknown",
    status: o.status ?? "Unavailable",
    state: o.state ?? "unknown",
    running: o.running ?? !1,
    cpuPercent: o.cpuPercent ?? 0,
    memoryBytes: o.memoryBytes ?? 0,
    memoryCurrentBytes: o.memoryCurrentBytes,
    memoryLimitBytes: o.memoryLimitBytes
  })).sort((o, i) => Number(i.running) - Number(o.running) || i.cpuPercent - o.cpuPercent || i.memoryBytes - o.memoryBytes || o.name.localeCompare(i.name));
}, Ln = (e, t, r) => {
  const n = Ce(U(e, [
    "project_slug",
    "project",
    "ProjectSlug",
    "Project"
  ]));
  if (n !== void 0 && n !== t) return null;
  const s = U(e, [
    "name",
    "container",
    "Name",
    "Container"
  ]), o = U(e, [
    "container_slug",
    "key",
    "ContainerSlug",
    "Key"
  ]) ?? B(s ?? U(e, ["container_id", "ContainerID"]) ?? `container_${r}`);
  return {
    key: o,
    name: s ?? ue(o),
    image: U(e, ["image", "Image"]) ?? "Unknown",
    status: U(e, ["status", "Status"]) ?? "Unavailable",
    state: U(e, ["state", "State"]) ?? "unknown",
    running: Ls(e, ["running", "Running"]) ?? U(e, ["state", "State"])?.toLowerCase() === "running",
    cpuPercent: H(e, [
      "cpu_usage_percent",
      "cpuPercent",
      "CPUUsagePercent",
      "CPUPercent"
    ]) ?? 0,
    memoryBytes: H(e, [
      "memory_usage_bytes",
      "memoryBytes",
      "MemoryUsageBytes",
      "MemoryBytes"
    ]) ?? 0,
    memoryCurrentBytes: H(e, [
      "memory_current_bytes",
      "memoryCurrentBytes",
      "MemoryCurrentBytes"
    ]),
    memoryLimitBytes: H(e, [
      "memory_limit_bytes",
      "memoryLimitBytes",
      "MemoryLimitBytes"
    ])
  };
}, Rn = (e, t) => {
  const r = [];
  return L(e[t ?? ""], "cpu_cores").forEach((n, s) => {
    const o = U(n, ["name"]) ?? `cpu${s}`, i = H(n, ["usage_percent", "UsagePercent"]);
    i !== void 0 && r.push({
      key: B(o) || `cpu_${s}`,
      name: qs(o),
      usagePercent: i,
      currentMHz: H(n, ["current_mhz", "CurrentMHz"]),
      minMHz: H(n, ["min_mhz", "MinMHz"]),
      maxMHz: H(n, ["max_mhz", "MaxMHz"]),
      governor: U(n, ["governor", "Governor"])
    });
  }), r.sort(Vs);
}, Nn = (e, t, r, n) => {
  const s = e[t ?? ""], o = _(s, "memory_total_bytes") ?? r, i = _(s, "memory_used_bytes") ?? n, a = _(s, "memory_buffers_bytes"), c = _(s, "memory_cached_bytes"), l = _(s, "swap_used_bytes"), d = _(s, "swap_total_bytes");
  return [
    {
      key: "total",
      label: "Total",
      valueBytes: o
    },
    {
      key: "used",
      label: "Used",
      valueBytes: i,
      totalBytes: o
    },
    ...a !== void 0 ? [{
      key: "buffers",
      label: "Buffers",
      valueBytes: a,
      totalBytes: o
    }] : [],
    ...c !== void 0 ? [{
      key: "cached",
      label: "Cached",
      valueBytes: c,
      totalBytes: o
    }] : [],
    ...l !== void 0 ? [{
      key: "swap_used",
      label: "Swap Used",
      valueBytes: l,
      totalBytes: d
    }] : [],
    ...d !== void 0 ? [{
      key: "swap_total",
      label: "Swap Total",
      valueBytes: d
    }] : []
  ];
}, Hn = (e, t) => {
  const r = /* @__PURE__ */ new Map();
  for (const n of t) L(e[n], "engines").forEach((s, o) => {
    const i = U(s, ["name", "Name"]), a = H(s, ["busy_percent", "BusyPercent"]);
    if (!i || a === void 0) return;
    const c = B(i) || `engine_${o}`, l = {
      key: c,
      label: Ks(i),
      busyPercent: a,
      semaPercent: H(s, ["sema_percent", "SemaPercent"]),
      waitPercent: H(s, ["wait_percent", "WaitPercent"])
    }, d = r.get(c);
    (!d || l.busyPercent > d.busyPercent) && r.set(c, l);
  });
  return Array.from(r.values()).sort((n, s) => s.busyPercent - n.busyPercent || n.label.localeCompare(s.label));
}, jn = (e, t) => {
  const r = /* @__PURE__ */ new Map();
  for (const n of t) L(e[n], "stats").forEach((s, o) => {
    const i = H(s, ["value", "Value"]);
    if (i === void 0) return;
    const a = U(s, ["key", "Key"]) ?? `stat_${o}`;
    r.set(a, {
      key: a,
      label: U(s, ["label", "Label"]) ?? Xs(a),
      value: i,
      unit: U(s, ["unit", "Unit"])
    });
  });
  return Array.from(r.values());
}, Dn = (e) => {
  const t = /* @__PURE__ */ new Map();
  for (const [r, n] of C(e)) {
    const s = xn.exec(r), o = s?.[2], i = q(n.state), a = b(n, "name"), c = _(n, "process_count"), l = _(n, "cpu_time_seconds"), d = _(n, "cpu_usage_percent"), u = _(n, "memory_usage_bytes");
    if (!(c !== void 0 || l !== void 0 || a !== void 0 && We(n).includes("process") && d !== void 0 && u !== void 0 || s !== null)) continue;
    const v = B(a ?? s?.[1] ?? r), y = t.get(v) ?? {
      key: v,
      name: a ?? K(n, "", "") ?? ue(s?.[1] ?? v),
      processCount: 0,
      cpuPercent: 0,
      memoryBytes: 0
    };
    y.name = a ?? y.name, y.processCount = Math.round(c ?? (o === "process_count" ? i : void 0) ?? y.processCount), y.cpuPercent = d ?? (o === "cpu_usage_percent" ? i : void 0) ?? y.cpuPercent, y.memoryBytes = u ?? (o === "memory_usage_bytes" ? i : void 0) ?? y.memoryBytes, y.cpuTimeSeconds = l ?? (o === "cpu_time_seconds" ? i : void 0) ?? y.cpuTimeSeconds, t.set(v, y);
  }
  return Array.from(t.values()).sort((r, n) => n.cpuPercent - r.cpuPercent || n.memoryBytes - r.memoryBytes || n.processCount - r.processCount || r.name.localeCompare(n.name)).slice(0, 10);
}, On = (e, t) => {
  if (e.length === 0) return [];
  const r = /* @__PURE__ */ new Map();
  return t.filter((n) => !!n.diskSlug).forEach((n) => {
    const s = n.diskSlug;
    for (const o of [s, n.deviceName ?? ""].flatMap(rr)) r.set(o, s);
  }), Array.from(new Set(e.flatMap((n) => rr(n)).map((n) => r.get(n)).filter((n) => !!n)));
}, Sn = (e, t, r, n) => {
  const s = ne(e, t, r, "rx"), o = ne(e, t, r, "tx"), i = w(e, s), a = w(e, o), c = w(e, ne(e, t, r, "speed")), l = ms(e, t, r);
  return i === void 0 && a === void 0 && c === void 0 && !l ? null : {
    name: bt(r),
    status: ht(e[l ?? ""]) ? "up" : "down",
    linkSpeedMbps: c ?? void 0,
    temperatureCelsius: Br(n, r),
    downloadBps: (i ?? 0) * 8,
    uploadBps: (a ?? 0) * 8
  };
}, Wn = (e, t, r, n) => {
  const s = w(e, _s(e, t, r, "speed")), o = ys(e, t, r), i = wr(e, t, r);
  return s === void 0 && !o ? null : {
    name: bt(r),
    status: ht(e[o ?? ""]) ? "up" : "down",
    linkSpeedMbps: s ?? void 0,
    temperatureCelsius: Br(n, r),
    downloadBps: i / 2,
    uploadBps: i / 2
  };
}, Fn = (e, t) => ts(e, t).map((r) => {
  const n = Qt(e, t, r, "used"), s = Qt(e, t, r, "free"), o = w(e, n), i = w(e, s);
  return o === void 0 || i === void 0 ? null : {
    slug: r,
    name: K(e[n ?? ""], "Used", "") ?? st(r),
    usedBytes: o,
    freeBytes: i,
    totalBytes: o + i,
    readOnly: ht(e[us(e, t, r) ?? ""])
  };
}).filter((r) => r !== null).sort((r, n) => r.name.localeCompare(n.name)), Gn = (e, t) => {
  const r = cs(e, t), n = [];
  for (const s of r) {
    const o = J(e, t, s, "size"), i = w(e, o), a = w(e, J(e, t, s, "degraded")) ?? 0, c = w(e, J(e, t, s, "active")), l = w(e, J(e, t, s, "total")), d = w(e, J(e, t, s, "sync")), u = ps(e, t, s, "level"), v = nt(e, u);
    if (i === void 0 && c === void 0 && l === void 0 && d === void 0 && v === void 0) continue;
    const y = Ts([
      e[o ?? ""],
      e[u ?? ""],
      e[J(e, t, s, "active") ?? ""],
      e[J(e, t, s, "total") ?? ""],
      e[J(e, t, s, "degraded") ?? ""]
    ], "members");
    n.push({
      slug: s,
      name: K(e[o ?? ""], "Size", "") ?? K(e[u ?? ""], "Level", "") ?? s.toUpperCase(),
      sizeBytes: i ?? 0,
      degradedDisks: Math.round(a),
      activeDisks: c !== void 0 ? Math.round(c) : void 0,
      totalDisks: l !== void 0 ? Math.round(l) : void 0,
      syncPercent: d,
      level: v,
      members: y
    });
  }
  return n.sort((s, o) => s.name.localeCompare(o.name));
}, $r = (e, t) => A(e, `hostRootEntries:${t}`, () => C(e).filter(([r]) => Us(r, t))), qn = (e, t) => A(e, `temperatures:${t}`, () => {
  const r = [
    `sensor.ugos_bridge_host_${t}_`,
    `sensor.${t}_`,
    "sensor.ugos_bridge_disk_",
    "sensor.ugos_bridge_gpu_"
  ];
  return C(e).filter(([n, s]) => n.startsWith("sensor.") && r.some((o) => n.startsWith(o)) && (n.endsWith("_temperature_celsius") || X(s, ["temperature"]))).map(([n, s]) => {
    const o = q(s.state);
    return o === void 0 ? null : {
      entityId: n,
      label: `${_e(s)} ${n}`.trim().toLowerCase(),
      value: o
    };
  }).filter((n) => n !== null);
}), Vn = (e, t) => A(e, `hostSlug:${t ?? ""}`, () => {
  if (t) {
    const s = Jt(t);
    if (Cs(e, s) || Ms(e, s)) return s;
  }
  const r = Is(e);
  if (r.length === 0) return null;
  if (!t) return r[0];
  const n = Jt(t);
  return r.find((s) => s === n) ?? r[0];
}), Jt = (e) => {
  let t = B(e);
  for (const r of ["sensor_", "binary_sensor_"]) if (t.startsWith(r)) {
    t = t.slice(r.length);
    break;
  }
  t.startsWith("ugos_bridge_host_") && (t = t.slice(17));
  for (const r of [
    "_cpu_usage_percent",
    "_cpu_frequency_mhz",
    "_load_1",
    "_memory_used_bytes",
    "_memory_used_percent",
    "_swap_used_percent",
    "_uptime_seconds"
  ]) if (t.endsWith(r)) return t.slice(0, -r.length);
  return t;
}, Kn = (e, t, r) => K(e[Y(e, t, "cpu") ?? ""], "CPU", "") ?? r?.trim() ?? ue(t), Xn = (e, t) => {
  if (t?.ipEntity) {
    const r = e[t.ipEntity]?.state;
    if (r && r !== "unknown" && r !== "unavailable") return r;
  }
  return t?.ipAddress?.trim() || "Unavailable";
}, Jn = (e, t, r) => r && r > 0 ? r : t > 0 ? Math.max(e, Math.round(e / (t / 100))) : e, Zn = (e, t) => {
  if (t && t.length > 0) {
    const n = e.filter((s) => vs(s.slug, s.name, t));
    if (n.length > 0) return n;
  }
  const r = e.filter((n) => n.name !== "/");
  return r.length > 0 ? r : e;
}, Yn = (e, t) => {
  if (!t || t.length === 0) return e.filter((s) => s !== "lo");
  const r = t.map((s) => B(s)), n = e.filter((s) => r.includes(B(s)));
  return n.length > 0 ? n : e;
}, Qn = (e) => A(e, "projectSlugs", () => {
  const t = R(e).map((s) => vn.exec(s)?.[1]).filter((s) => !!s), r = xe(e, "sensor.compose_project_").map(([, s]) => xr(s)).filter((s) => !!s), n = C(e).filter(([s, o]) => s.startsWith("sensor.") && (_(o, "total_containers") !== void 0 || _(o, "running_containers") !== void 0 || L(o, "containers").length > 0)).map(([, s]) => Ce(b(s, "project_slug") ?? b(s, "project"))).filter((s) => !!s);
  return Array.from(/* @__PURE__ */ new Set([
    ...t,
    ...r,
    ...n
  ])).sort();
}), es = (e, t, r) => A(e, `diskSlugs:${t}:${r}`, () => {
  const n = me(e, t, r, "disk", Je), s = [
    ...I(e, new RegExp(`^sensor\\.${P(r)}_disk_(.+?)_size_bytes$`)),
    ...I(e, /^sensor\.ugos_bridge_disk_(.+?)_size_bytes$/),
    ...I(e, new RegExp(`^sensor\\.${P(r)}_disk_(.+?)_(?:size_bytes|read_bytes_per_second|write_bytes_per_second|busy_percent|model|vendor|serial|media_type)(?:_\\d+)?$`))
  ], o = Array.from(/* @__PURE__ */ new Set([...n, ...s])).sort();
  if (o.length > 0) return o;
  const i = R(e).map((l) => l.match(new RegExp(`^sensor\\.${P(t)}_disk_([^_]+)_`))?.[1]).filter((l) => !!l), a = S(e).map((l) => Se(l, t, [
    "Size",
    "Busy",
    "Read Throughput",
    "Write Throughput"
  ])).filter((l) => l !== void 0 && Je(l)), c = S(e).filter((l) => _(l, "size_bytes") !== void 0 || _(l, "read_bytes_per_second") !== void 0 || _(l, "write_bytes_per_second") !== void 0).map((l) => B(b(l, "name") ?? "")).filter((l) => Je(l));
  return Array.from(/* @__PURE__ */ new Set([
    ...n,
    ...s,
    ...i,
    ...a,
    ...c
  ])).sort();
}), ts = (e, t) => A(e, `filesystemSlugs:${t}`, () => {
  const r = me(e, t, `ugos_bridge_host_${t}`, "filesystem", (a) => !!a), n = [
    ...I(e, new RegExp(`^sensor\\.ugos_bridge_host_${P(t)}_filesystem_(.+?)_used_bytes$`)),
    ...I(e, /^sensor\.ugos_bridge_filesystem_(.+?)_used_bytes$/),
    ...I(e, new RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_host_${P(t)}_filesystem_(.+?)_(?:used_bytes|free_bytes|used_percent|read_only)(?:_\\d+)?$`))
  ], s = R(e).map((a) => a.match(new RegExp(`^sensor\\.${P(t)}_filesystem_([^_]+)_`))?.[1]).filter((a) => !!a), o = S(e).map((a) => ft(a, t)).filter((a) => !!a), i = S(e).filter((a) => _(a, "used_bytes") !== void 0 || _(a, "free_bytes") !== void 0).map((a) => B(b(a, "name") ?? "")).filter((a) => !!a);
  return Array.from(/* @__PURE__ */ new Set([
    ...r,
    ...n,
    ...s,
    ...o,
    ...i
  ])).sort();
}), rs = (e, t, r) => A(e, `networkSlugs:${t}:${r}`, () => {
  const n = me(e, t, r, "network", Qe), s = [
    ...I(e, new RegExp(`^sensor\\.${P(r)}_network_(.+?)_rx_bytes_per_second$`)),
    ...I(e, /^sensor\.ugos_bridge_network_(.+?)_rx_bytes_per_second$/),
    ...I(e, new RegExp(`^(?:sensor|binary_sensor)\\.${P(r)}_network_(.+?)_(?:rx_bytes_per_second|tx_bytes_per_second|speed_mbps|carrier)(?:_\\d+)?$`))
  ], o = R(e).map((c) => c.match(new RegExp(`^sensor\\.${P(t)}_network_([^_]+)_`))?.[1]).filter((c) => !!c), i = S(e).map((c) => Se(c, t, [
    "RX Throughput",
    "TX Throughput",
    "Link Speed",
    "Carrier"
  ])).filter((c) => c !== void 0 && Qe(c)), a = S(e).filter((c) => _(c, "rx_bytes_per_second") !== void 0 || _(c, "tx_bytes_per_second") !== void 0 || _(c, "speed_mbps") !== void 0).map((c) => B(b(c, "name") ?? "")).filter((c) => Qe(c));
  return Array.from(/* @__PURE__ */ new Set([
    ...n,
    ...s,
    ...o,
    ...i,
    ...a
  ])).sort();
}), ns = (e, t, r) => A(e, `bondSlugs:${t}:${r}`, () => {
  const n = me(e, t, r, "bond", Ye), s = [
    ...I(e, new RegExp(`^sensor\\.${P(r)}_bond_(.+?)_speed_mbps$`)),
    ...I(e, /^sensor\.ugos_bridge_bond_(.+?)_speed_mbps$/),
    ...I(e, new RegExp(`^(?:sensor|binary_sensor)\\.${P(r)}_bond_(.+?)_(?:speed_mbps|mode|active_slave|mii_status|slave_count|carrier)(?:_\\d+)?$`))
  ], o = R(e).map((c) => c.match(new RegExp(`^sensor\\.${P(t)}_bond_([^_]+)_`))?.[1]).filter((c) => !!c), i = S(e).map((c) => Se(c, t, [
    "Link Speed",
    "Mode",
    "Active Slave",
    "MII Status",
    "Slave Count",
    "Carrier"
  ])).filter((c) => c !== void 0 && Ye(c)), a = S(e).filter((c) => b(c, "mode") !== void 0 || b(c, "active_slave") !== void 0 || _(c, "speed_mbps") !== void 0).map((c) => B(b(c, "name") ?? "")).filter((c) => Ye(c));
  return Array.from(/* @__PURE__ */ new Set([
    ...n,
    ...s,
    ...o,
    ...i,
    ...a
  ])).sort();
}), ss = (e, t) => {
  if (t && t.length > 0) return e;
  const r = e.filter((n) => /^(bond\d+|eth\d+)$/i.test(n));
  return r.length > 0 ? r : e;
}, os = (e) => [...e].filter((t) => /^(bond\d+|eth\d+)$/i.test(t)).sort((t, r) => Zt(t) - Zt(r) || t.localeCompare(r)).slice(0, 3), Zt = (e) => {
  const t = e.toLowerCase();
  return t.startsWith("bond") ? 0 : t.startsWith("eth") ? 1 : 2;
}, wr = (e, t, r) => {
  const n = w(e, ne(e, t, r, "rx")), s = w(e, ne(e, t, r, "tx"));
  return ((n ?? 0) + (s ?? 0)) * 8;
}, is = (e, t) => {
  const r = e.toLowerCase();
  return r.startsWith("bond") ? m.cyan : r === "eth0" ? m.good : r === "eth1" ? m.purple : [
    m.softBlue,
    m.green,
    m.blue
  ][t % 3];
}, as = (e, t, r) => A(e, `gpuSlugs:${t}:${r}`, () => {
  const n = me(e, t, r, "gpu", (a) => !!a), s = [...I(e, new RegExp(`^sensor\\.${P(r)}_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\\d+)?$`)), ...I(e, /^sensor\.ugos_bridge_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\d+)?$/)], o = R(e).map((a) => a.match(new RegExp(`^sensor\\.${P(t)}_gpu_([^_]+)_`))?.[1]).filter((a) => !!a), i = S(e).filter((a) => L(a, "engines").length > 0 || L(a, "stats").length > 0 || _(a, "busy_percent") !== void 0 || _(a, "current_mhz") !== void 0).map((a) => B(b(a, "name") ?? "")).filter((a) => !!a);
  return Array.from(/* @__PURE__ */ new Set([
    ...n,
    ...s,
    ...o,
    ...i
  ])).sort();
}), cs = (e, t) => A(e, `arraySlugs:${t}`, () => {
  const r = me(e, t, `ugos_bridge_host_${t}`, "array", Ze), n = [
    ...I(e, new RegExp(`^sensor\\.ugos_bridge_host_${P(t)}_array_(.+?)_size_bytes$`)),
    ...I(e, /^sensor\.ugos_bridge_array_(.+?)_size_bytes$/),
    ...I(e, new RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_host_${P(t)}_array_(.+?)_(?:size_bytes|degraded_disks|active_disks|total_disks|sync_completed_percent|level|degraded)(?:_\\d+)?$`))
  ], s = R(e).map((a) => a.match(new RegExp(`^sensor\\.${P(t)}_array_([^_]+)_`))?.[1]).filter((a) => !!a), o = S(e).map((a) => Se(a, t, [
    "Size",
    "Degraded Disks",
    "Sync Progress"
  ])).filter((a) => a !== void 0 && Ze(a)), i = S(e).filter((a) => _(a, "size_bytes") !== void 0 || b(a, "level") !== void 0 || _(a, "degraded_disks") !== void 0).map((a) => B(b(a, "name") ?? "")).filter((a) => Ze(a));
  return Array.from(/* @__PURE__ */ new Set([
    ...r,
    ...n,
    ...s,
    ...o,
    ...i
  ])).sort();
}), Y = (e, t, r) => z(e, `hostMetric:${t}:${r}`, () => {
  const n = {
    cpu: `sensor.ugos_bridge_host_${t}_cpu_usage_percent`,
    load1: `sensor.ugos_bridge_host_${t}_load_1`,
    cpufreq: `sensor.ugos_bridge_host_${t}_cpu_frequency_mhz`,
    memoryUsedBytes: `sensor.ugos_bridge_host_${t}_memory_used_bytes`,
    memoryUsedPercent: `sensor.ugos_bridge_host_${t}_memory_used_percent`,
    swapUsedPercent: `sensor.ugos_bridge_host_${t}_swap_used_percent`,
    uptime: `sensor.ugos_bridge_host_${t}_uptime_seconds`
  };
  if (e[n[r]]) return n[r];
  const s = $r(e, t);
  switch (r) {
    case "cpu":
      return O(s, {
        entityIncludes: ["_cpu"],
        friendlyIncludes: ["cpu"],
        unit: "%"
      });
    case "load1":
      return O(s, {
        entityIncludes: ["load"],
        friendlyIncludes: ["load", "1"],
        unit: void 0
      });
    case "cpufreq":
      return O(s, {
        entityIncludes: ["frequency"],
        friendlyIncludes: ["frequency"],
        unit: "MHz"
      });
    case "memoryUsedBytes":
      return O(s, {
        entityIncludes: ["memory"],
        friendlyIncludes: ["memory", "used"],
        unit: "B"
      });
    case "memoryUsedPercent":
      return O(s, {
        entityIncludes: ["memory"],
        friendlyIncludes: ["memory", "used"],
        unit: "%"
      });
    case "swapUsedPercent":
      return O(s, {
        entityIncludes: ["swap"],
        friendlyIncludes: ["swap", "used"],
        unit: "%"
      });
    case "uptime":
      return O(s, {
        entityIncludes: ["uptime"],
        friendlyIncludes: ["uptime"],
        unit: "s"
      });
  }
}), ee = (e, t, r) => {
  const n = Y(e, t, r), s = Pn[r], o = [
    n ? e[n] : void 0,
    e[Y(e, t, "cpu") ?? ""],
    e[Y(e, t, "memoryUsedBytes") ?? ""]
  ];
  for (const a of o) {
    const c = _(a, s);
    if (Xe(e, t, r, c)) return c;
  }
  for (const [, a] of $r(e, t)) {
    const c = _(a, s);
    if (Xe(e, t, r, c)) return c;
  }
  const i = w(e, n);
  return Xe(e, t, r, i) ? i : void 0;
}, ls = (e, t) => {
  const r = Y(e, t, "load1"), n = e[r ?? ""], s = ee(e, t, "load1") ?? 0, o = gt(n) === "%" || ds(r, n), i = o ? s : s * 100;
  return {
    value: s,
    valuePercent: xs(i),
    valueText: o ? Ps(s) : s.toFixed(2),
    unit: o ? "percent" : "load",
    statusText: o ? ks(i) : Bs(s)
  };
}, ds = (e, t) => {
  const r = e?.toLowerCase() ?? "", n = We(t);
  return r.endsWith("_load_1") || r.includes("_load_1m") || n.includes("load 1m") || n.includes("load (1m)");
}, Xe = (e, t, r, n) => {
  if (n === void 0 || !Number.isFinite(n) || n < 0) return !1;
  if (r !== "load1") return !0;
  const s = e[Y(e, t, "cpu") ?? ""], o = L(s, "cpu_cores").length;
  return n <= Math.max(o * 64, 1024);
}, ve = (e, t, r, n) => z(e, `diskMetric:${t}:${r}:${n}`, () => {
  const s = W(e, {
    size: [`sensor.ugos_bridge_host_${t}_disk_${r}_size_bytes`, `sensor.ugos_bridge_disk_${r}_size_bytes`],
    temperature: [`sensor.ugos_bridge_host_${t}_disk_${r}_temperature_celsius`, `sensor.ugos_bridge_disk_${r}_temperature_celsius`],
    read: [`sensor.ugos_bridge_host_${t}_disk_${r}_read_bytes_per_second`, `sensor.ugos_bridge_disk_${r}_read_bytes_per_second`],
    write: [`sensor.ugos_bridge_host_${t}_disk_${r}_write_bytes_per_second`, `sensor.ugos_bridge_disk_${r}_write_bytes_per_second`],
    busy: [`sensor.ugos_bridge_host_${t}_disk_${r}_busy_percent`, `sensor.ugos_bridge_disk_${r}_busy_percent`]
  }[n]);
  if (s) return s;
  const o = j(e, [
    `sensor.ugos_bridge_host_${t}_disk_${r}_`,
    `sensor.${t}_disk_${r}_`,
    `sensor.ugos_bridge_disk_${r}_`
  ]), i = n === "size" ? {
    entityIncludes: ["size"],
    friendlyIncludes: ["size"],
    unit: "B"
  } : n === "temperature" ? {
    entityIncludes: ["temperature"],
    friendlyIncludes: ["temperature"],
    unit: "°C"
  } : n === "busy" ? {
    entityIncludes: ["busy"],
    friendlyIncludes: ["busy"],
    unit: "%"
  } : {
    entityIncludes: [n === "read" ? "read" : "write"],
    friendlyIncludes: [n === "read" ? "read" : "write", "throughput"],
    unit: "B/s"
  };
  if (o.length > 0) return f(o, i);
  const a = D(e, "disk", r);
  return a.length > 0 ? f(a, i) : f(C(e).filter(([, c]) => X(c, [r])), {
    ...i,
    entityIncludes: [],
    friendlyIncludes: [r, ...i.friendlyIncludes]
  });
}), Yt = (e, t, r, n) => z(e, `diskTextMetric:${t}:${r}:${n}`, () => {
  const s = W(e, {
    model: [`sensor.ugos_bridge_host_${t}_disk_${r}_model`, `sensor.ugos_bridge_disk_${r}_model`],
    vendor: [`sensor.ugos_bridge_host_${t}_disk_${r}_vendor`, `sensor.ugos_bridge_disk_${r}_vendor`],
    serial: [`sensor.ugos_bridge_host_${t}_disk_${r}_serial`, `sensor.ugos_bridge_disk_${r}_serial`],
    type: [`sensor.ugos_bridge_host_${t}_disk_${r}_media_type`, `sensor.ugos_bridge_disk_${r}_media_type`]
  }[n]);
  if (s) return s;
  const o = [
    `sensor.ugos_bridge_host_${t}_disk_${r}_`,
    `sensor.${t}_disk_${r}_`,
    `sensor.ugos_bridge_disk_${r}_`
  ], i = n === "type" ? {
    entityIncludes: ["media"],
    friendlyIncludes: ["media"]
  } : {
    entityIncludes: [n],
    friendlyIncludes: [n]
  }, a = j(e, o);
  if (a.length > 0) return f(a, i);
  const c = D(e, "disk", r);
  return c.length > 0 ? f(c, i) : f(C(e).filter(([, l]) => X(l, [r])), {
    entityIncludes: [],
    friendlyIncludes: [r, ...i.friendlyIncludes]
  });
}), Qt = (e, t, r, n) => z(e, `filesystemMetric:${t}:${r}:${n}`, () => {
  const s = W(e, {
    used: [`sensor.ugos_bridge_host_${t}_filesystem_${r}_used_bytes`, `sensor.ugos_bridge_filesystem_${r}_used_bytes`],
    free: [`sensor.ugos_bridge_host_${t}_filesystem_${r}_free_bytes`, `sensor.ugos_bridge_filesystem_${r}_free_bytes`]
  }[n]);
  if (s) return s;
  const o = j(e, [
    `sensor.ugos_bridge_host_${t}_filesystem_${r}_`,
    `sensor.${t}_filesystem_${r}_`,
    `sensor.ugos_bridge_filesystem_${r}_`
  ]);
  if (o.length > 0) return f(o, {
    entityIncludes: [n],
    friendlyIncludes: [n],
    unit: "B"
  });
  const i = D(e, "filesystem", r);
  return i.length > 0 ? f(i, {
    entityIncludes: [n],
    friendlyIncludes: [n],
    unit: "B"
  }) : f(C(e).filter(([, a]) => ft(a, t) === r), {
    entityIncludes: [n],
    friendlyIncludes: [n],
    unit: "B"
  });
}), us = (e, t, r) => z(e, `filesystemReadonly:${t}:${r}`, () => {
  const n = W(e, [`binary_sensor.ugos_bridge_host_${t}_filesystem_${r}_read_only`, `binary_sensor.ugos_bridge_filesystem_${r}_read_only`]);
  if (n) return n;
  const s = j(e, [
    `binary_sensor.ugos_bridge_host_${t}_filesystem_${r}_`,
    `binary_sensor.${t}_filesystem_${r}_`,
    `binary_sensor.ugos_bridge_filesystem_${r}_`
  ]);
  if (s.length > 0) return f(s, {
    entityIncludes: ["read"],
    friendlyIncludes: ["read", "only"]
  });
  const o = D(e, "filesystem", r, "binary_sensor.");
  return o.length > 0 ? f(o, {
    entityIncludes: ["read"],
    friendlyIncludes: ["read", "only"]
  }) : f(C(e).filter(([, i]) => ft(i, t) === r), {
    entityIncludes: ["read"],
    friendlyIncludes: ["read", "only"]
  });
}), J = (e, t, r, n) => z(e, `arrayMetric:${t}:${r}:${n}`, () => {
  const s = W(e, {
    size: [`sensor.ugos_bridge_host_${t}_array_${r}_size_bytes`, `sensor.ugos_bridge_array_${r}_size_bytes`],
    degraded: [`sensor.ugos_bridge_host_${t}_array_${r}_degraded_disks`, `sensor.ugos_bridge_array_${r}_degraded_disks`],
    active: [`sensor.ugos_bridge_host_${t}_array_${r}_active_disks`, `sensor.ugos_bridge_array_${r}_active_disks`],
    total: [`sensor.ugos_bridge_host_${t}_array_${r}_total_disks`, `sensor.ugos_bridge_array_${r}_total_disks`],
    sync: [`sensor.ugos_bridge_host_${t}_array_${r}_sync_completed_percent`, `sensor.ugos_bridge_array_${r}_sync_completed_percent`]
  }[n]);
  if (s) return s;
  const o = [
    `sensor.ugos_bridge_host_${t}_array_${r}_`,
    `sensor.${t}_array_${r}_`,
    `sensor.ugos_bridge_array_${r}_`
  ], i = n === "size" ? {
    entityIncludes: ["size"],
    friendlyIncludes: ["size"],
    unit: "B"
  } : n === "degraded" ? {
    entityIncludes: ["degraded"],
    friendlyIncludes: ["degraded"]
  } : n === "active" ? {
    entityIncludes: ["active"],
    friendlyIncludes: ["active", "disks"]
  } : n === "total" ? {
    entityIncludes: ["total"],
    friendlyIncludes: ["total", "disks"]
  } : {
    entityIncludes: ["sync"],
    friendlyIncludes: ["sync"],
    unit: "%"
  }, a = j(e, o);
  if (a.length > 0) return f(a, i);
  const c = D(e, "array", r);
  return c.length > 0 ? f(c, i) : f(C(e).filter(([, l]) => X(l, [r])), {
    ...i,
    entityIncludes: [],
    friendlyIncludes: [r, ...i.friendlyIncludes]
  });
}), ps = (e, t, r, n) => z(e, `arrayTextMetric:${t}:${r}:${n}`, () => {
  const s = W(e, { level: [`sensor.ugos_bridge_host_${t}_array_${r}_level`, `sensor.ugos_bridge_array_${r}_level`] }[n]);
  if (s) return s;
  const o = j(e, [
    `sensor.ugos_bridge_host_${t}_array_${r}_`,
    `sensor.${t}_array_${r}_`,
    `sensor.ugos_bridge_array_${r}_`
  ]);
  if (o.length > 0) return f(o, {
    entityIncludes: ["level"],
    friendlyIncludes: ["level"]
  });
  const i = D(e, "array", r);
  return i.length > 0 ? f(i, {
    entityIncludes: ["level"],
    friendlyIncludes: ["level"]
  }) : f(C(e).filter(([, a]) => X(a, [r, "level"])), {
    entityIncludes: [],
    friendlyIncludes: [r, "level"]
  });
}), ne = (e, t, r, n) => z(e, `networkMetric:${t}:${r}:${n}`, () => {
  const s = W(e, {
    rx: [`sensor.ugos_bridge_host_${t}_network_${r}_rx_bytes_per_second`, `sensor.ugos_bridge_network_${r}_rx_bytes_per_second`],
    tx: [`sensor.ugos_bridge_host_${t}_network_${r}_tx_bytes_per_second`, `sensor.ugos_bridge_network_${r}_tx_bytes_per_second`],
    speed: [`sensor.ugos_bridge_host_${t}_network_${r}_speed_mbps`, `sensor.ugos_bridge_network_${r}_speed_mbps`]
  }[n]);
  if (s) return s;
  const o = [
    `sensor.ugos_bridge_host_${t}_network_${r}_`,
    `sensor.${t}_network_${r}_`,
    `sensor.ugos_bridge_network_${r}_`
  ], i = n === "speed" ? {
    entityIncludes: ["speed"],
    friendlyIncludes: ["link", "speed"],
    unit: "Mbit/s"
  } : {
    entityIncludes: [n],
    friendlyIncludes: [n === "rx" ? "rx" : "tx", "throughput"],
    unit: "B/s"
  }, a = j(e, o);
  if (a.length > 0) return f(a, i);
  const c = D(e, "network", r);
  return c.length > 0 ? f(c, i) : f(C(e).filter(([, l]) => X(l, [r])), {
    ...i,
    entityIncludes: [],
    friendlyIncludes: [r, ...i.friendlyIncludes]
  });
}), ms = (e, t, r) => z(e, `networkCarrier:${t}:${r}`, () => {
  const n = W(e, [`binary_sensor.ugos_bridge_host_${t}_network_${r}_carrier`, `binary_sensor.ugos_bridge_network_${r}_carrier`]);
  if (n) return n;
  const s = j(e, [
    `binary_sensor.ugos_bridge_host_${t}_network_${r}_`,
    `binary_sensor.${t}_network_${r}_`,
    `binary_sensor.ugos_bridge_network_${r}_`
  ]);
  if (s.length > 0) return f(s, {
    entityIncludes: ["carrier"],
    friendlyIncludes: ["carrier"]
  });
  const o = D(e, "network", r, "binary_sensor.");
  return o.length > 0 ? f(o, {
    entityIncludes: ["carrier"],
    friendlyIncludes: ["carrier"]
  }) : f(xe(e, "binary_sensor.").filter(([, i]) => X(i, [r, "carrier"])), {
    entityIncludes: [],
    friendlyIncludes: [r, "carrier"]
  });
}), _s = (e, t, r, n) => z(e, `bondMetric:${t}:${r}:${n}`, () => {
  const s = W(e, {
    speed: [`sensor.ugos_bridge_host_${t}_bond_${r}_speed_mbps`, `sensor.ugos_bridge_bond_${r}_speed_mbps`],
    mode: [`sensor.ugos_bridge_host_${t}_bond_${r}_mode`, `sensor.ugos_bridge_bond_${r}_mode`],
    active_slave: [`sensor.ugos_bridge_host_${t}_bond_${r}_active_slave`, `sensor.ugos_bridge_bond_${r}_active_slave`]
  }[n]);
  if (s) return s;
  const o = [
    `sensor.ugos_bridge_host_${t}_bond_${r}_`,
    `sensor.${t}_bond_${r}_`,
    `sensor.ugos_bridge_bond_${r}_`
  ], i = n === "speed" ? {
    entityIncludes: ["speed"],
    friendlyIncludes: ["link", "speed"],
    unit: "Mbit/s"
  } : n === "mode" ? {
    entityIncludes: ["mode"],
    friendlyIncludes: ["mode"]
  } : {
    entityIncludes: ["active"],
    friendlyIncludes: ["active", "slave"]
  }, a = j(e, o);
  if (a.length > 0) return f(a, i);
  const c = D(e, "bond", r);
  return c.length > 0 ? f(c, i) : f(C(e).filter(([, l]) => X(l, [r])), {
    ...i,
    entityIncludes: [],
    friendlyIncludes: [r, ...i.friendlyIncludes]
  });
}), ys = (e, t, r) => z(e, `bondCarrier:${t}:${r}`, () => {
  const n = W(e, [`binary_sensor.ugos_bridge_host_${t}_bond_${r}_carrier`, `binary_sensor.ugos_bridge_bond_${r}_carrier`]);
  if (n) return n;
  const s = j(e, [
    `binary_sensor.ugos_bridge_host_${t}_bond_${r}_`,
    `binary_sensor.${t}_bond_${r}_`,
    `binary_sensor.ugos_bridge_bond_${r}_`
  ]);
  if (s.length > 0) return f(s, {
    entityIncludes: ["carrier"],
    friendlyIncludes: ["carrier"]
  });
  const o = D(e, "bond", r, "binary_sensor.");
  return o.length > 0 ? f(o, {
    entityIncludes: ["carrier"],
    friendlyIncludes: ["carrier"]
  }) : f(xe(e, "binary_sensor.").filter(([, i]) => X(i, [r, "carrier"])), {
    entityIncludes: [],
    friendlyIncludes: [r, "carrier"]
  });
}), Re = (e, t, r, n, s) => z(e, `gpuMetric:${t}:${r}:${n}:${s}`, () => {
  const o = W(e, {
    busy: [`sensor.${r}_gpu_${n}_busy_percent`, `sensor.ugos_bridge_gpu_${n}_busy_percent`],
    current: [`sensor.${r}_gpu_${n}_current_mhz`, `sensor.ugos_bridge_gpu_${n}_current_mhz`],
    max: [`sensor.${r}_gpu_${n}_max_mhz`, `sensor.ugos_bridge_gpu_${n}_max_mhz`]
  }[s]);
  if (o) return o;
  const i = j(e, [
    `sensor.${r}_gpu_${n}_`,
    `sensor.${t}_gpu_${n}_`,
    `sensor.ugos_bridge_gpu_${n}_`
  ]), a = s === "busy" ? {
    entityIncludes: ["busy"],
    friendlyIncludes: ["busy"],
    unit: "%"
  } : {
    entityIncludes: [s],
    friendlyIncludes: [s, "frequency"],
    unit: "MHz"
  };
  return f(i, a) ?? f(D(e, "gpu", n), a);
}), hs = (e, t, r, n, s) => {
  const o = s.filter((a) => yt(e[a ?? ""])), i = gs(e, t, r, n).filter(([, a]) => L(a, "engines").length > 0 || L(a, "stats").length > 0).map(([a]) => a);
  return Array.from(/* @__PURE__ */ new Set([...o, ...i]));
}, gs = (e, t, r, n) => A(e, `gpuEntries:${t}:${r}:${n}`, () => {
  const s = j(e, [
    `sensor.${r}_gpu_${n}_`,
    `sensor.${t}_gpu_${n}_`,
    `sensor.ugos_bridge_gpu_${n}_`
  ]), o = D(e, "gpu", n), i = C(e).filter(([a, c]) => a.startsWith("sensor.") && B(b(c, "name") ?? "") === n && (L(c, "engines").length > 0 || L(c, "stats").length > 0 || _(c, "busy_percent") !== void 0 || _(c, "current_mhz") !== void 0 || _(c, "max_mhz") !== void 0));
  return Array.from(new Map([
    ...s,
    ...o,
    ...i
  ]).entries());
}), Ue = (e, t, r) => z(e, `projectMetric:${t}:${r}`, () => {
  const n = {
    cpu: `sensor.ugos_bridge_project_${t}_cpu_usage_percent`,
    memory: `sensor.ugos_bridge_project_${t}_memory_usage_bytes`,
    total: `sensor.ugos_bridge_project_${t}_total_containers`,
    running: `sensor.ugos_bridge_project_${t}_running_containers`
  };
  if (e[n[r]]) return n[r];
  const s = xe(e, `sensor.compose_project_${t}_`), o = r === "cpu" ? {
    entityIncludes: ["cpu"],
    friendlyIncludes: ["cpu"],
    unit: "%"
  } : r === "memory" ? {
    entityIncludes: ["memory"],
    friendlyIncludes: ["memory"],
    unit: "B"
  } : r === "total" ? {
    entityIncludes: ["total"],
    friendlyIncludes: ["total", "containers"]
  } : {
    entityIncludes: ["running"],
    friendlyIncludes: ["running", "containers"]
  };
  return s.length > 0 ? O(s, o) : O(C(e).filter(([, i]) => xr(i) === t), o);
}), fs = (e, t) => z(e, `projectPayload:${t}`, () => {
  let r, n = -1;
  for (const [s, o] of C(e)) {
    if (!s.startsWith("sensor.") || Ce(b(o, "project_slug") ?? b(o, "project")) !== t) continue;
    let i = 0;
    L(o, "containers").length > 0 && (i += 8), _(o, "total_containers") !== void 0 && (i += 4), _(o, "running_containers") !== void 0 && (i += 3), _(o, "memory_usage_bytes") !== void 0 && (i += 2), _(o, "cpu_usage_percent") !== void 0 && (i += 2), s.startsWith("sensor.compose_project_") && (i += 3), s.startsWith("sensor.ugos_bridge_project_") && (i += 3), (i > n || i === n && r !== void 0 && s.localeCompare(r) < 0 || r === void 0) && (r = s, n = i);
  }
  return r;
}), vs = (e, t, r) => {
  const n = B(e), s = B(t);
  return r.some((o) => {
    const i = B(o);
    return i === n || i === s;
  });
}, bs = (e, t) => e.samples.at(-1)?.key === t.key ? e : { samples: [...e.samples, t].slice(-br) }, ze = (e, t, r) => {
  if (e.length >= r) return e.slice(-br);
  const n = Math.max(r - e.length, 0);
  return [...Array.from({ length: n }, () => t), ...e];
}, $s = (e, t, r) => {
  const n = e.length > 0 ? e : [{
    key: "initial",
    timestampLabel: "",
    cpuPercent: 0,
    ramPercent: 0,
    gpuPercent: 0,
    load1: 0,
    networkBpsBySlug: r
  }], s = Math.max(5 - n.length, 0);
  return [...Array.from({ length: s }, () => n[0]), ...n].map((o) => ({
    timestampLabel: o.timestampLabel,
    totalsByInterface: Object.fromEntries(t.map((i) => [i, o.networkBpsBySlug[i] ?? 0]))
  }));
}, er = (e, t) => {
  const r = e.find((n) => t.some((s) => n.label.includes(s)));
  return r ? r.value : e.find((n) => !n.entityId.includes("_disk_"))?.value;
}, Br = (e, t) => {
  const r = t.toLowerCase(), n = e.find((s) => s.label.includes(r) && (s.label.includes("phy temperature") || s.label.includes("mac temperature")));
  return n ? n.value : e.find((s) => s.label.includes(r))?.value;
}, ws = (e) => e === void 0 ? "healthy" : e >= 55 ? "degraded" : e >= 48 ? "warning" : "healthy", Bs = (e) => e >= 3 ? "High" : e >= 1 ? "Busy" : "Good", ks = (e) => e >= 90 ? "High" : e >= 70 ? "Busy" : "Good", xs = (e) => Math.max(0, Math.min(100, e)), Ps = (e) => {
  const t = e >= 100 ? 0 : e >= 10 ? 1 : 2;
  return `${e.toFixed(t)}%`;
}, Cs = (e, t) => A(e, `hasEntityPrefix:${t}`, () => R(e).some((r) => r.startsWith(`sensor.${t}_`) || r.startsWith(`binary_sensor.${t}_`))), Ms = (e, t) => A(e, `hasBridgeHostEntityPrefix:${t}`, () => R(e).some((r) => r.startsWith(`sensor.ugos_bridge_host_${t}_`) || r.startsWith(`binary_sensor.ugos_bridge_host_${t}_`))), Is = (e) => A(e, "hostSlugCandidates", () => {
  const t = /* @__PURE__ */ new Map(), r = (n, s) => {
    n === void 0 || n.startsWith("ugos_bridge_") || t.set(n, (t.get(n) ?? 0) + s);
  };
  for (const n of R(e))
    r(fn.exec(n)?.[1], 1e3), r($n.exec(n)?.[1], 500), r(bn.exec(n)?.[1], 100), r(wn.exec(n)?.[1], 1);
  return Array.from(t.entries()).sort(([n, s], [o, i]) => i - s || n.localeCompare(o)).map(([n]) => n);
}), Es = (e) => [
  `sensor.ugos_bridge_host_${e}_`,
  `binary_sensor.ugos_bridge_host_${e}_`,
  `sensor.${e}_`,
  `binary_sensor.${e}_`,
  "sensor.ugos_bridge_disk_",
  "sensor.ugos_bridge_filesystem_",
  "binary_sensor.ugos_bridge_filesystem_",
  "sensor.ugos_bridge_network_",
  "binary_sensor.ugos_bridge_network_",
  "sensor.ugos_bridge_bond_",
  "binary_sensor.ugos_bridge_bond_",
  "sensor.ugos_bridge_array_",
  "binary_sensor.ugos_bridge_array_",
  "sensor.ugos_bridge_gpu_",
  "sensor.ugos_bridge_project_",
  "sensor.compose_project_",
  "sensor.ugos_bridge_container_",
  "binary_sensor.ugos_bridge_container_",
  "sensor.ugos_bridge_vm_",
  "binary_sensor.ugos_bridge_vm_",
  "sensor.ugos_bridge_process_"
], As = (e, t, r) => R(e).filter((n) => {
  if (r !== void 0 && n === r || t.some((o) => n.startsWith(o))) return !0;
  const s = e[n];
  return b(s, "container") !== void 0 || b(s, "project") !== void 0 || _(s, "process_count") !== void 0 || _(s, "cpu_time_seconds") !== void 0;
}).sort(), Us = (e, t) => e.startsWith(`sensor.${t}_`) && ![
  "_array_",
  "_bond_",
  "_cooling_",
  "_disk_",
  "_filesystem_",
  "_gpu_",
  "_health_",
  "_network_",
  "_software_",
  "_ups_"
].some((r) => e.includes(r)), O = (e, t) => {
  let r, n = -1;
  e: for (const [s, o] of e) {
    const i = s.toLowerCase(), a = We(o), c = gt(o), l = yt(o);
    if (t.unit && c !== t.unit) continue;
    let d = l ? 100 : -100;
    for (const u of t.entityIncludes) {
      if (!i.includes(u)) continue e;
      d += 2;
    }
    for (const u of t.friendlyIncludes) {
      if (!a.includes(u)) continue e;
      d += 1;
    }
    (d > n || d === n && r !== void 0 && s.localeCompare(r) < 0 || r === void 0) && (r = s, n = d);
  }
  return r;
}, I = (e, t) => A(e, `entitySlugs:${t.source}`, () => Array.from(new Set(R(e).map((r) => t.exec(r)?.[1]).filter((r) => !!r))).sort()), me = (e, t, r, n, s) => A(e, `componentSlugs:${t}:${r}:${n}`, () => {
  const o = [
    new RegExp(`^(?:sensor|binary_sensor)\\.${P(r)}_${n}_([^_]+)_`),
    new RegExp(`^(?:sensor|binary_sensor)\\.${P(t)}_${n}_([^_]+)_`),
    new RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_${n}_([^_]+)_`)
  ];
  return Array.from(new Set(R(e).flatMap((i) => o.map((a) => a.exec(i)?.[1]).filter((a) => !!a)).map((i) => B(i)).filter((i) => !!i && s(i)))).sort();
}), yt = (e) => e !== void 0 && e.state !== "unknown" && e.state !== "unavailable", w = (e, t) => t ? Rs(e[t]) : void 0, nt = (e, t) => {
  if (!t) return;
  const r = e[t], n = Pe(r);
  if (!n) return;
  if (n.textState !== void 0) return n.textState ?? void 0;
  const s = r.state;
  return n.textState = !s || s === "unknown" || s === "unavailable" ? null : s, n.textState ?? void 0;
}, b = (e, t) => {
  const r = e?.attributes[t];
  return typeof r == "string" && r.trim() !== "" ? r : void 0;
}, _ = (e, t) => {
  const r = e?.attributes[t];
  if (typeof r == "number" && Number.isFinite(r)) return r;
  if (typeof r == "string") return q(r);
}, kr = (e, t) => {
  const r = e?.attributes[t];
  if (typeof r == "boolean") return r;
  if (typeof r == "number") return r !== 0;
  if (typeof r == "string") {
    const n = r.trim().toLowerCase();
    if (n === "1" || n === "true" || n === "on" || n === "running") return !0;
    if (n === "0" || n === "false" || n === "off" || n === "stopped") return !1;
  }
}, zs = (e, t) => {
  const r = e?.attributes[t];
  return Array.isArray(r) ? r.filter((n) => typeof n == "string" && n.trim() !== "") : [];
}, Ts = (e, t) => {
  for (const r of e) {
    const n = zs(r, t);
    if (n.length > 0) return n;
  }
  return [];
}, L = (e, t) => {
  const r = e?.attributes[t];
  return Array.isArray(r) ? r.filter((n) => typeof n == "object" && n !== null) : [];
}, U = (e, t) => {
  for (const r of t) {
    const n = e[r];
    if (typeof n == "string" && n.trim() !== "") return n;
  }
}, Ls = (e, t) => {
  for (const r of t) {
    const n = e[r];
    if (typeof n == "boolean") return n;
    if (typeof n == "number") return n !== 0;
    if (typeof n == "string") {
      const s = n.trim().toLowerCase();
      if (s === "1" || s === "true" || s === "on" || s === "running") return !0;
      if (s === "0" || s === "false" || s === "off" || s === "stopped") return !1;
    }
  }
}, H = (e, t) => {
  for (const r of t) {
    const n = e[r];
    if (typeof n == "number" && Number.isFinite(n)) return n;
    if (typeof n == "string") {
      const s = q(n);
      if (s !== void 0) return s;
    }
  }
}, q = (e) => {
  if (!e || e === "unknown" || e === "unavailable") return;
  const t = Number(e);
  return Number.isFinite(t) ? t : void 0;
}, Rs = (e) => {
  const t = Pe(e);
  if (!(!t || !e))
    return t.parsedNumber !== void 0 || (t.parsedNumber = q(e.state) ?? null), t.parsedNumber ?? void 0;
}, ht = (e) => e?.state === "on";
function Ns(e) {
  if (!e) return;
  const t = e.trim();
  return t === "°C" || t === "ºC" || t === "Â°C" || t === "В°C" ? "°C" : t || void 0;
}
var gt = (e) => Pe(e)?.unit, X = (e, t) => {
  const r = We(e);
  return t.every((n) => r.includes(n));
}, Se = (e, t, r) => {
  const n = _e(e);
  if (!n) return;
  const s = Hs(n, t);
  if (!s) return;
  const o = s.toLowerCase();
  for (const i of r) {
    const a = i.toLowerCase();
    if (!o.endsWith(` ${a}`)) continue;
    const c = s.slice(0, s.length - i.length).trim();
    return c ? B(c) : void 0;
  }
}, ft = (e, t) => {
  const r = _e(e);
  if (!r) return;
  const n = r.toLowerCase(), s = t.replace(/_/g, " ");
  if (!n.includes(s) || !n.includes("/")) return;
  const o = r.match(/(\/[^\s]*)/);
  return o ? B(o[1]) : void 0;
}, Hs = (e, t) => {
  const r = t.replace(/_/g, " ");
  if (e.toLowerCase().startsWith(`${r.toLowerCase()} `)) return e.slice(r.length + 1).trim();
}, Je = (e) => /^(sd[a-z]+|hd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+|loop\d+|serial_[a-z0-9_]+|path_[a-f0-9]+|name_[a-z0-9_]+)$/i.test(e), Ze = (e) => /^md\d+$/i.test(e), Ye = (e) => /^bond\d+$/i.test(e), Qe = (e) => /^(eth\d+|en[a-z0-9]+|eno\d+|ens\d+|enp[a-z0-9]+|wlan\d+|wl[a-z0-9]+|lo)$/i.test(e), js = (e) => {
  if (e)
    return e.replace(/\s+/g, " ").trim() || void 0;
}, Ds = (e) => {
  const t = e?.trim().toLowerCase();
  if (t)
    return t === "hdd" || t === "sata" ? "hdd" : t === "nvme" || t === "ssd" ? "nvme" : t;
}, Os = (e) => {
  const t = e?.trim().toLowerCase();
  if (t)
    return t === "linear" ? "JBOD" : t.toUpperCase();
}, tr = (e) => {
  const t = e.match(/^\/volume(\d+)$/i);
  return t ? `Volume ${t[1]}` : e;
}, Ss = (e, t) => {
  const r = t.reduce((s, o) => (o.mediaType && (s[o.mediaType] = (s[o.mediaType] ?? 0) + o.capacityBytes), s), {}), n = Object.entries(r).map(([s, o]) => ({
    mediaType: s,
    distance: Math.abs(o - e.sizeBytes) / Math.max(e.sizeBytes, o, 1)
  })).sort((s, o) => s.distance - o.distance)[0];
  if (n)
    return n.mediaType === "hdd" ? "SATA" : n.mediaType.toUpperCase();
}, Ws = (e, t) => {
  if (!(e === void 0 && t === void 0))
    return `Drives ${e ?? t ?? 0}/${t ?? e ?? 0}`;
}, xr = (e) => {
  const t = _e(e);
  if (!t) return;
  const r = t.replace(/^(compose|docker)\s+project\s+/i, "").replace(/\s+(CPU|Memory|Total Containers|Running Containers)$/i, "").trim();
  if (!r) return;
  const n = r.split(/\s+/).filter((s, o, i) => o === 0 || s.toLowerCase() !== i[o - 1]?.toLowerCase()).join(" ");
  return n ? B(n) : void 0;
}, Fs = (e) => {
  const t = e.trim();
  if (!t) return t;
  const r = t.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(), n = r.split(" ");
  if (n.length % 2 === 0) {
    const s = n.length / 2;
    if (n.slice(0, s).join(" ").toLowerCase() === n.slice(s).join(" ").toLowerCase()) return n.slice(0, s).join(" ");
  }
  return r;
}, Gs = (e, t, r, n) => {
  const s = Object.entries(e).filter(([o, i]) => {
    if (!o.startsWith("sensor.") || gt(i) !== "%") return !1;
    const a = `${o} ${_e(i)}`.toLowerCase(), c = a.includes(t) || a.includes(t.replace(/_/g, " ")), l = a.includes(n), d = a.includes("busy"), u = a.includes("render/3d") || a.includes("render_3d") || a.includes("blitter") || a.includes("videoenhance") || a.includes("video_enhance") || a.includes("video/") || a.includes("video_");
    return c && l && d && u;
  }).map(([, o]) => q(o.state)).filter((o) => o !== void 0);
  return s.length > 0 ? Math.max(...s) : w(e, Re(e, t, r, n, "busy")) ?? 0;
}, K = (e, t, r) => {
  const n = _e(e);
  if (!n) return null;
  let s = n.trim();
  return t && s.endsWith(` ${t}`) && (s = s.slice(0, -` ${t}`.length)), r && s.startsWith(`${r} `) && (s = s.slice(r.length + 1)), s.startsWith("Compose project ") && (s = s.slice(16)), s.trim() || null;
}, _e = (e) => Pe(e)?.friendlyName ?? "", We = (e) => Pe(e)?.friendlyNameLower ?? "", qs = (e) => {
  const t = e.match(/^cpu\s*(\d+)$/i);
  return t ? `Core ${t[1]}` : e.replace(/\s+/g, " ").trim();
}, Vs = (e, t) => (q(e.key.replace(/[^\d]/g, "")) ?? Number.MAX_SAFE_INTEGER) - (q(t.key.replace(/[^\d]/g, "")) ?? Number.MAX_SAFE_INTEGER) || e.name.localeCompare(t.name), Ks = (e) => {
  const t = e.replace(/\/\d+$/g, "").replace(/\/3d/gi, "").replace(/\s+/g, "");
  return /^render/i.test(t) ? "Render" : /^blitter/i.test(t) ? "Blitter" : /^videoenhance/i.test(t) ? "VideoEnhance" : /^video/i.test(t) ? "Video" : e.replace(/\/\d+$/g, "").trim();
}, Xs = (e) => e.split("_").filter(Boolean).map((t) => t === "imc" ? "IMC" : t === "rc6" ? "RC6" : t === "mhz" ? "MHz" : t === "mib" ? "MiB" : vt(t)).join(" "), Ce = (e) => {
  if (!e) return;
  const t = B(e);
  return t === "unknown" ? void 0 : t;
}, Js = (e) => {
  const t = String(e?.state ?? "").trim().toLowerCase();
  return t ? t === "1" || t === "on" ? "running" : t === "0" || t === "off" ? "stopped" : t : "unknown";
}, Zs = (e, t) => {
  const r = kr(e, "running");
  if (r !== void 0) return r;
  const n = String(e?.state ?? t ?? "").trim().toLowerCase();
  if (n === "1" || n === "on" || n === "running") return !0;
  if (n === "0" || n === "off" || n === "stopped" || n === "exited") return !1;
}, Ys = (e, t, r) => {
  const n = Ce(b(t, "project"));
  return n || ([
    e,
    b(t, "container") ?? "",
    b(t, "image") ?? ""
  ].some((s) => Pr(s, r)) ? r : void 0);
}, Qs = (e, t) => [
  e.key,
  e.name ?? "",
  e.image ?? ""
].some((r) => Pr(r, t)), Pr = (e, t) => {
  const r = e.trim().toLowerCase();
  if (!r) return !1;
  const n = t.trim().toLowerCase(), s = n.replace(/[^a-z0-9]+/g, ""), o = r.replace(/[^a-z0-9]+/g, "");
  return r === n || o === s ? !0 : Array.from(/* @__PURE__ */ new Set([
    n,
    n.replace(/-/g, "_"),
    n.replace(/_/g, "-"),
    ...n.split(/[_-]+/g).filter((i) => i.length >= 4)
  ])).some((i) => {
    const a = i.replace(/[^a-z0-9]+/g, "");
    return a ? r.startsWith(`${i}_`) || r.startsWith(`${i}-`) || r.endsWith(`_${i}`) || r.endsWith(`-${i}`) || r.includes(`_${i}_`) || r.includes(`-${i}-`) || o.includes(a) : !1;
  });
}, rr = (e) => {
  const t = e.trim().toLowerCase();
  if (!t) return [];
  const r = /* @__PURE__ */ new Set(), n = (i) => {
    const a = B(i);
    a && a !== "unknown" && r.add(a);
  }, s = t.replace(/\[[^\]]+\]/g, "").replace(/^.*\//g, "").trim();
  if (!s) return [];
  n(s);
  const o = [s];
  for (; o.length > 0; ) {
    const i = o.pop() ?? "";
    for (const a of [
      /^(.+)-part\d+$/,
      /^(nvme\d+n\d+)p\d+$/,
      /^(mmcblk\d+)p\d+$/,
      /^([a-z]+[a-z0-9]*)\d+$/
    ]) {
      const c = i.match(a);
      if (!c?.[1]) continue;
      const l = B(c[1]);
      r.has(l) || (n(c[1]), o.push(c[1]));
    }
  }
  return Array.from(r);
}, st = (e) => e === "root" ? "/" : `/${e.replace(/_/g, "/")}`, ue = (e) => e.split("_").filter(Boolean).map(vt).join(" "), vt = (e) => e.charAt(0).toUpperCase() + e.slice(1), B = (e) => {
  const t = e.trim().toLowerCase();
  return t ? t === "/" ? "root" : t.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown" : "unknown";
}, P = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), eo = (e) => {
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? "" : new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !1
  }).format(t);
}, to = (e) => {
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? "Unavailable" : new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !1
  }).format(t);
}, ro = (e) => `${Math.floor(e / 86400)}d ${Math.floor(e % 86400 / 3600)}h ${Math.floor(e % 3600 / 60)}m`, nr = (e) => {
  const t = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB"
  ];
  if (!Number.isFinite(e) || e <= 0) return "0 B";
  const r = Math.min(Math.floor(Math.log(e) / Math.log(1024)), t.length - 1), n = e / 1024 ** r, s = r === 0 ? 0 : r >= 4 ? 1 : 0;
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: s,
    maximumFractionDigits: s
  })} ${t[r]}`;
}, bt = (e) => e.trim().toLowerCase(), g = (e) => e * 1024 ** 3, G = (e) => e * 1024 ** 4, h = (e) => e * 1e6, M = (e) => e * 1e9, re = (e, t) => t.map((r) => Math.max(0, Number((e + r).toFixed(3)))), sr = [
  {
    key: "gitea",
    title: "Gitea",
    cpuPercent: 0.3925496609109711,
    memoryBytes: 324 * 1024 ** 2,
    runningContainers: 2,
    totalContainers: 2,
    status: "up",
    containers: [{
      key: "gitea",
      name: "gitea",
      image: "gitea/gitea:latest",
      status: "Up 5 days",
      state: "running",
      running: !0,
      cpuPercent: 0.21,
      memoryBytes: 218 * 1024 ** 2,
      memoryLimitBytes: g(2)
    }, {
      key: "cloudflared_gitea",
      name: "cloudflared_gitea",
      image: "cloudflare/cloudflared:latest",
      status: "Up 5 days",
      state: "running",
      running: !0,
      cpuPercent: 0.18,
      memoryBytes: 106 * 1024 ** 2,
      memoryLimitBytes: g(1)
    }]
  },
  {
    key: "go_back_db",
    title: "Go Back DB",
    cpuPercent: 0,
    memoryBytes: 768 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: "up",
    containers: [
      {
        key: "go_back_db_app",
        name: "go_back_db_app",
        image: "ghcr.io/example/go-back-db-app:latest",
        status: "Up 9 days",
        state: "running",
        running: !0,
        cpuPercent: 0,
        memoryBytes: 256 * 1024 ** 2,
        memoryLimitBytes: g(2)
      },
      {
        key: "go_back_db_front",
        name: "go_back_db_front",
        image: "ghcr.io/example/go-back-db-front:latest",
        status: "Up 9 days",
        state: "running",
        running: !0,
        cpuPercent: 0,
        memoryBytes: 188 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "go_back_db_postgres",
        name: "go_back_db_postgres",
        image: "postgres:16",
        status: "Up 9 days",
        state: "running",
        running: !0,
        cpuPercent: 0,
        memoryBytes: 324 * 1024 ** 2,
        memoryLimitBytes: g(2)
      }
    ]
  },
  {
    key: "gorent",
    title: "GoRent",
    cpuPercent: 0,
    memoryBytes: 412 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: "up",
    containers: [
      {
        key: "gorent-backend",
        name: "gorent-backend",
        image: "ghcr.io/example/gorent-backend:latest",
        status: "Up 3 days",
        state: "running",
        running: !0,
        cpuPercent: 0,
        memoryBytes: 178 * 1024 ** 2,
        memoryLimitBytes: g(2)
      },
      {
        key: "gorent-frontend",
        name: "gorent-frontend",
        image: "ghcr.io/example/gorent-frontend:latest",
        status: "Up 3 days",
        state: "running",
        running: !0,
        cpuPercent: 0,
        memoryBytes: 94 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "gorent-postgres",
        name: "gorent-postgres",
        image: "postgres:16",
        status: "Up 3 days",
        state: "running",
        running: !0,
        cpuPercent: 0,
        memoryBytes: 140 * 1024 ** 2,
        memoryLimitBytes: g(2)
      }
    ]
  },
  {
    key: "home-assistant",
    title: "Home Assistant",
    cpuPercent: 0.10272887844115354,
    memoryBytes: 612 * 1024 ** 2,
    runningContainers: 4,
    totalContainers: 4,
    status: "up",
    containers: [
      {
        key: "homeassistant",
        name: "homeassistant",
        image: "ghcr.io/home-assistant/home-assistant:stable",
        status: "Up 14 days",
        state: "running",
        running: !0,
        cpuPercent: 0.08,
        memoryBytes: 356 * 1024 ** 2,
        memoryLimitBytes: g(3)
      },
      {
        key: "go2rtc",
        name: "go2rtc",
        image: "alexxit/go2rtc:latest",
        status: "Up 14 days",
        state: "running",
        running: !0,
        cpuPercent: 0.01,
        memoryBytes: 88 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "mosquitto",
        name: "mosquitto",
        image: "eclipse-mosquitto:2",
        status: "Up 14 days",
        state: "running",
        running: !0,
        cpuPercent: 0.01,
        memoryBytes: 52 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "ugos-bridge",
        name: "ugos-bridge",
        image: "rcooler/ugos-bridge:latest",
        status: "Up 14 days",
        state: "running",
        running: !0,
        cpuPercent: 0.01,
        memoryBytes: 116 * 1024 ** 2,
        memoryLimitBytes: g(1)
      }
    ]
  },
  {
    key: "virtual_machines",
    title: "Virtual machines",
    cpuPercent: 3.4,
    memoryBytes: g(5.8),
    runningContainers: 2,
    totalContainers: 3,
    status: "partial",
    containers: [
      {
        key: "ugos-vm-win11",
        name: "Windows 11",
        image: "Win11_24H2_English_x64",
        status: "Running",
        state: "running",
        running: !0,
        cpuPercent: 2.7,
        memoryBytes: g(4.1),
        memoryLimitBytes: g(8)
      },
      {
        key: "ugos-vm-ubuntu",
        name: "Ubuntu Server",
        image: "ubuntu-24.04.2-live-server-amd64",
        status: "Running",
        state: "running",
        running: !0,
        cpuPercent: 0.7,
        memoryBytes: g(1.7),
        memoryLimitBytes: g(4)
      },
      {
        key: "ugos-vm-test",
        name: "Test Lab",
        image: "debian-12.10.0-amd64-netinst",
        status: "Shutoff",
        state: "shutoff",
        running: !1,
        cpuPercent: 0,
        memoryBytes: 0,
        memoryLimitBytes: g(2)
      }
    ]
  },
  {
    key: "jellyfin",
    title: "Jellyfin",
    cpuPercent: 0.009448818897637795,
    memoryBytes: 256 * 1024 ** 2,
    runningContainers: 1,
    totalContainers: 1,
    status: "up",
    containers: [{
      key: "jellyfin-app-1",
      name: "jellyfin-app-1",
      image: "jellyfin/jellyfin:latest",
      status: "Up 11 days",
      state: "running",
      running: !0,
      cpuPercent: 0.01,
      memoryBytes: 256 * 1024 ** 2,
      memoryLimitBytes: g(4)
    }]
  },
  {
    key: "kuma_monitoring",
    title: "Kuma Monitoring",
    cpuPercent: 2.976829051619071,
    memoryBytes: 430 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: "up",
    containers: [
      {
        key: "uptime-kuma",
        name: "uptime-kuma",
        image: "louislam/uptime-kuma:latest",
        status: "Up 8 days",
        state: "running",
        running: !0,
        cpuPercent: 2.64,
        memoryBytes: 284 * 1024 ** 2,
        memoryLimitBytes: g(2)
      },
      {
        key: "cloudflared_kuma",
        name: "cloudflared_kuma",
        image: "cloudflare/cloudflared:latest",
        status: "Up 8 days",
        state: "running",
        running: !0,
        cpuPercent: 0.14,
        memoryBytes: 76 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "kuma_vpn",
        name: "kuma_vpn",
        image: "qmcgaw/gluetun:latest",
        status: "Up 8 days",
        state: "running",
        running: !0,
        cpuPercent: 0.19,
        memoryBytes: 70 * 1024 ** 2,
        memoryLimitBytes: g(1)
      }
    ]
  },
  {
    key: "monitoring",
    title: "Monitoring",
    cpuPercent: 1.8076912575738409,
    memoryBytes: g(1.2),
    runningContainers: 9,
    totalContainers: 9,
    status: "up",
    containers: [
      {
        key: "grafana",
        name: "grafana",
        image: "grafana/grafana:latest",
        status: "Up 6 days",
        state: "running",
        running: !0,
        cpuPercent: 0.52,
        memoryBytes: 298 * 1024 ** 2,
        memoryLimitBytes: g(2)
      },
      {
        key: "prometheus",
        name: "prometheus",
        image: "prom/prometheus:latest",
        status: "Up 6 days",
        state: "running",
        running: !0,
        cpuPercent: 0.41,
        memoryBytes: 356 * 1024 ** 2,
        memoryLimitBytes: g(2)
      },
      {
        key: "loki",
        name: "loki",
        image: "grafana/loki:latest",
        status: "Up 6 days",
        state: "running",
        running: !0,
        cpuPercent: 0.18,
        memoryBytes: 184 * 1024 ** 2,
        memoryLimitBytes: g(2)
      }
    ]
  },
  {
    key: "nas",
    title: "NAS",
    cpuPercent: 0.8259763328145205,
    memoryBytes: 508 * 1024 ** 2,
    runningContainers: 3,
    totalContainers: 3,
    status: "up",
    containers: [
      {
        key: "nas-node-prom-bridge",
        name: "nas-node-prom-bridge",
        image: "ghcr.io/example/nas-node-prom-bridge:latest",
        status: "Up 20 days",
        state: "running",
        running: !0,
        cpuPercent: 0.31,
        memoryBytes: 188 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "cloudflared_nas",
        name: "cloudflared_nas",
        image: "cloudflare/cloudflared:latest",
        status: "Up 20 days",
        state: "running",
        running: !0,
        cpuPercent: 0.21,
        memoryBytes: 94 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "jinko_exporter",
        name: "jinko_exporter",
        image: "ghcr.io/example/jinko-exporter:latest",
        status: "Up 20 days",
        state: "running",
        running: !0,
        cpuPercent: 0.31,
        memoryBytes: 226 * 1024 ** 2,
        memoryLimitBytes: g(1)
      }
    ]
  },
  {
    key: "torrent",
    title: "Torrent",
    cpuPercent: 0.07306297825467073,
    memoryBytes: 184 * 1024 ** 2,
    runningContainers: 2,
    totalContainers: 2,
    status: "up",
    containers: [{
      key: "qbittorrent",
      name: "qbittorrent",
      image: "lscr.io/linuxserver/qbittorrent:latest",
      status: "Up 12 days",
      state: "running",
      running: !0,
      cpuPercent: 0.05,
      memoryBytes: 128 * 1024 ** 2,
      memoryLimitBytes: g(2)
    }, {
      key: "qbittorrent_gluetun",
      name: "qbittorrent_gluetun",
      image: "qmcgaw/gluetun:latest",
      status: "Up 12 days",
      state: "running",
      running: !0,
      cpuPercent: 0.02,
      memoryBytes: 56 * 1024 ** 2,
      memoryLimitBytes: g(1)
    }]
  },
  {
    key: "webserver",
    title: "Webserver",
    cpuPercent: 1.123501622902011,
    memoryBytes: 736 * 1024 ** 2,
    runningContainers: 7,
    totalContainers: 7,
    status: "up",
    containers: [
      {
        key: "nginx",
        name: "nginx",
        image: "nginx:stable",
        status: "Up 17 days",
        state: "running",
        running: !0,
        cpuPercent: 0.31,
        memoryBytes: 146 * 1024 ** 2,
        memoryLimitBytes: g(1)
      },
      {
        key: "nginx-proxy-manager",
        name: "nginx-proxy-manager",
        image: "jc21/nginx-proxy-manager:latest",
        status: "Up 17 days",
        state: "running",
        running: !0,
        cpuPercent: 0.49,
        memoryBytes: 308 * 1024 ** 2,
        memoryLimitBytes: g(2)
      },
      {
        key: "php84",
        name: "php84",
        image: "php:8.4-fpm",
        status: "Up 17 days",
        state: "running",
        running: !0,
        cpuPercent: 0.32,
        memoryBytes: 282 * 1024 ** 2,
        memoryLimitBytes: g(2)
      }
    ]
  }
], no = (e) => ({
  totalContainers: e.reduce((t, r) => t + r.totalContainers, 0),
  runningContainers: e.reduce((t, r) => t + r.runningContainers, 0),
  totalProjects: e.length,
  onlineProjects: e.filter((t) => t.status === "up").length
}), $t = [{
  name: "Pool 1",
  layout: "RAID 6 | 6 Drives",
  status: "healthy",
  usedBytes: G(10.2),
  totalBytes: G(40.5),
  accent: m.green,
  key: "pool_1",
  driveSlugs: [
    "sda",
    "sdb",
    "sdc",
    "sdd",
    "sde",
    "sdf"
  ]
}, {
  name: "Pool 2",
  layout: "RAID 1 | 2 Drives (M.2)",
  status: "healthy",
  usedBytes: G(6.1),
  totalBytes: G(8.2),
  accent: m.purple,
  key: "pool_2",
  driveSlugs: ["nvme0n1", "nvme1n1"]
}], so = $t.reduce((e, t) => e + t.totalBytes, 0), oo = $t.reduce((e, t) => e + t.usedBytes, 0), io = [
  {
    kind: "cpu",
    title: "CPU",
    accent: m.blue,
    valuePercent: 18,
    temperatureCelsius: 45,
    series: re(18, [
      -2.2,
      -1.8,
      0.3,
      -0.4,
      1.7,
      -0.9,
      2.8,
      -2.1,
      1.2,
      0.4
    ])
  },
  {
    kind: "ram",
    title: "RAM",
    accent: m.purple,
    valuePercent: 46,
    usedBytes: g(14.6),
    totalBytes: g(32),
    series: re(46, [
      -2.1,
      -0.5,
      1.1,
      -1.4,
      -2.2,
      1.8,
      1.4,
      0.2,
      -1.1,
      1
    ])
  },
  {
    kind: "gpu",
    title: "GPU",
    accent: m.green,
    valuePercent: 32,
    temperatureCelsius: 48,
    series: re(32, [
      -1.5,
      -1.1,
      0.2,
      2,
      1.3,
      0.4,
      -0.8,
      1.1,
      0.2,
      -1.9
    ])
  },
  {
    kind: "system-load",
    title: "System Load",
    accent: m.softBlue,
    value: 0.78,
    valuePercent: 0.78,
    valueText: "0.78%",
    unit: "percent",
    statusText: "Good",
    series: re(0.78, [
      -0.12,
      -0.08,
      0.04,
      -0.03,
      0.06,
      0.09,
      -0.04,
      0.05,
      -0.02,
      0.07
    ])
  },
  {
    kind: "total-storage",
    title: "Total Storage",
    accent: m.cyan,
    totalBytes: so,
    usedBytes: oo
  },
  {
    kind: "network",
    title: "Network",
    accent: m.green,
    downloadBps: M(1.2),
    uploadBps: h(123)
  }
], ao = [
  {
    key: "cpu",
    title: "CPU",
    subtitle: "Intel Core i5-1235U",
    accent: m.blue,
    utilizationPercent: 18,
    detailRows: [
      {
        label: "Cores / Threads",
        value: "10 / 12"
      },
      {
        label: "Base / Boost",
        value: "1.3 / 4.4 GHz"
      },
      {
        label: "Temperature",
        value: "45°C"
      },
      {
        label: "Power Usage",
        value: "18 W"
      }
    ],
    series: re(18, [
      -2.5,
      -1.8,
      0.1,
      -0.6,
      1.9,
      0.4,
      2.8,
      -1.9,
      1.2,
      3.3,
      -0.8,
      -1.6,
      0.7,
      -0.9,
      0,
      1.9,
      -2.4,
      0.9,
      0.1,
      1.8,
      -0.7
    ])
  },
  {
    key: "ram",
    title: "RAM",
    subtitle: "32 GB DDR5",
    accent: m.purple,
    utilizationPercent: 46,
    detailRows: [
      {
        label: "Used",
        value: "14.6 GB"
      },
      {
        label: "Total",
        value: "32 GB"
      },
      {
        label: "Type",
        value: "DDR5"
      },
      {
        label: "Speed",
        value: "4800 MT/s"
      }
    ],
    series: re(46, [
      -2.1,
      -1.1,
      0.9,
      0.1,
      -1.1,
      -2.1,
      -1.2,
      2.1,
      0.3,
      1.2,
      2.9,
      1.1,
      2.1,
      -1,
      0.2,
      1,
      2,
      -1.9,
      -1.1,
      0.2,
      1
    ])
  },
  {
    key: "gpu",
    title: "GPU",
    subtitle: "Intel Iris Xe",
    accent: m.green,
    utilizationPercent: 32,
    detailRows: [
      {
        label: "VRAM Used",
        value: "1.6 GB"
      },
      {
        label: "VRAM Total",
        value: "8.0 GB"
      },
      {
        label: "Temperature",
        value: "48°C"
      },
      {
        label: "Power Usage",
        value: "15 W"
      }
    ],
    series: re(32, [
      -3.8,
      -2,
      -1,
      1.1,
      -1,
      -2,
      2.1,
      3.8,
      1,
      0.2,
      2,
      -1,
      -3,
      -2,
      1.2,
      3.1,
      2,
      0.1,
      -1,
      1,
      -2
    ])
  }
], co = [
  {
    name: "M.2 1",
    model: "Lexar NM790 1TB SSD",
    capacityBytes: g(931),
    temperatureCelsius: 40,
    status: "healthy",
    diskSlug: "nvme0n1"
  },
  {
    name: "M.2 2",
    model: "Lexar NM790 1TB SSD",
    capacityBytes: g(931),
    temperatureCelsius: 41,
    status: "healthy",
    diskSlug: "nvme1n1"
  },
  {
    name: "HDD 1",
    model: "Seagate IronWolf 12TB",
    capacityBytes: G(10.9),
    temperatureCelsius: 36,
    status: "healthy",
    diskSlug: "sda"
  },
  {
    name: "HDD 2",
    model: "Seagate IronWolf 12TB",
    capacityBytes: G(10.9),
    temperatureCelsius: 37,
    status: "healthy",
    diskSlug: "sdb"
  },
  {
    name: "HDD 3",
    model: "Seagate IronWolf 12TB",
    capacityBytes: G(10.9),
    temperatureCelsius: 36,
    status: "healthy",
    diskSlug: "sdc"
  },
  {
    name: "HDD 4",
    model: "Seagate IronWolf 12TB",
    capacityBytes: G(10.9),
    temperatureCelsius: 37,
    status: "healthy",
    diskSlug: "sdd"
  },
  {
    name: "HDD 5",
    model: "Seagate IronWolf 12TB",
    capacityBytes: G(10.9),
    temperatureCelsius: 36,
    status: "healthy",
    diskSlug: "sde"
  },
  {
    name: "HDD 6",
    model: "Seagate IronWolf 12TB",
    capacityBytes: G(10.9),
    temperatureCelsius: 37,
    status: "healthy",
    diskSlug: "sdf"
  }
], lo = [
  {
    key: "cpu0",
    name: "CPU 0",
    usagePercent: 15.7,
    currentMHz: 1298,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu1",
    name: "CPU 1",
    usagePercent: 17,
    currentMHz: 1302,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu2",
    name: "CPU 2",
    usagePercent: 17.7,
    currentMHz: 1295,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu3",
    name: "CPU 3",
    usagePercent: 17.4,
    currentMHz: 1288,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu4",
    name: "CPU 4",
    usagePercent: 21.8,
    currentMHz: 1882,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu5",
    name: "CPU 5",
    usagePercent: 23.8,
    currentMHz: 1900,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu6",
    name: "CPU 6",
    usagePercent: 23.9,
    currentMHz: 1896,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu7",
    name: "CPU 7",
    usagePercent: 21.7,
    currentMHz: 1874,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu8",
    name: "CPU 8",
    usagePercent: 21.8,
    currentMHz: 1871,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu9",
    name: "CPU 9",
    usagePercent: 21.7,
    currentMHz: 1865,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu10",
    name: "CPU 10",
    usagePercent: 21.3,
    currentMHz: 1852,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  },
  {
    key: "cpu11",
    name: "CPU 11",
    usagePercent: 20.8,
    currentMHz: 1836,
    minMHz: 400,
    maxMHz: 4400,
    governor: "powersave"
  }
], uo = [
  {
    key: "total",
    label: "Total",
    valueBytes: 62.5 * 1024 ** 3
  },
  {
    key: "used",
    label: "Used",
    valueBytes: 13.7 * 1024 ** 3,
    totalBytes: 62.5 * 1024 ** 3
  },
  {
    key: "buffers",
    label: "Buffers",
    valueBytes: 1.04 * 1024 ** 3,
    totalBytes: 62.5 * 1024 ** 3
  },
  {
    key: "cached",
    label: "Cached",
    valueBytes: 47.2 * 1024 ** 3,
    totalBytes: 62.5 * 1024 ** 3
  },
  {
    key: "swap-used",
    label: "Swap Used",
    valueBytes: 2.63 * 1024 ** 3,
    totalBytes: 37.3 * 1024 ** 3
  },
  {
    key: "swap-total",
    label: "Swap Total",
    valueBytes: 37.3 * 1024 ** 3
  }
], po = [
  {
    key: "blitter",
    label: "Blitter",
    busyPercent: 4.2,
    semaPercent: 0.3,
    waitPercent: 0.8
  },
  {
    key: "render",
    label: "Render",
    busyPercent: 32,
    semaPercent: 1.5,
    waitPercent: 3.2
  },
  {
    key: "video",
    label: "Video",
    busyPercent: 18.6,
    semaPercent: 0.6,
    waitPercent: 1.1
  },
  {
    key: "video-enhance",
    label: "VideoEnhance",
    busyPercent: 7.9,
    semaPercent: 0.1,
    waitPercent: 0.4
  }
], mo = [
  {
    key: "frequency_actual_mhz",
    label: "Actual Frequency",
    value: 0,
    unit: "MHz"
  },
  {
    key: "frequency_requested_mhz",
    label: "Requested Frequency",
    value: 0,
    unit: "MHz"
  },
  {
    key: "imc_bandwidth_reads_mib_per_second",
    label: "IMC Reads",
    value: 0,
    unit: "MiB/s"
  },
  {
    key: "imc_bandwidth_writes_mib_per_second",
    label: "IMC Writes",
    value: 0,
    unit: "MiB/s"
  },
  {
    key: "interrupts_per_second",
    label: "Interrupts",
    value: 0,
    unit: "/s"
  },
  {
    key: "period_milliseconds",
    label: "Sample Period",
    value: 16.9,
    unit: "ms"
  },
  {
    key: "power_gpu_watts",
    label: "GPU Power",
    value: 0,
    unit: "W"
  },
  {
    key: "power_package_watts",
    label: "Package Power",
    value: 17.4,
    unit: "W"
  },
  {
    key: "rc6_percent",
    label: "RC6",
    value: 100,
    unit: "%"
  }
], _o = [
  {
    key: "taskmgr_serv",
    name: "Taskmgr Serv",
    processCount: 1,
    cpuPercent: 5.24,
    memoryBytes: 49 * 1024 ** 2,
    cpuTimeSeconds: 1251.18
  },
  {
    key: "embyserver",
    name: "EmbyServer",
    processCount: 1,
    cpuPercent: 4.67,
    memoryBytes: 612 * 1024 ** 2,
    cpuTimeSeconds: 18324.3
  },
  {
    key: "dockerd",
    name: "dockerd",
    processCount: 1,
    cpuPercent: 2.82,
    memoryBytes: 184 * 1024 ** 2,
    cpuTimeSeconds: 5932.8
  },
  {
    key: "containerd",
    name: "containerd",
    processCount: 1,
    cpuPercent: 2.09,
    memoryBytes: 132 * 1024 ** 2,
    cpuTimeSeconds: 4301.2
  },
  {
    key: "postgres",
    name: "postgres",
    processCount: 4,
    cpuPercent: 1.81,
    memoryBytes: 318 * 1024 ** 2,
    cpuTimeSeconds: 7022.6
  },
  {
    key: "nginx",
    name: "nginx",
    processCount: 6,
    cpuPercent: 1.26,
    memoryBytes: 144 * 1024 ** 2,
    cpuTimeSeconds: 1288.4
  },
  {
    key: "python3",
    name: "python3",
    processCount: 2,
    cpuPercent: 0.96,
    memoryBytes: 228 * 1024 ** 2,
    cpuTimeSeconds: 2311.9
  },
  {
    key: "smbd",
    name: "smbd",
    processCount: 3,
    cpuPercent: 0.63,
    memoryBytes: 96 * 1024 ** 2,
    cpuTimeSeconds: 418.5
  },
  {
    key: "redis-server",
    name: "redis-server",
    processCount: 1,
    cpuPercent: 0.31,
    memoryBytes: 48 * 1024 ** 2,
    cpuTimeSeconds: 702.2
  },
  {
    key: "prometheus",
    name: "prometheus",
    processCount: 1,
    cpuPercent: 0.22,
    memoryBytes: 354 * 1024 ** 2,
    cpuTimeSeconds: 1550.7
  }
], Te = [
  {
    timestampLabel: "14:25",
    totalsByInterface: {
      bond0: M(1.2),
      eth0: h(430),
      eth1: h(780)
    }
  },
  {
    timestampLabel: "14:25",
    totalsByInterface: {
      bond0: M(1.24),
      eth0: h(440),
      eth1: h(800)
    }
  },
  {
    timestampLabel: "14:25",
    totalsByInterface: {
      bond0: M(1.18),
      eth0: h(410),
      eth1: h(770)
    }
  },
  {
    timestampLabel: "14:26",
    totalsByInterface: {
      bond0: M(1.28),
      eth0: h(455),
      eth1: h(825)
    }
  },
  {
    timestampLabel: "14:26",
    totalsByInterface: {
      bond0: M(1.31),
      eth0: h(468),
      eth1: h(840)
    }
  },
  {
    timestampLabel: "14:26",
    totalsByInterface: {
      bond0: M(1.27),
      eth0: h(452),
      eth1: h(818)
    }
  },
  {
    timestampLabel: "14:27",
    totalsByInterface: {
      bond0: M(1.35),
      eth0: h(489),
      eth1: h(861)
    }
  },
  {
    timestampLabel: "14:27",
    totalsByInterface: {
      bond0: M(1.33),
      eth0: h(474),
      eth1: h(852)
    }
  },
  {
    timestampLabel: "14:27",
    totalsByInterface: {
      bond0: M(1.39),
      eth0: h(495),
      eth1: h(890)
    }
  },
  {
    timestampLabel: "14:28",
    totalsByInterface: {
      bond0: M(1.3),
      eth0: h(462),
      eth1: h(834)
    }
  },
  {
    timestampLabel: "14:28",
    totalsByInterface: {
      bond0: M(1.26),
      eth0: h(448),
      eth1: h(805)
    }
  },
  {
    timestampLabel: "14:29",
    totalsByInterface: {
      bond0: M(1.41),
      eth0: h(508),
      eth1: h(902)
    }
  },
  {
    timestampLabel: "14:29",
    totalsByInterface: {
      bond0: M(1.44),
      eth0: h(516),
      eth1: h(925)
    }
  },
  {
    timestampLabel: "14:30",
    totalsByInterface: {
      bond0: M(1.37),
      eth0: h(492),
      eth1: h(876)
    }
  },
  {
    timestampLabel: "14:30",
    totalsByInterface: {
      bond0: M(1.46),
      eth0: h(521),
      eth1: h(938)
    }
  }
], yo = {
  deviceInfo: {
    model: "DXP6800 Pro",
    ugosVersion: "1.2.0",
    hostname: "DXP6800PRO",
    ipAddress: "192.168.1.100",
    uptimeSeconds: 1104120,
    lastUpdated: "2026-04-23 20:30"
  },
  hardwareSummary: io,
  hardwareDetails: ao,
  drives: co,
  storagePools: $t,
  dockerProjects: sr,
  dockerTotals: no(sr),
  networkInterfaces: [
    {
      name: "bond0",
      status: "up",
      linkSpeedMbps: 5e3,
      temperatureCelsius: 38,
      downloadBps: h(620),
      uploadBps: h(580)
    },
    {
      name: "eth0",
      status: "up",
      linkSpeedMbps: 2500,
      temperatureCelsius: 37,
      downloadBps: h(240),
      uploadBps: h(190)
    },
    {
      name: "eth1",
      status: "up",
      linkSpeedMbps: 2500,
      temperatureCelsius: 39,
      downloadBps: h(380),
      uploadBps: h(400)
    }
  ],
  networkTrafficHistory: Te,
  networkTrafficLines: [
    {
      key: "bond0",
      label: "bond0",
      color: m.cyan,
      currentBps: M(1.46),
      series: Te.map((e) => e.totalsByInterface.bond0)
    },
    {
      key: "eth0",
      label: "eth0",
      color: m.good,
      currentBps: h(521),
      series: Te.map((e) => e.totalsByInterface.eth0)
    },
    {
      key: "eth1",
      label: "eth1",
      color: m.purple,
      currentBps: h(938),
      series: Te.map((e) => e.totalsByInterface.eth1)
    }
  ],
  cpuCores: lo,
  ramBreakdown: uo,
  gpuEngines: po,
  gpuStats: mo,
  topProcesses: _o
}, ho = () => ({
  deviceInfo: {
    model: "UGREEN NAS",
    ugosVersion: "Unavailable",
    hostname: "Unavailable",
    ipAddress: "Unavailable",
    uptimeSeconds: 0,
    lastUpdated: "Unavailable"
  },
  hardwareSummary: [
    {
      kind: "cpu",
      title: "CPU",
      accent: m.blue,
      valuePercent: 0,
      temperatureCelsius: 0,
      series: [
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      kind: "ram",
      title: "RAM",
      accent: m.purple,
      valuePercent: 0,
      usedBytes: 0,
      totalBytes: 0,
      series: [
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      kind: "system-load",
      title: "System Load",
      accent: m.softBlue,
      value: 0,
      valuePercent: 0,
      valueText: "0.00%",
      unit: "percent",
      statusText: "Unavailable",
      series: [
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      kind: "total-storage",
      title: "Total Storage",
      accent: m.cyan,
      totalBytes: 0,
      usedBytes: 0
    },
    {
      kind: "network",
      title: "Network",
      accent: m.green,
      downloadBps: 0,
      uploadBps: 0
    }
  ],
  hardwareDetails: [{
    key: "cpu",
    title: "CPU",
    subtitle: "No live data",
    accent: m.blue,
    utilizationPercent: 0,
    series: [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    detailRows: [
      {
        label: "Load (1m)",
        value: "Unavailable"
      },
      {
        label: "Frequency",
        value: "Unavailable"
      },
      {
        label: "Temperature",
        value: "Unavailable"
      },
      {
        label: "Uptime",
        value: "Unavailable"
      }
    ]
  }, {
    key: "ram",
    title: "RAM",
    subtitle: "No live data",
    accent: m.purple,
    utilizationPercent: 0,
    series: [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    detailRows: [
      {
        label: "Used",
        value: "Unavailable"
      },
      {
        label: "Total",
        value: "Unavailable"
      },
      {
        label: "Usage",
        value: "Unavailable"
      },
      {
        label: "Swap Used",
        value: "Unavailable"
      }
    ]
  }],
  drives: [],
  storagePools: [],
  dockerProjects: [],
  dockerTotals: {
    totalContainers: 0,
    runningContainers: 0,
    totalProjects: 0,
    onlineProjects: 0
  },
  networkInterfaces: [],
  networkTrafficHistory: [
    {
      timestampLabel: "",
      totalsByInterface: {}
    },
    {
      timestampLabel: "",
      totalsByInterface: {}
    },
    {
      timestampLabel: "",
      totalsByInterface: {}
    },
    {
      timestampLabel: "",
      totalsByInterface: {}
    },
    {
      timestampLabel: "",
      totalsByInterface: {}
    }
  ],
  networkTrafficLines: [],
  cpuCores: [],
  ramBreakdown: [],
  gpuEngines: [],
  gpuStats: [],
  topProcesses: []
}), go = Vr`
  :host {
    --ugreen-bg: #030b17;
    --ugreen-panel: #071424;
    --ugreen-panel-2: #091a2d;
    --ugreen-border: rgba(18, 52, 83, 0.78);
    --ugreen-text: #edf4ff;
    --ugreen-text-dim: #9fb4d1;
    --ugreen-blue: #1bb7ff;
    --ugreen-soft-blue: #72a3ff;
    --ugreen-purple: #ba57ff;
    --ugreen-green: #5cff57;
    --ugreen-yellow: #ffd84d;
    --ugreen-network-down: #5dff59;
    --ugreen-network-up: #b04cff;
    --ugreen-shadow: 0 0 0 1px rgba(14, 79, 122, 0.32), 0 12px 28px rgba(0, 0, 0, 0.26);
    display: block;
  }

  ha-card {
    background:
      radial-gradient(circle at 10% 0%, rgba(11, 98, 167, 0.15), transparent 38%),
      linear-gradient(180deg, #041122 0%, #020b17 100%);
    color: var(--ugreen-text);
    border-radius: 18px;
    border: 1px solid rgba(26, 124, 188, 0.42);
    box-shadow: var(--ugreen-shadow);
    overflow: hidden;
  }

  .card-shell {
    padding: 12px;
  }

  .tile {
    background: linear-gradient(180deg, rgba(7, 20, 36, 0.96) 0%, rgba(5, 16, 29, 0.96) 100%);
    border: 1px solid var(--ugreen-border);
    border-radius: 14px;
    box-shadow: inset 0 0 0 1px rgba(30, 102, 158, 0.1);
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .tile {
    min-width: 0;
    min-height: 118px;
    padding: 11px;
    display: block;
  }

  .tile-identity {
    background:
      radial-gradient(circle at 0% 0%, rgba(17, 183, 255, 0.16), transparent 48%),
      linear-gradient(180deg, rgba(7, 20, 36, 0.98) 0%, rgba(5, 16, 29, 0.96) 100%);
  }

  .tile-body {
    min-height: 94px;
    height: 100%;
    display: grid;
    grid-template-rows: auto 28px 32px auto auto;
    align-content: start;
  }

  .tile-body-identity {
    grid-template-rows: auto 40px 24px auto auto;
  }

  .tile-top {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    margin-bottom: 8px;
  }

  .tile-label {
    min-width: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tile-value {
    font-size: 22px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: -0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    align-self: start;
  }

  .tile-title {
    font-size: 18px;
    line-height: 1.15;
  }

  .tile-secondary {
    font-size: 12px;
    line-height: 1.25;
    color: var(--ugreen-text-dim);
    min-height: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    align-self: start;
  }

  .tile-secondary.success {
    color: var(--ugreen-green);
  }

  .tile-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    min-height: 15px;
    align-self: start;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 10px currentColor;
  }

  .network-lines {
    display: grid;
    gap: 5px;
    min-height: 29px;
  }

  .traffic-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    min-width: 0;
  }

  .traffic-row span {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .traffic-row.down {
    color: var(--ugreen-network-down);
  }

  .traffic-row.up {
    color: var(--ugreen-network-up);
  }

  .progress-bar {
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(33, 57, 94, 0.9), rgba(26, 44, 72, 0.9));
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--progress-color, #63db45), var(--progress-color, #5bd45b));
  }

  .icon {
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
    color: var(--ugreen-soft-blue);
  }

  .icon.accent {
    filter: drop-shadow(0 0 6px currentColor);
  }

  .icon-chip { color: var(--ugreen-soft-blue); }
  .icon-memory { color: var(--ugreen-purple); }
  .icon-gpu { color: var(--ugreen-green); }
  .icon-pulse,
  .icon-database,
  .icon-network,
  .icon-device,
  .icon-clock,
  .icon-monitor,
  .icon-calendar { color: var(--ugreen-soft-blue); }

  @media (max-width: 600px) {
    .card-shell {
      padding: 10px;
    }

    .tile {
      min-height: 104px;
      padding: 9px;
    }

    .tile-value {
      font-size: 18px;
    }

    .tile-title {
      font-size: 15px;
    }

    .tile-label,
    .tile-secondary,
    .tile-status,
    .traffic-row {
      font-size: 10px;
    }
  }
`, or = [
  "B",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB"
], ir = [
  "bps",
  "Kbps",
  "Mbps",
  "Gbps",
  "Tbps"
], Fe = (e, t) => new Intl.NumberFormat("en-US", {
  minimumFractionDigits: t,
  maximumFractionDigits: t
}).format(e), et = (e, t = 0) => `${Fe(e, t)}%`, fo = (e, t = 1) => {
  if (!Number.isFinite(e) || e <= 0) return "0 B";
  const r = Math.min(Math.floor(Math.log(e) / Math.log(1024)), or.length - 1);
  return `${Fe(e / 1024 ** r, r === 0 ? 0 : t)} ${or[r]}`;
}, ot = (e) => fo(e, e >= 1024 ** 4 ? 1 : 0), ar = (e, t = 1) => {
  if (!Number.isFinite(e) || e <= 0) return "0 bps";
  const r = Math.min(Math.floor(Math.log(e) / Math.log(1e3)), ir.length - 1);
  return `${Fe(e / 1e3 ** r, r === 0 ? 0 : t)} ${ir[r]}`;
}, cr = (e) => `${Fe(e, 0)}°C`, Cr = (e, t) => `${ot(e)} / ${ot(t)}`, vo = (e, t) => t > 0 ? e / t * 100 : 0, lr = (e) => e.kind === "cpu" || e.kind === "gpu", bo = (e) => e.kind === "ram", $o = (e) => e.kind === "system-load", be = (e) => Math.max(0, Math.min(1, e)), wo = (e) => {
  const t = e.drives.reduce((s, o) => (o.mediaType === "nvme" ? s.nvme += o.capacityBytes : o.mediaType === "hdd" && (s.sata += o.capacityBytes), s), {
    nvme: 0,
    sata: 0
  }), r = {
    nvme: {
      totalBytes: 0,
      usedBytes: 0
    },
    sata: {
      totalBytes: 0,
      usedBytes: 0
    }
  }, n = [...e.storagePools];
  for (const s of e.storagePools) {
    const o = Bo(s.name, s.layout);
    o && (r[o].totalBytes += s.totalBytes, r[o].usedBytes += s.usedBytes, n.splice(n.indexOf(s), 1));
  }
  for (const s of n) {
    const o = ko(s.totalBytes, t, r);
    r[o].totalBytes += s.totalBytes, r[o].usedBytes += s.usedBytes;
  }
  return r;
}, Bo = (e, t) => {
  const r = `${e} ${t}`.toLowerCase();
  return r.includes("nvme") || r.includes("m.2") || r.includes("ssd") ? "nvme" : r.includes("sata") || r.includes("hdd") ? "sata" : null;
}, ko = (e, t, r) => ["nvme", "sata"].filter((n) => t[n] > 0).map((n) => ({
  media: n,
  distance: Math.abs(t[n] - r[n].totalBytes - e)
})).sort((n, s) => n.distance - s.distance)[0]?.media ?? "sata", dr = (e, t, r, n, s) => {
  const o = n > 0 ? be(vo(s, n) / 100) : 0;
  return {
    id: e,
    label: t,
    icon: "database",
    accent: r,
    value: ot(n),
    secondary: n > 0 ? Cr(s, n) : "Unavailable",
    progress: o
  };
}, xo = (e) => {
  const t = e.networkInterfaces.map((i) => i.name), r = e.networkInterfaces.reduce((i, a) => i + a.downloadBps, 0), n = e.networkInterfaces.reduce((i, a) => i + a.uploadBps, 0), s = e.networkInterfaces.filter((i) => i.status === "up").length, o = e.networkInterfaces.length;
  return {
    id: "network",
    label: "Network State",
    icon: "network",
    accent: m.softBlue,
    value: o > 0 ? `${s}/${o} Up` : "Unavailable",
    secondary: t.length > 0 ? t.join(" | ") : "No interfaces",
    down: ar(r),
    up: ar(n)
  };
}, Po = (e) => {
  switch (e) {
    case "live":
      return {
        label: "Online",
        color: "var(--ugreen-green)"
      };
    case "missing":
      return {
        label: "No Data",
        color: "#ffd84d"
      };
    default:
      return {
        label: "Preview",
        color: "var(--ugreen-soft-blue)"
      };
  }
}, it = (e, t, r) => {
  const n = e.hardwareSummary.filter(lr).find((d) => d.kind === "cpu"), s = e.hardwareSummary.filter(bo).find((d) => d.kind === "ram"), o = e.hardwareSummary.filter(lr).find((d) => d.kind === "gpu"), i = e.hardwareSummary.filter($o).find((d) => d.kind === "system-load"), a = Po(t), c = wo(e), l = [
    {
      id: "cpu",
      label: "CPU",
      icon: "chip",
      accent: m.blue,
      value: et(n?.valuePercent ?? 0),
      secondary: n ? cr(n.temperatureCelsius) : "Unavailable",
      progress: be((n?.valuePercent ?? 0) / 100)
    },
    {
      id: "ram",
      label: "RAM",
      icon: "memory",
      accent: m.purple,
      value: et(s?.valuePercent ?? 0),
      secondary: s ? Cr(s.usedBytes, s.totalBytes) : "Unavailable",
      progress: be((s?.valuePercent ?? 0) / 100)
    },
    {
      id: "gpu",
      label: "GPU",
      icon: "gpu",
      accent: m.green,
      value: o ? et(o.valuePercent) : "N/A",
      secondary: o ? cr(o.temperatureCelsius) : "Unavailable",
      progress: be((o?.valuePercent ?? 0) / 100)
    },
    {
      id: "systemLoad",
      label: "Load",
      icon: "pulse",
      accent: m.softBlue,
      value: i?.valueText ?? "0.00",
      secondary: i?.statusText ?? "Unavailable",
      progress: be((i?.valuePercent ?? 0) / 100)
    },
    dr("nvme", "NVMe Volume", m.cyan, c.nvme.totalBytes, c.nvme.usedBytes),
    dr("sata", "SATA Volume", m.green, c.sata.totalBytes, c.sata.usedBytes),
    xo(e)
  ];
  return {
    title: e.deviceInfo.model,
    statusLabel: a.label,
    statusColor: a.color,
    metricTiles: l
  };
}, ur = (e) => it(yo, "preview", e);
function ye(e, t, r, n) {
  var s = arguments.length, o = s < 3 ? t : n === null ? n = Object.getOwnPropertyDescriptor(t, r) : n, i;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") o = Reflect.decorate(e, t, r, n);
  else for (var a = e.length - 1; a >= 0; a--) (i = e[a]) && (o = (s < 3 ? i(o) : s > 3 ? i(t, r, o) : i(t, r)) || o);
  return s > 3 && o && Object.defineProperty(t, r, o), o;
}
var oe = class extends we {
  constructor(...t) {
    super(...t), this.config = { type: "custom:ugreen-nas-mini-card" }, this.model = ur(), this.history = Xt(), this.dataMode = "preview", this.watchEntityIds = [], this.watchPrefixes = [];
  }
  static {
    this.styles = go;
  }
  set hass(t) {
    const r = this._hass;
    if (!this.shouldRefreshForHassUpdate(r, t)) {
      this._hass = t;
      return;
    }
    this._hass = t, this.requestUpdate("hass", r), this.refreshModel();
  }
  get hass() {
    return this._hass;
  }
  setConfig(t) {
    if (!t || typeof t != "object") throw new Error("Invalid configuration");
    this.config = {
      title: "UGREEN NAS",
      ...t
    }, this.refreshModel();
  }
  getCardSize() {
    return 2;
  }
  render() {
    return V`
      <ha-card>
        <div class="card-shell">
          <section class="metrics">
            ${this.renderIdentityTile()}
            ${this.model.metricTiles.map((t) => this.renderMetricTile(t))}
          </section>
        </div>
      </ha-card>
    `;
  }
  renderIdentityTile() {
    return V`
      <article class="tile tile-identity">
        <div class="tile-body tile-body-identity">
          <div class="tile-top">
            ${this.renderIcon("device", "icon icon-device accent")}
            <div class="tile-label">System</div>
          </div>
          <div class="tile-value tile-title">${this.model.title}</div>
          <div class="tile-status" style=${`color:${this.model.statusColor}`}>
            <span class="status-dot"></span>
            <span>${this.model.statusLabel}</span>
          </div>
        </div>
        ${this.renderProgress(this.model.statusLabel === "Online" ? 1 : this.model.statusLabel === "No Data" ? 0.45 : 0.7, this.model.statusColor)}
      </article>
    `;
  }
  renderMetricTile(t) {
    const r = t.id === "cpu" || t.id === "gpu" || t.id === "systemLoad" ? "tile-secondary success" : "tile-secondary";
    return V`
      <article class="tile">
        <div class="tile-body">
          <div class="tile-top">
            ${this.renderIcon(t.icon, `icon icon-${t.icon} accent`)}
            <div class="tile-label">${t.label}</div>
          </div>

          ${t.value ? V`<div class="tile-value">${t.value}</div>` : k}
          ${t.secondary ? V`<div class=${r}>${t.secondary}</div>` : k}

          ${typeof t.progress == "number" ? this.renderProgress(t.progress, t.accent) : k}
          ${t.down || t.up ? this.renderNetworkRows(t.down, t.up) : k}
        </div>
      </article>
    `;
  }
  renderProgress(t, r) {
    return V`
      <div class="progress-bar" aria-hidden="true">
        <div
          class="progress-fill"
          style=${`width:${Math.max(0, Math.min(1, t)) * 100}%; --progress-color:${r}; box-shadow:0 0 10px ${r}55;`}
        ></div>
      </div>
    `;
  }
  renderNetworkRows(t, r) {
    return V`
      <div class="network-lines">
        ${t ? V`
          <div class="traffic-row down">
            ${this.renderArrowDown()}
            <span>${t}</span>
          </div>
        ` : k}
        ${r ? V`
          <div class="traffic-row up">
            ${this.renderArrowUp()}
            <span>${r}</span>
          </div>
        ` : k}
      </div>
    `;
  }
  refreshModel() {
    const t = Cn(this._hass, this.config, this.history);
    if (!t) {
      if (this.history = Xt(), this.watchEntityIds = [], this.watchPrefixes = [], this._hass?.states) {
        const r = ho();
        r.deviceInfo = {
          ...r.deviceInfo,
          model: this.config.deviceModel ?? r.deviceInfo.model,
          hostname: this.config.host ?? r.deviceInfo.hostname
        }, this.model = it(r, "missing", this.config), this.dataMode = "missing";
      } else
        this.model = ur(this.config), this.dataMode = "preview";
      return;
    }
    this.history = t.history, this.watchEntityIds = t.watchEntityIds, this.watchPrefixes = t.watchPrefixes, this.model = it(t.model, "live", this.config), this.dataMode = "live";
  }
  shouldRefreshForHassUpdate(t, r) {
    const n = t?.states, s = r?.states;
    return !n || !s || this.watchEntityIds.length === 0 && this.watchPrefixes.length === 0 || this.countWatchedEntities(n) !== this.countWatchedEntities(s) ? !0 : this.watchEntityIds.some((o) => n[o] !== s[o]);
  }
  countWatchedEntities(t) {
    let r = 0;
    for (const n of Object.keys(t)) this.watchPrefixes.some((s) => n.startsWith(s)) && (r += 1);
    return r;
  }
  renderArrowDown() {
    return T`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 11.5 10 16l5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  renderArrowUp() {
    return T`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 17V6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 8.5 10 4l5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  renderIcon(t, r) {
    switch (t) {
      case "chip":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3M4 4l2 2M18 18l2 2M20 4l-2 2M4 20l2-2"></path></svg>`;
      case "memory":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"></rect><path d="M7 10v4M11 10v4M15 10v4M19 10v4M5 19v2M9 19v2M13 19v2M17 19v2"></path></svg>`;
      case "gpu":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="9" cy="11" r="2.2"></circle><path d="M16 9.5h2M16 12.5h2M8 18h8"></path></svg>`;
      case "pulse":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.2-6 4 12 2.2-8H22"></path></svg>`;
      case "database":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></svg>`;
      case "network":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="3" width="4" height="4" rx="1"></rect><rect x="3" y="16" width="4" height="4" rx="1"></rect><rect x="17" y="16" width="4" height="4" rx="1"></rect><path d="M12 7v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path></svg>`;
      case "device":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M9 2h6"></path></svg>`;
      case "clock":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path></svg>`;
      case "monitor":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 17v3"></path></svg>`;
      case "calendar":
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 9h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01"></path></svg>`;
      default:
        return T`<svg class=${r} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle></svg>`;
    }
  }
};
ye([Oe()], oe.prototype, "config", void 0);
ye([Oe()], oe.prototype, "model", void 0);
ye([Oe()], oe.prototype, "history", void 0);
ye([Oe()], oe.prototype, "dataMode", void 0);
ye([vr({ attribute: !1 })], oe.prototype, "hass", null);
oe = ye([yn("ugreen-nas-mini-card")], oe);
