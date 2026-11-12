// ../node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, ee = globalThis, te = ee.trustedTypes, ne = te ? te.emptyScript : "", re = ee.reactiveElementPolyfillSupport, ie = (e, t) => e, ae = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ne : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, oe = (e, t) => !l(e, t), se = {
	attribute: !0,
	type: String,
	converter: ae,
	reflect: !1,
	useDefault: !1,
	hasChanged: oe
};
Symbol.metadata ??= Symbol("metadata"), ee.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var h = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = se) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? se;
	}
	static _$Ei() {
		if (this.hasOwnProperty(ie("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(ie("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ie("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
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
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? ae : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? ae : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? oe)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
h.elementStyles = [], h.shadowRootOptions = { mode: "open" }, h[ie("elementProperties")] = /* @__PURE__ */ new Map(), h[ie("finalized")] = /* @__PURE__ */ new Map(), re?.({ ReactiveElement: h }), (ee.reactiveElementVersions ??= []).push("2.1.2");
// ../node_modules/lit-html/lit-html.js
var ce = globalThis, g = (e) => e, le = ce.trustedTypes, ue = le ? le.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, de = "$lit$", _ = `lit$${Math.random().toFixed(9).slice(2)}$`, fe = "?" + _, pe = `<${fe}>`, v = document, me = () => v.createComment(""), he = (e) => e === null || typeof e != "object" && typeof e != "function", ge = Array.isArray, _e = (e) => ge(e) || typeof e?.[Symbol.iterator] == "function", ve = "[ 	\n\f\r]", ye = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, be = /-->/g, xe = />/g, y = RegExp(`>|${ve}(?:([^\\s"'>=/]+)(${ve}*=${ve}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), Se = /'/g, Ce = /"/g, we = /^(?:script|style|textarea|title)$/i, Te = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), b = Te(1), x = Te(2), S = Symbol.for("lit-noChange"), C = Symbol.for("lit-nothing"), Ee = /* @__PURE__ */ new WeakMap(), w = v.createTreeWalker(v, 129);
function De(e, t) {
	if (!ge(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return ue === void 0 ? t : ue.createHTML(t);
}
var Oe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = ye;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === ye ? c[1] === "!--" ? o = be : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = y) : (we.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = y) : o = xe : o === y ? c[0] === ">" ? (o = i ?? ye, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? y : c[3] === "\"" ? Ce : Se) : o === Ce || o === Se ? o = y : o === be || o === xe ? o = ye : (o = y, i = void 0);
		let d = o === y && e[t + 1].startsWith("/>") ? " " : "";
		a += o === ye ? n + pe : l >= 0 ? (r.push(s), n.slice(0, l) + de + n.slice(l) + _ + d) : n + _ + (l === -2 ? t : d);
	}
	return [De(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, ke = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Oe(t, n);
		if (this.el = e.createElement(l, r), w.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = w.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(de)) {
					let t = u[o++], n = i.getAttribute(e).split(_), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Pe : r[1] === "?" ? Fe : r[1] === "@" ? Ie : Ne
					}), i.removeAttribute(e);
				} else e.startsWith(_) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (we.test(i.tagName)) {
					let e = i.textContent.split(_), t = e.length - 1;
					if (t > 0) {
						i.textContent = le ? le.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], me()), w.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], me());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === fe) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(_, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += _.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = v.createElement("template");
		return n.innerHTML = e, n;
	}
};
function Ae(e, t, n = e, r) {
	if (t === S) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = he(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = Ae(e, i._$AS(e, t.values), i, r)), t;
}
var je = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? v).importNode(t, !0);
		w.currentNode = r;
		let i = w.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Me(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Le(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = w.nextNode(), a++);
		}
		return w.currentNode = v, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Me = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = C, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = Ae(this, e, t), he(e) ? e === C || e == null || e === "" ? (this._$AH !== C && this._$AR(), this._$AH = C) : e !== this._$AH && e !== S && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? _e(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== C && he(this._$AH) ? this._$AA.nextSibling.data = e : this.T(v.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = ke.createElement(De(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new je(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Ee.get(e.strings);
		return t === void 0 && Ee.set(e.strings, t = new ke(e)), t;
	}
	k(t) {
		ge(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(me()), this.O(me()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = g(e).nextSibling;
			g(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, Ne = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = C, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = C;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = Ae(this, e, t, 0), a = !he(e) || e !== this._$AH && e !== S, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = Ae(this, r[n + o], t, o), s === S && (s = this._$AH[o]), a ||= !he(s) || s !== this._$AH[o], s === C ? e = C : e !== C && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === C ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Pe = class extends Ne {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === C ? void 0 : e;
	}
}, Fe = class extends Ne {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== C);
	}
}, Ie = class extends Ne {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = Ae(this, e, t, 0) ?? C) === S) return;
		let n = this._$AH, r = e === C && n !== C || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== C && (n === C || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Le = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		Ae(this, e);
	}
}, Re = ce.litHtmlPolyfillSupport;
Re?.(ke, Me), (ce.litHtmlVersions ??= []).push("3.3.3");
var ze = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Me(t.insertBefore(me(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Be = globalThis, Ve = class extends h {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ze(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return S;
	}
};
Ve._$litElement$ = !0, Ve.finalized = !0, Be.litElementHydrateSupport?.({ LitElement: Ve });
var He = Be.litElementPolyfillSupport;
He?.({ LitElement: Ve }), (Be.litElementVersions ??= []).push("4.2.2");
// ../node_modules/@lit/reactive-element/decorators/custom-element.js
var Ue = (e) => (t, n) => {
	n === void 0 ? customElements.define(e, t) : n.addInitializer(() => {
		customElements.define(e, t);
	});
}, We = {
	attribute: !0,
	type: String,
	converter: ae,
	reflect: !1,
	hasChanged: oe
}, Ge = (e = We, t, n) => {
	let { kind: r, metadata: i } = n, a = globalThis.litPropertyMetadata.get(i);
	if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), r === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(n.name, e), r === "accessor") {
		let { name: r } = n;
		return {
			set(n) {
				let i = t.get.call(this);
				t.set.call(this, n), this.requestUpdate(r, i, e, !0, n);
			},
			init(t) {
				return t !== void 0 && this.C(r, void 0, e, t), t;
			}
		};
	}
	if (r === "setter") {
		let { name: r } = n;
		return function(n) {
			let i = this[r];
			t.call(this, n), this.requestUpdate(r, i, e, !0, n);
		};
	}
	throw Error("Unsupported decorator location: " + r);
};
function Ke(e) {
	return (t, n) => typeof n == "object" ? Ge(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
// ../node_modules/@lit/reactive-element/decorators/state.js
function qe(e) {
	return Ke({
		...e,
		state: !0,
		attribute: !1
	});
}
// ../detailed/src/theme.ts
var T = {
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
}, Je = [
	T.green,
	T.cyan,
	T.purple,
	T.softBlue
], Ye = (e) => Je[e % Je.length] ?? T.green, Xe = /^sensor\.ugos_bridge_host_(.+?)_cpu_usage_percent$/, Ze = /^sensor\.ugos_bridge_project_(.+?)_cpu_usage_percent$/, Qe = /^sensor\.([a-z0-9_]+)_\1_cpu(?:_|$)/, $e = /^(?:sensor|binary_sensor)\.ugos_bridge_host_(.+?)_(?:array|bond|container|cooling|disk|filesystem|gpu|health|network|process|project|software|ups|vm)_/, et = /^(?:container|process|project|vm)(?:_|$)/, tt = /^(?:container|project|vm)_/, nt = [
	"compose_project_",
	"docker_container_",
	"project_",
	"virtual_machine_",
	"virtual_machines_"
], rt = /^(?:sensor|binary_sensor)\.([a-z0-9_]+)_(?:array|bond|cooling|disk|filesystem|gpu|health|network|software|ups)_[a-z0-9][a-z0-9_]*_[a-z0-9_]+(?:_\d+)?$/, it = /^(?:sensor|binary_sensor)\.ugos_bridge_container_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/, at = /^(?:sensor|binary_sensor)\.ugos_bridge_vm_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/, ot = /^sensor\.ugos_bridge_process_(.+?)_(process_count|cpu_usage_percent|memory_usage_bytes|cpu_time_seconds)$/, st = {
	cpu: "cpu_usage_percent",
	load1: "load_1",
	cpufreq: "cpu_frequency_mhz",
	memoryUsedBytes: "memory_used_bytes",
	memoryUsedPercent: "memory_used_percent",
	swapUsedPercent: "swap_used_percent",
	uptime: "uptime_seconds"
}, ct = /* @__PURE__ */ new WeakMap(), lt = /* @__PURE__ */ new WeakMap(), ut = (e) => {
	let t = ct.get(e);
	return t || (t = {
		prefixEntries: /* @__PURE__ */ new Map(),
		computedResults: /* @__PURE__ */ new Map(),
		resolutionResults: /* @__PURE__ */ new Map(),
		booleanResults: /* @__PURE__ */ new Map()
	}, ct.set(e, t)), t;
}, E = (e) => {
	let t = ut(e);
	return t.keys ||= Object.keys(e), t.keys;
}, D = (e) => {
	let t = ut(e);
	return t.entries ||= Object.entries(e), t.entries;
}, O = (e) => {
	let t = ut(e);
	return t.values ||= Object.values(e), t.values;
}, dt = (e, t) => {
	let n = ut(e), r = n.prefixEntries.get(t);
	if (r) return r;
	let i = D(e).filter(([e]) => e.startsWith(t));
	return n.prefixEntries.set(t, i), i;
}, k = (e, t) => Array.from(new Map(t.flatMap((t) => dt(e, t))).entries()), A = (e, t) => t.find((t) => qn(e[t])), j = (e, t, n, r = "sensor.") => {
	let i = J(n);
	return D(e).filter(([e, n]) => {
		if (!e.startsWith(r)) return !1;
		let a = e.toLowerCase();
		return J(B(n, "name") ?? "") === i || a.includes(`_${t}_${i}_`) || a.includes(`ugos_bridge_${t}_${i}_`);
	});
}, M = (e, t) => L(e, t) ?? L(e, {
	...t,
	unit: void 0
}), N = (e, t, n) => {
	let r = ut(e), i = r.computedResults.get(t);
	if (i !== void 0) return i;
	let a = n();
	return r.computedResults.set(t, a), a;
}, P = (e, t, n) => {
	let r = ut(e);
	if (r.resolutionResults.has(t)) return r.resolutionResults.get(t);
	let i = n();
	return r.resolutionResults.set(t, i), i;
}, ft = (e) => {
	if (!e) return;
	let t = lt.get(e), n = typeof e.attributes.friendly_name == "string" ? e.attributes.friendly_name : "", r = tr(typeof e.attributes.unit_of_measurement == "string" ? e.attributes.unit_of_measurement : void 0);
	return !t || t.friendlyName !== n || t.unit !== r ? (t = {
		friendlyName: n,
		friendlyNameLower: n.toLowerCase(),
		state: e.state,
		unit: r
	}, lt.set(e, t)) : t.state !== e.state && (t.state = e.state, t.parsedNumber = void 0, t.textState = void 0), t;
}, pt = () => ({ samples: [] }), mt = (e, t, n) => {
	let r = e?.states;
	if (!r) return null;
	ct.delete(r);
	let i = Vt(r, t?.host);
	if (!i) return null;
	let a = `ugos_bridge_host_${i}`, o = F(r, i, "cpu"), s = F(r, i, "memoryUsedBytes"), c = sn(r, i, "cpu") ?? 0, l = cn(r, i), u = l.value, d = sn(r, i, "cpufreq"), f = sn(r, i, "uptime") ?? 0, p = sn(r, i, "memoryUsedBytes") ?? 0, m = sn(r, i, "memoryUsedPercent") ?? 0, ee = sn(r, i, "swapUsedPercent") ?? 0, te = Gt(p, m, t?.memoryTotalBytes), ne = Ut(r, i, t?.host), re = Ct(r, o), ie = wt(r, s, te, p), ae = Hn(r, i), oe = Dt(ae, r[o ?? ""]), se = It(r, i), h = kn(se, [
		"cpu",
		"package",
		"soc",
		"core",
		"tctl"
	]), ce = Bt(r, i), g = an(r, i, a)[0], le = g === void 0 ? void 0 : bn(r, i, a, g, "busy"), ue = g === void 0 ? void 0 : bn(r, i, a, g, "current"), de = g === void 0 ? void 0 : bn(r, i, a, g, "max"), _ = g === void 0 ? void 0 : vr(r, i, a, g), fe = g === void 0 ? void 0 : z(r, ue), pe = g === void 0 ? void 0 : z(r, de), v = kn(se, [
		"gpu",
		"graphics",
		"igpu",
		"intel"
	]), me = g === void 0 ? [] : xn(r, i, a, g, [
		le,
		ue,
		de
	]), he = Tt(r, me), ge = Et(r, me), _e = Kt(Nt(r, i), t?.storageFilesystems), ve = Yt(r, i, a).map((e) => gt(r, i, ne, e)).filter((e) => e !== null).sort((e, t) => e.name.localeCompare(t.name)), ye = _t(Pt(r, i), _e, ve), be = Jt(ae), xe = Array.from(new Set(be)).map((e) => vt(ae, e)).filter((e) => e !== null).sort((e, t) => t.cpuPercent - e.cpuPercent || e.title.localeCompare(t.title)), y = Zt(r, i, a), Se = Qt(r, i, a), Ce = qt($t(Array.from(/* @__PURE__ */ new Set([...y, ...Se])).sort(), t?.networkInterfaces), t?.networkInterfaces), we = Ce.map((e) => y.includes(e) ? jt(r, i, e, se) : Mt(r, i, e, se)).filter((e) => e !== null).sort((e, t) => e.name.localeCompare(t.name)), Te = Ce.filter((e) => y.includes(e)), b = Te.length > 0 ? Te : y, x = b.reduce((e, t) => e + (z(r, gn(r, i, t, "rx")) ?? 0) * 8, 0), S = b.reduce((e, t) => e + (z(r, gn(r, i, t, "tx")) ?? 0) * 8, 0), C = en(Ce), Ee = Object.fromEntries(C.map((e) => [e, nn(r, i, e)])), w = (o ? r[o]?.last_updated : void 0) ?? (o ? r[o]?.last_changed : void 0) ?? `${c}:${m}:${_ ?? 0}:${x}:${S}:${JSON.stringify(Ee)}`, De = En(n, {
		key: w,
		timestampLabel: Lr(w),
		cpuPercent: c,
		ramPercent: m,
		gpuPercent: _ ?? 0,
		load1: u,
		networkBpsBySlug: Ee
	}), Oe = Dn(De.samples.map((e) => e.cpuPercent), c, 12), ke = Dn(De.samples.map((e) => e.ramPercent), m, 12), Ae = Dn(De.samples.map((e) => e.gpuPercent), _ ?? 0, 12), je = Dn(De.samples.map((e) => e.load1), u, 12), Me = On(De.samples, C, Ee), Ne = C.map((e, t) => ({
		key: e,
		label: Vr(e),
		color: rn(e, t),
		currentBps: Ee[e] ?? 0,
		series: Me.map((t) => t.totalsByInterface[e] ?? 0)
	})), Pe = [
		{
			kind: "cpu",
			title: "CPU",
			accent: T.blue,
			valuePercent: c,
			temperatureCelsius: h ?? 0,
			fanSpeeds: ce.cpu.length > 0 ? ce.cpu : void 0,
			series: Oe
		},
		{
			kind: "ram",
			title: "RAM",
			accent: T.purple,
			valuePercent: m,
			usedBytes: p,
			totalBytes: te,
			series: ke
		},
		..._ === void 0 ? [] : [{
			kind: "gpu",
			title: "GPU",
			accent: T.green,
			valuePercent: _,
			temperatureCelsius: v ?? 0,
			series: Ae
		}],
		{
			kind: "system-load",
			title: "System Load",
			accent: T.softBlue,
			value: u,
			valuePercent: l.valuePercent,
			valueText: l.valueText,
			unit: l.unit,
			statusText: l.statusText,
			fanSpeeds: ce.system.length > 0 ? ce.system : void 0,
			series: je
		},
		{
			kind: "network",
			title: "Network",
			accent: T.green,
			downloadBps: x,
			uploadBps: S
		}
	], Fe = ht({
		cpuFans: ce.cpu,
		cpuFrequencyMHz: d,
		cpuPercent: c,
		cpuSeries: Oe,
		cpuTemperature: h,
		gpuBusyPercent: _,
		gpuCurrentMHz: fe,
		gpuMaxMHz: pe,
		gpuSeries: Ae,
		gpuTemperature: v,
		load1: u,
		loadValueText: l.valueText,
		memoryTotalBytes: te,
		memoryUsedBytes: p,
		memoryUsedPercent: m,
		ramSeries: ke,
		swapUsedPercent: ee,
		uptimeSeconds: f
	}), Ie = Un(i);
	return {
		history: De,
		watchEntityIds: Wn(r, Ie, t?.ipEntity, i),
		watchPrefixes: Ie,
		model: {
			deviceInfo: {
				model: t?.deviceModel ?? "UGREEN NAS",
				ugosVersion: t?.ugosVersion ?? "Unavailable",
				hostname: ne,
				ipAddress: Wt(r, t),
				uptimeSeconds: f,
				lastUpdated: Rr(w)
			},
			hardwareSummary: Pe,
			hardwareDetails: Fe,
			drives: ve,
			storagePools: ye,
			dockerProjects: xe,
			dockerTotals: {
				totalContainers: xe.reduce((e, t) => e + t.totalContainers, 0),
				runningContainers: xe.reduce((e, t) => e + t.runningContainers, 0),
				totalProjects: xe.length,
				onlineProjects: xe.filter((e) => e.status === "up").length
			},
			networkInterfaces: we,
			networkTrafficHistory: Me,
			networkTrafficLines: Ne,
			cpuCores: re,
			ramBreakdown: ie,
			gpuEngines: he,
			gpuStats: ge,
			topProcesses: oe
		}
	};
}, ht = ({ cpuFans: e, cpuFrequencyMHz: t, cpuPercent: n, cpuSeries: r, cpuTemperature: i, gpuBusyPercent: a, gpuCurrentMHz: o, gpuMaxMHz: s, gpuSeries: c, gpuTemperature: l, load1: u, loadValueText: d, memoryTotalBytes: f, memoryUsedBytes: p, memoryUsedPercent: m, ramSeries: ee, swapUsedPercent: te, uptimeSeconds: ne }) => {
	let re = [{
		key: "cpu",
		title: "CPU",
		subtitle: "System Processor",
		accent: T.blue,
		utilizationPercent: n,
		series: r,
		detailRows: [
			{
				label: "Load (1m)",
				value: d
			},
			{
				label: "Frequency",
				value: t ? `${Math.round(t)} MHz` : "Unavailable"
			},
			{
				label: "Temperature",
				value: i === void 0 ? "Unavailable" : `${Math.round(i)}\u00B0C`
			},
			...e.map((e) => ({
				label: e.label,
				value: `${Math.round(e.rpm)} RPM`
			})),
			{
				label: "Uptime",
				value: zr(ne)
			}
		]
	}, {
		key: "ram",
		title: "RAM",
		subtitle: "System Memory",
		accent: T.purple,
		utilizationPercent: m,
		series: ee,
		detailRows: [
			{
				label: "Used",
				value: Br(p)
			},
			{
				label: "Total",
				value: Br(f)
			},
			{
				label: "Usage",
				value: `${m.toFixed(m >= 10 ? 1 : 2)}%`
			},
			{
				label: "Swap Used",
				value: `${te.toFixed(te >= 10 ? 1 : 2)}%`
			}
		]
	}];
	return a !== void 0 && re.push({
		key: "gpu",
		title: "GPU",
		subtitle: "Integrated Graphics",
		accent: T.green,
		utilizationPercent: a,
		series: c,
		detailRows: [
			{
				label: "Current",
				value: o ? `${Math.round(o)} MHz` : "Unavailable"
			},
			{
				label: "Max",
				value: s ? `${Math.round(s)} MHz` : "Unavailable"
			},
			{
				label: "Temperature",
				value: l === void 0 ? "Unavailable" : `${Math.round(l)}\u00B0C`
			},
			{
				label: "Source",
				value: "UGOS Bridge MQTT"
			}
		]
	}), re;
}, gt = (e, t, n, r) => {
	let i = dn(e, t, r, "size"), a = z(e, i), o = z(e, dn(e, t, r, "temperature")), s = z(e, dn(e, t, r, "read")), c = z(e, dn(e, t, r, "write")), l = z(e, dn(e, t, r, "busy")), u = Jn(e, fn(e, t, r, "model")), d = dr(Jn(e, fn(e, t, r, "type")));
	if (a === void 0 && o === void 0 && s === void 0 && c === void 0 && l === void 0 && u === void 0 && d === void 0) return null;
	let f = ur(u), p = B(e[i ?? ""], "name"), m = yr(e[i ?? ""], "Size", n) ?? p ?? Fr(r);
	return {
		name: d === "hdd" ? `${f ?? m} ${(p ?? r).toUpperCase()}` : f ?? m,
		model: d ? d.toUpperCase() : o === void 0 ? "Disk" : "Physical Disk",
		capacityBytes: a ?? 0,
		temperatureCelsius: o,
		readBytesPerSecond: s,
		writeBytesPerSecond: c,
		busyPercent: l,
		status: jn(o),
		mediaType: d,
		diskSlug: r,
		deviceName: p,
		deviceModel: f ?? void 0
	};
}, _t = (e, t, n) => {
	if (e.length === 0) return t.map((e, t) => ({
		key: e.slug,
		name: pr(Pr(e.slug)),
		layout: e.readOnly ? "Filesystem | Read-only" : "Filesystem",
		status: e.readOnly ? "warning" : "healthy",
		usedBytes: e.usedBytes,
		totalBytes: e.totalBytes,
		accent: Ye(t)
	}));
	let r = [...t];
	return e.map((t, i) => {
		let a = r.findIndex((e) => Math.abs(e.totalBytes - t.sizeBytes) / Math.max(t.sizeBytes, 1) < .05), o = a >= 0 ? r.splice(a, 1)[0] : void 0, s = mr(t, n), c = o ? pr(Pr(o.slug)) : void 0, l = fr(t.level), u = At(t.members, n), d = u.length === 0 && e.length === 1 ? n.map((e) => e.diskSlug).filter((e) => !!e) : u;
		return {
			key: t.slug,
			name: s ?? c ?? t.name,
			layout: [l, c].filter(Boolean).join(" | ") || `${t.slug.toUpperCase()} Array`,
			driveCountText: hr(t.activeDisks, t.totalDisks),
			status: t.degradedDisks > 0 ? "degraded" : o?.readOnly ? "warning" : "healthy",
			usedBytes: o?.usedBytes ?? 0,
			totalBytes: o?.totalBytes ?? t.sizeBytes,
			accent: Ye(i),
			driveSlugs: d
		};
	});
}, vt = (e, t) => {
	let n = wn(e, t), r = Cn(e, t, "cpu"), i = e[n ?? ""], a = V(i, "cpu_usage_percent") ?? z(e, r), o = V(i, "memory_usage_bytes") ?? z(e, Cn(e, t, "memory")), s = V(i, "total_containers") ?? z(e, Cn(e, t, "total")), c = V(i, "running_containers") ?? z(e, Cn(e, t, "running"));
	if (a === void 0 || o === void 0 || s === void 0 || c === void 0) return null;
	let l = yt(t, xt(e, t, n ?? r)), u = bt(t, o, l);
	return {
		key: t,
		title: _r(B(i, "project") ?? yr(i, "CPU", "") ?? yr(e[r ?? ""], "CPU", "") ?? t.split("_").filter(Boolean).map(Ir).join(" ")),
		cpuPercent: a,
		memoryBytes: u,
		runningContainers: Math.round(c),
		totalContainers: Math.round(s),
		status: c <= 0 ? "down" : c < s ? "partial" : "up",
		containers: l
	};
}, yt = (e, t) => e === "virtual_machines" ? t.map((e) => e.running ? e : {
	...e,
	memoryBytes: 0
}) : t, bt = (e, t, n) => e !== "virtual_machines" || n.length === 0 ? t : n.reduce((e, t) => e + (t.running ? t.memoryBytes : 0), 0), xt = (e, t, n) => {
	let r = H(e[n ?? ""], "containers");
	if (r.length > 0) return r.map((e, n) => St(e, t, n)).filter((e) => e !== null).sort((e, t) => Number(t.running) - Number(e.running) || t.cpuPercent - e.cpuPercent || t.memoryBytes - e.memoryBytes || e.name.localeCompare(t.name));
	let i = /* @__PURE__ */ new Map();
	for (let [n, r] of D(e)) {
		if (!qn(r)) continue;
		let e = it.exec(n) ?? at.exec(n), a = Er(r), o = e?.[2] ?? a?.metric, s = B(r, "container"), c = Tr(B(r, "project_slug") ?? B(r, "project")), l = B(r, "image"), u = B(r, "status"), d = B(r, "state"), f = Yn(r, "running");
		if (!(s || l !== void 0 || u !== void 0 || d !== void 0 || f !== void 0 || V(r, "memory_current_bytes") !== void 0 || V(r, "memory_limit_bytes") !== void 0 || o !== void 0)) continue;
		let p = a?.key ?? J(s ?? B(r, "container_slug") ?? B(r, "container_id") ?? e?.[1] ?? n), m = i.get(p) ?? { key: p };
		m.projectSlug = c ?? m.projectSlug ?? Ar(p, r, t), m.name = s ?? m.name ?? a?.name, m.image = m.image ?? l, m.status = m.status ?? u, m.state = m.state ?? d ?? (o === "running" ? Or(r) : void 0), m.memoryCurrentBytes = m.memoryCurrentBytes ?? V(r, "memory_current_bytes"), m.memoryLimitBytes = m.memoryLimitBytes ?? V(r, "memory_limit_bytes"), m.cpuPercent = V(r, "cpu_usage_percent") ?? (o === "cpu_usage_percent" ? G(r.state) : void 0) ?? m.cpuPercent ?? 0, m.memoryBytes = V(r, "memory_usage_bytes") ?? (o === "memory_usage_bytes" ? G(r.state) : void 0) ?? m.memoryBytes ?? 0, m.running = f ?? (o === "running" ? kr(r, m.state) : void 0) ?? m.running, i.set(p, m);
	}
	return Array.from(i.values()).filter((e) => e.projectSlug === void 0 ? jr(e, t) : e.projectSlug === t).map((e) => ({
		key: e.key,
		name: e.name ?? Fr(e.key),
		image: e.image ?? "Unknown",
		status: e.status ?? "Unavailable",
		state: e.state ?? "unknown",
		running: e.running ?? !1,
		cpuPercent: e.cpuPercent ?? 0,
		memoryBytes: e.memoryBytes ?? 0,
		memoryCurrentBytes: e.memoryCurrentBytes,
		memoryLimitBytes: e.memoryLimitBytes
	})).sort((e, t) => Number(t.running) - Number(e.running) || t.cpuPercent - e.cpuPercent || t.memoryBytes - e.memoryBytes || e.name.localeCompare(t.name));
}, St = (e, t, n) => {
	let r = Tr(U(e, [
		"project_slug",
		"project",
		"ProjectSlug",
		"Project"
	]));
	if (r !== void 0 && r !== t) return null;
	let i = U(e, [
		"name",
		"container",
		"Name",
		"Container"
	]), a = U(e, [
		"container_slug",
		"key",
		"ContainerSlug",
		"Key"
	]) ?? J(i ?? U(e, ["container_id", "ContainerID"]) ?? `container_${n}`);
	return {
		key: a,
		name: i ?? Fr(a),
		image: U(e, ["image", "Image"]) ?? "Unknown",
		status: U(e, ["status", "Status"]) ?? "Unavailable",
		state: U(e, ["state", "State"]) ?? "unknown",
		running: Qn(e, ["running", "Running"]) ?? U(e, ["state", "State"])?.toLowerCase() === "running",
		cpuPercent: W(e, [
			"cpu_usage_percent",
			"cpuPercent",
			"CPUUsagePercent",
			"CPUPercent"
		]) ?? 0,
		memoryBytes: W(e, [
			"memory_usage_bytes",
			"memoryBytes",
			"MemoryUsageBytes",
			"MemoryBytes"
		]) ?? 0,
		memoryCurrentBytes: W(e, [
			"memory_current_bytes",
			"memoryCurrentBytes",
			"MemoryCurrentBytes"
		]),
		memoryLimitBytes: W(e, [
			"memory_limit_bytes",
			"memoryLimitBytes",
			"MemoryLimitBytes"
		])
	};
}, Ct = (e, t) => {
	let n = [];
	return H(e[t ?? ""], "cpu_cores").forEach((e, t) => {
		let r = U(e, ["name"]) ?? `cpu${t}`, i = W(e, ["usage_percent", "UsagePercent"]);
		i !== void 0 && n.push({
			key: J(r) || `cpu_${t}`,
			name: xr(r),
			usagePercent: i,
			currentMHz: W(e, ["current_mhz", "CurrentMHz"]),
			minMHz: W(e, ["min_mhz", "MinMHz"]),
			maxMHz: W(e, ["max_mhz", "MaxMHz"]),
			governor: U(e, ["governor", "Governor"])
		});
	}), n.sort(Sr);
}, wt = (e, t, n, r) => {
	let i = e[t ?? ""], a = V(i, "memory_total_bytes") ?? n, o = V(i, "memory_used_bytes") ?? r, s = V(i, "memory_buffers_bytes"), c = V(i, "memory_cached_bytes"), l = V(i, "swap_used_bytes"), u = V(i, "swap_total_bytes");
	return [
		{
			key: "total",
			label: "Total",
			valueBytes: a
		},
		{
			key: "used",
			label: "Used",
			valueBytes: o,
			totalBytes: a
		},
		...s === void 0 ? [] : [{
			key: "buffers",
			label: "Buffers",
			valueBytes: s,
			totalBytes: a
		}],
		...c === void 0 ? [] : [{
			key: "cached",
			label: "Cached",
			valueBytes: c,
			totalBytes: a
		}],
		...l === void 0 ? [] : [{
			key: "swap_used",
			label: "Swap Used",
			valueBytes: l,
			totalBytes: u
		}],
		...u === void 0 ? [] : [{
			key: "swap_total",
			label: "Swap Total",
			valueBytes: u
		}]
	];
}, Tt = (e, t) => {
	let n = /* @__PURE__ */ new Map();
	for (let r of t) H(e[r], "engines").forEach((e, t) => {
		let r = U(e, ["name", "Name"]), i = W(e, ["busy_percent", "BusyPercent"]);
		if (!r || i === void 0) return;
		let a = J(r) || `engine_${t}`, o = {
			key: a,
			label: Cr(r),
			busyPercent: i,
			semaPercent: W(e, ["sema_percent", "SemaPercent"]),
			waitPercent: W(e, ["wait_percent", "WaitPercent"])
		}, s = n.get(a);
		(!s || o.busyPercent > s.busyPercent) && n.set(a, o);
	});
	return Array.from(n.values()).sort((e, t) => t.busyPercent - e.busyPercent || e.label.localeCompare(t.label));
}, Et = (e, t) => {
	let n = /* @__PURE__ */ new Map();
	for (let r of t) H(e[r], "stats").forEach((e, t) => {
		let r = W(e, ["value", "Value"]);
		if (r === void 0) return;
		let i = U(e, ["key", "Key"]) ?? `stat_${t}`;
		n.set(i, {
			key: i,
			label: U(e, ["label", "Label"]) ?? wr(i),
			value: r,
			unit: U(e, ["unit", "Unit"])
		});
	});
	return Array.from(n.values());
}, Dt = (e, t) => {
	let n = H(t, "top_processes").map((e, t) => Ot(e, t)).filter((e) => e !== null);
	if (n.length > 0) return kt(n);
	let r = /* @__PURE__ */ new Map();
	for (let [t, n] of D(e)) {
		let e = ot.exec(t), i = e?.[2], a = G(n.state), o = B(n, "name"), s = V(n, "process_count"), c = V(n, "cpu_time_seconds"), l = V(n, "cpu_usage_percent"), u = V(n, "memory_usage_bytes");
		if (!(s !== void 0 || c !== void 0 || o !== void 0 && br(n).includes("process") && l !== void 0 && u !== void 0 || e !== null)) continue;
		let d = J(o ?? e?.[1] ?? t), f = r.get(d) ?? {
			key: d,
			name: o ?? yr(n, "", "") ?? Fr(e?.[1] ?? d),
			processCount: 0,
			cpuPercent: 0,
			memoryBytes: 0
		};
		f.name = o ?? f.name, f.processCount = Math.round(s ?? (i === "process_count" ? a : void 0) ?? f.processCount), f.cpuPercent = l ?? (i === "cpu_usage_percent" ? a : void 0) ?? f.cpuPercent, f.memoryBytes = u ?? (i === "memory_usage_bytes" ? a : void 0) ?? f.memoryBytes, f.cpuTimeSeconds = c ?? (i === "cpu_time_seconds" ? a : void 0) ?? f.cpuTimeSeconds, r.set(d, f);
	}
	return kt(Array.from(r.values()));
}, Ot = (e, t) => {
	let n = U(e, ["name", "Name"]), r = W(e, [
		"cpu_usage_percent",
		"cpu_percent",
		"CPUPercent"
	]), i = W(e, [
		"memory_usage_bytes",
		"memory_bytes",
		"MemoryBytes"
	]);
	if (!n && r === void 0 && i === void 0) return null;
	let a = J(n ?? `process_${t}`);
	return {
		key: a,
		name: n ?? Fr(a),
		processCount: Math.round(W(e, ["process_count", "ProcessCount"]) ?? 0),
		cpuPercent: r ?? 0,
		memoryBytes: i ?? 0,
		cpuTimeSeconds: W(e, ["cpu_time_seconds", "CPUTimeSeconds"])
	};
}, kt = (e) => e.sort((e, t) => t.cpuPercent - e.cpuPercent || t.memoryBytes - e.memoryBytes || t.processCount - e.processCount || e.name.localeCompare(t.name)).slice(0, 10), At = (e, t) => {
	if (e.length === 0) return [];
	let n = /* @__PURE__ */ new Map();
	return t.filter((e) => !!e.diskSlug).forEach((e) => {
		let t = e.diskSlug;
		for (let r of [t, e.deviceName ?? ""].flatMap(Nr)) n.set(r, t);
	}), Array.from(new Set(e.flatMap((e) => Nr(e)).map((e) => n.get(e)).filter((e) => !!e)));
}, jt = (e, t, n, r) => {
	let i = gn(e, t, n, "rx"), a = gn(e, t, n, "tx"), o = z(e, i), s = z(e, a), c = z(e, gn(e, t, n, "speed")), l = _n(e, t, n);
	return o === void 0 && s === void 0 && c === void 0 && !l ? null : {
		name: Vr(n),
		status: er(e[l ?? ""]) ? "up" : "down",
		linkSpeedMbps: c ?? void 0,
		temperatureCelsius: An(r, n),
		downloadBps: (o ?? 0) * 8,
		uploadBps: (s ?? 0) * 8
	};
}, Mt = (e, t, n, r) => {
	let i = z(e, vn(e, t, n, "speed")), a = yn(e, t, n), o = nn(e, t, n);
	return i === void 0 && !a ? null : {
		name: Vr(n),
		status: er(e[a ?? ""]) ? "up" : "down",
		linkSpeedMbps: i ?? void 0,
		temperatureCelsius: An(r, n),
		downloadBps: o / 2,
		uploadBps: o / 2
	};
}, Nt = (e, t) => Xt(e, t).map((n) => {
	let r = pn(e, t, n, "used"), i = pn(e, t, n, "free"), a = z(e, r), o = z(e, i);
	return a === void 0 || o === void 0 ? null : {
		slug: n,
		name: yr(e[r ?? ""], "Used", "") ?? Pr(n),
		usedBytes: a,
		freeBytes: o,
		totalBytes: a + o,
		readOnly: er(e[mn(e, t, n) ?? ""])
	};
}).filter((e) => e !== null).sort((e, t) => e.name.localeCompare(t.name)), Pt = (e, t) => {
	let n = on(e, t), r = [];
	for (let i of n) {
		let n = I(e, t, i, "size"), a = z(e, n), o = z(e, I(e, t, i, "degraded")) ?? 0, s = z(e, I(e, t, i, "active")), c = z(e, I(e, t, i, "total")), l = z(e, I(e, t, i, "sync")), u = hn(e, t, i, "level"), d = Jn(e, u);
		if (a === void 0 && s === void 0 && c === void 0 && l === void 0 && d === void 0) continue;
		let f = Zn([
			e[n ?? ""],
			e[u ?? ""],
			e[I(e, t, i, "active") ?? ""],
			e[I(e, t, i, "total") ?? ""],
			e[I(e, t, i, "degraded") ?? ""]
		], "members");
		r.push({
			slug: i,
			name: yr(e[n ?? ""], "Size", "") ?? yr(e[u ?? ""], "Level", "") ?? i.toUpperCase(),
			sizeBytes: a ?? 0,
			degradedDisks: Math.round(o),
			activeDisks: s === void 0 ? void 0 : Math.round(s),
			totalDisks: c === void 0 ? void 0 : Math.round(c),
			syncPercent: l,
			level: d,
			members: f
		});
	}
	return r.sort((e, t) => e.name.localeCompare(t.name));
}, Ft = (e, t) => N(e, `hostRootEntries:${t}`, () => D(e).filter(([e]) => Gn(e, t))), It = (e, t) => N(e, `temperatures:${t}`, () => {
	let n = [
		`sensor.ugos_bridge_host_${t}_`,
		`sensor.${t}_`,
		"sensor.ugos_bridge_disk_",
		"sensor.ugos_bridge_gpu_"
	];
	return D(e).filter(([e, t]) => e.startsWith("sensor.") && n.some((t) => e.startsWith(t)) && (e.endsWith("_temperature_celsius") || K(t, ["temperature"]))).map(([e, t]) => {
		let n = G(t.state);
		return n === void 0 ? null : {
			entityId: e,
			label: `${q(t)} ${e}`.trim().toLowerCase(),
			value: n
		};
	}).filter((e) => e !== null);
}), Lt = (e, t) => {
	if (!t || !e.startsWith("sensor.")) return !1;
	let n = nr(t)?.toLowerCase();
	return n !== void 0 && n !== "rpm" ? !1 : n === "rpm" || /_fan_speed(?:_rpm)?(?:_\d+)?$/.test(e) || /\bfan speed\b/i.test(q(t)) || Object.hasOwn(t.attributes, "fan_speed_rpm");
}, Rt = (e, t, n) => {
	let r = B(t, "device_type");
	if (r !== void 0 && r.toLowerCase() !== "host") return !1;
	let i = B(t, "host");
	if (i !== void 0) return J(i) === n;
	let a = /^sensor\.ugos_bridge_host_(.+?)_sensor_/.exec(e)?.[1] ?? /^sensor\.(?:ugos_bridge_host_)?(.+?)_health_/.exec(e)?.[1];
	if (a !== void 0) return a === n;
	let o = J(q(t)), s = /^(.+?)_health_/.exec(o)?.[1];
	if (s !== void 0) return s === n;
	let c = /^(?:sensor_|cooling_|(?:cpu|sys(?:tem)?|chassis|case)_?fan(?:_|\d|$))/;
	return [e.replace(/^sensor\.(?:ugos_bridge_host_)?/, ""), o].some((e) => {
		if (!e.startsWith(`${n}_`)) return !1;
		let t = e.slice(n.length + 1).replace(RegExp(`^${Y(n)}_`), "");
		return c.test(t);
	});
}, zt = (e) => {
	let t = J(e), n = /(?:^|_)cpu_?fan(?:_?(\d+))?(?:_|$)/.exec(t);
	if (n) return {
		group: "cpu",
		label: `CPU Fan${n[1] ? ` ${n[1]}` : ""}`
	};
	let r = /(?:^|_)(sys(?:tem)?|chassis|case)_?fan(?:_?(\d+))?(?:_|$)/.exec(t);
	if (r) return {
		group: "system",
		label: `${r[1] === "chassis" ? "Chassis" : r[1] === "case" ? "Case" : "System"} Fan${r[2] ? ` ${r[2]}` : ""}`
	};
}, Bt = (e, t) => {
	let n = {
		cpu: [],
		system: []
	};
	for (let [r, i] of D(e)) {
		if (!Lt(r, i) || !Rt(r, i, t)) continue;
		let e = G(i.state.trim());
		if (e === void 0 || e < 0) continue;
		let a = [
			B(i, "label"),
			B(i, "name"),
			B(i, "sensor"),
			q(i),
			r
		].map((e) => e ? zt(e) : void 0).find((e) => e !== void 0);
		a && n[a.group].push({
			key: r,
			label: a.label,
			rpm: e
		});
	}
	for (let e of Object.values(n)) e.sort((e, t) => e.label.localeCompare(t.label, "en", { numeric: !0 }) || e.key.localeCompare(t.key));
	return n;
}, Vt = (e, t) => N(e, `hostSlug:${t ?? ""}`, () => {
	if (t) {
		let n = Ht(t);
		if (In(e, n) || Ln(e, n)) return n;
	}
	let n = Rn(e), r = n[0];
	if (!r) return null;
	if (!t) return n.find((t) => !zn(e, t)) ?? r;
	let i = Ht(t);
	return n.find((e) => e === i) ?? r;
}), Ht = (e) => {
	let t = J(e);
	for (let e of ["sensor_", "binary_sensor_"]) if (t.startsWith(e)) {
		t = t.slice(e.length);
		break;
	}
	t.startsWith("ugos_bridge_host_") && (t = t.slice(17));
	for (let e of [
		"_cpu_usage_percent",
		"_cpu_frequency_mhz",
		"_load_1",
		"_memory_used_bytes",
		"_memory_used_percent",
		"_swap_used_percent",
		"_uptime_seconds"
	]) if (t.endsWith(e)) return t.slice(0, -e.length);
	return t;
}, Ut = (e, t, n) => Dr(yr(e[F(e, t, "cpu") ?? ""], "CPU", "") ?? n?.trim() ?? Fr(t)), Wt = (e, t) => {
	if (t?.ipEntity) {
		let n = e[t.ipEntity]?.state;
		if (n && n !== "unknown" && n !== "unavailable") return n;
	}
	return t?.ipAddress?.trim() || "Unavailable";
}, Gt = (e, t, n) => n && n > 0 ? n : t > 0 ? Math.max(e, Math.round(e / (t / 100))) : e, Kt = (e, t) => {
	if (t && t.length > 0) {
		let n = e.filter((e) => Tn(e.slug, e.name, t));
		if (n.length > 0) return n;
	}
	let n = e.filter((e) => e.name !== "/");
	return n.length > 0 ? n : e;
}, qt = (e, t) => {
	if (!t || t.length === 0) return e.filter((e) => e !== "lo");
	let n = t.map((e) => J(e)), r = e.filter((e) => n.includes(J(e)));
	return r.length > 0 ? r : e;
}, Jt = (e) => N(e, "projectSlugs", () => {
	let t = E(e).map((e) => Ze.exec(e)?.[1]).filter((e) => !!e), n = dt(e, "sensor.compose_project_").map(([, e]) => gr(e)).filter((e) => !!e), r = D(e).filter(([e, t]) => e.startsWith("sensor.") && (B(t, "project_slug") !== void 0 || B(t, "project") !== void 0)).map(([, e]) => Tr(B(e, "project_slug") ?? B(e, "project"))).filter((e) => !!e);
	return Array.from(/* @__PURE__ */ new Set([
		...t,
		...n,
		...r
	])).sort();
}), Yt = (e, t, n) => N(e, `diskSlugs:${t}:${n}`, () => {
	let r = Kn(e, t, n, "disk", or), i = [
		...R(e, RegExp(`^sensor\\.${Y(n)}_disk_(.+?)_size_bytes$`)),
		...R(e, /^sensor\.ugos_bridge_disk_(.+?)_size_bytes$/),
		...R(e, RegExp(`^sensor\\.${Y(n)}_disk_(.+?)_(?:size_bytes|read_bytes_per_second|write_bytes_per_second|busy_percent|model|vendor|serial|media_type)(?:_\\d+)?$`))
	], a = Array.from(/* @__PURE__ */ new Set([...r, ...i])).sort();
	if (a.length > 0) return a;
	let o = E(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_disk_([^_]+)_`))?.[1]).filter((e) => !!e), s = O(e).map((e) => rr(e, t, [
		"Size",
		"Busy",
		"Read Throughput",
		"Write Throughput"
	])).filter((e) => e !== void 0 && or(e)), c = O(e).filter((e) => V(e, "size_bytes") !== void 0 || V(e, "read_bytes_per_second") !== void 0 || V(e, "write_bytes_per_second") !== void 0).map((e) => J(B(e, "name") ?? "")).filter((e) => or(e));
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...o,
		...s,
		...c
	])).sort();
}), Xt = (e, t) => N(e, `filesystemSlugs:${t}`, () => {
	let n = [
		...R(e, RegExp(`^sensor\\.ugos_bridge_host_${Y(t)}_filesystem_(.+?)_used_bytes$`)),
		...R(e, /^sensor\.ugos_bridge_filesystem_(.+?)_used_bytes$/),
		...R(e, RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_host_${Y(t)}_filesystem_(.+?)_(?:used_bytes|free_bytes|used_percent|read_only)(?:_\\d+)?$`))
	], r = RegExp(`^(?:sensor|binary_sensor)\\.${Y(t)}_filesystem_(.+?)_(?:used_bytes|free_bytes|used_percent|read_only|used|free)(?:_\\d+)?$`), i = D(e).map(([e, n]) => {
		let i = r.exec(e)?.[1];
		return i ? ir(n, t) ?? J(B(n, "name") ?? i) : void 0;
	}).filter((e) => !!e), a = O(e).map((e) => ir(e, t)).filter((e) => !!e), o = O(e).filter((e) => V(e, "used_bytes") !== void 0 || V(e, "free_bytes") !== void 0).map((e) => J(B(e, "name") ?? "")).filter((e) => !!e);
	return Array.from(/* @__PURE__ */ new Set([
		...n,
		...i,
		...a,
		...o
	])).sort();
}), Zt = (e, t, n) => N(e, `networkSlugs:${t}:${n}`, () => {
	let r = Kn(e, t, n, "network", lr), i = [
		...R(e, RegExp(`^sensor\\.${Y(n)}_network_(.+?)_rx_bytes_per_second$`)),
		...R(e, /^sensor\.ugos_bridge_network_(.+?)_rx_bytes_per_second$/),
		...R(e, RegExp(`^(?:sensor|binary_sensor)\\.${Y(n)}_network_(.+?)_(?:rx_bytes_per_second|tx_bytes_per_second|speed_mbps|carrier)(?:_\\d+)?$`))
	], a = E(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_network_([^_]+)_`))?.[1]).filter((e) => !!e), o = O(e).map((e) => rr(e, t, [
		"RX Throughput",
		"TX Throughput",
		"Link Speed",
		"Carrier"
	])).filter((e) => e !== void 0 && lr(e)), s = O(e).filter((e) => V(e, "rx_bytes_per_second") !== void 0 || V(e, "tx_bytes_per_second") !== void 0 || V(e, "speed_mbps") !== void 0).map((e) => J(B(e, "name") ?? "")).filter((e) => lr(e));
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...a,
		...o,
		...s
	])).sort();
}), Qt = (e, t, n) => N(e, `bondSlugs:${t}:${n}`, () => {
	let r = Kn(e, t, n, "bond", cr), i = [
		...R(e, RegExp(`^sensor\\.${Y(n)}_bond_(.+?)_speed_mbps$`)),
		...R(e, /^sensor\.ugos_bridge_bond_(.+?)_speed_mbps$/),
		...R(e, RegExp(`^(?:sensor|binary_sensor)\\.${Y(n)}_bond_(.+?)_(?:speed_mbps|mode|active_slave|mii_status|slave_count|carrier)(?:_\\d+)?$`))
	], a = E(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_bond_([^_]+)_`))?.[1]).filter((e) => !!e), o = O(e).map((e) => rr(e, t, [
		"Link Speed",
		"Mode",
		"Active Slave",
		"MII Status",
		"Slave Count",
		"Carrier"
	])).filter((e) => e !== void 0 && cr(e)), s = O(e).filter((e) => B(e, "mode") !== void 0 || B(e, "active_slave") !== void 0 || V(e, "speed_mbps") !== void 0).map((e) => J(B(e, "name") ?? "")).filter((e) => cr(e));
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...a,
		...o,
		...s
	])).sort();
}), $t = (e, t) => {
	if (t && t.length > 0) return e;
	let n = e.filter((e) => /^(bond\d+|eth\d+)$/i.test(e));
	return n.length > 0 ? n : e;
}, en = (e) => [...e].filter((e) => /^(bond\d+|eth\d+)$/i.test(e)).sort((e, t) => tn(e) - tn(t) || e.localeCompare(t)).slice(0, 3), tn = (e) => {
	let t = e.toLowerCase();
	return t.startsWith("bond") ? 0 : t.startsWith("eth") ? 1 : 2;
}, nn = (e, t, n) => {
	let r = z(e, gn(e, t, n, "rx")), i = z(e, gn(e, t, n, "tx"));
	return ((r ?? 0) + (i ?? 0)) * 8;
}, rn = (e, t) => {
	let n = e.toLowerCase();
	if (n.startsWith("bond")) return T.cyan;
	if (n === "eth0") return T.good;
	if (n === "eth1") return T.purple;
	let r = [
		T.softBlue,
		T.green,
		T.blue
	];
	return r[t % r.length] ?? T.softBlue;
}, an = (e, t, n) => N(e, `gpuSlugs:${t}:${n}`, () => {
	let r = Kn(e, t, n, "gpu", (e) => !!e), i = [...R(e, RegExp(`^sensor\\.${Y(n)}_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\\d+)?$`)), ...R(e, /^sensor\.ugos_bridge_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\d+)?$/)], a = E(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_gpu_([^_]+)_`))?.[1]).filter((e) => !!e), o = O(e).filter((e) => H(e, "engines").length > 0 || H(e, "stats").length > 0 || V(e, "busy_percent") !== void 0 || V(e, "current_mhz") !== void 0).map((e) => J(B(e, "name") ?? "")).filter((e) => !!e);
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...a,
		...o
	])).sort();
}), on = (e, t) => N(e, `arraySlugs:${t}`, () => {
	let n = Kn(e, t, `ugos_bridge_host_${t}`, "array", sr), r = [
		...R(e, RegExp(`^sensor\\.ugos_bridge_host_${Y(t)}_array_(.+?)_size_bytes$`)),
		...R(e, /^sensor\.ugos_bridge_array_(.+?)_size_bytes$/),
		...R(e, RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_host_${Y(t)}_array_(.+?)_(?:size_bytes|degraded_disks|active_disks|total_disks|sync_completed_percent|level|degraded)(?:_\\d+)?$`))
	], i = E(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_array_([^_]+)_`))?.[1]).filter((e) => !!e), a = O(e).map((e) => rr(e, t, [
		"Size",
		"Degraded Disks",
		"Sync Progress"
	])).filter((e) => e !== void 0 && sr(e)), o = O(e).filter((e) => V(e, "size_bytes") !== void 0 || B(e, "level") !== void 0 || V(e, "degraded_disks") !== void 0).map((e) => J(B(e, "name") ?? "")).filter((e) => sr(e));
	return Array.from(/* @__PURE__ */ new Set([
		...n,
		...r,
		...i,
		...a,
		...o
	])).sort();
}), F = (e, t, n) => P(e, `hostMetric:${t}:${n}`, () => {
	let r = {
		cpu: `sensor.ugos_bridge_host_${t}_cpu_usage_percent`,
		load1: `sensor.ugos_bridge_host_${t}_load_1`,
		cpufreq: `sensor.ugos_bridge_host_${t}_cpu_frequency_mhz`,
		memoryUsedBytes: `sensor.ugos_bridge_host_${t}_memory_used_bytes`,
		memoryUsedPercent: `sensor.ugos_bridge_host_${t}_memory_used_percent`,
		swapUsedPercent: `sensor.ugos_bridge_host_${t}_swap_used_percent`,
		uptime: `sensor.ugos_bridge_host_${t}_uptime_seconds`
	};
	if (e[r[n]]) return r[n];
	let i = Ft(e, t);
	switch (n) {
		case "cpu": return L(i, {
			entityIncludes: ["_cpu"],
			friendlyIncludes: ["cpu"],
			unit: "%"
		});
		case "load1": return L(i, {
			entityIncludes: ["load"],
			friendlyIncludes: ["load", "1"],
			unit: void 0
		});
		case "cpufreq": return L(i, {
			entityIncludes: ["frequency"],
			friendlyIncludes: ["frequency"],
			unit: "MHz"
		});
		case "memoryUsedBytes": return L(i, {
			entityIncludes: ["memory"],
			friendlyIncludes: ["memory", "used"],
			unit: "B"
		});
		case "memoryUsedPercent": return L(i, {
			entityIncludes: ["memory"],
			friendlyIncludes: ["memory", "used"],
			unit: "%"
		});
		case "swapUsedPercent": return L(i, {
			entityIncludes: ["swap"],
			friendlyIncludes: ["swap", "used"],
			unit: "%"
		});
		case "uptime": return L(i, {
			entityIncludes: ["uptime"],
			friendlyIncludes: ["uptime"],
			unit: "s"
		});
	}
}), sn = (e, t, n) => {
	let r = F(e, t, n), i = st[n], a = [
		r ? e[r] : void 0,
		e[F(e, t, "cpu") ?? ""],
		e[F(e, t, "memoryUsedBytes") ?? ""]
	];
	for (let r of a) {
		let a = V(r, i);
		if (un(e, t, n, a)) return a;
	}
	for (let [, r] of Ft(e, t)) {
		let a = V(r, i);
		if (un(e, t, n, a)) return a;
	}
	let o = z(e, r);
	return un(e, t, n, o) ? o : void 0;
}, cn = (e, t) => {
	let n = F(e, t, "load1"), r = e[n ?? ""], i = sn(e, t, "load1") ?? 0, a = nr(r) === "%" || ln(n, r), o = a ? i : i * 100;
	return {
		value: i,
		valuePercent: Pn(o),
		valueText: a ? Fn(i) : i.toFixed(2),
		unit: a ? "percent" : "load",
		statusText: a ? Nn(o) : Mn(i)
	};
}, ln = (e, t) => {
	let n = e?.toLowerCase() ?? "", r = br(t);
	return n.endsWith("_load_1") || n.includes("_load_1m") || r.includes("load 1m") || r.includes("load (1m)");
}, un = (e, t, n, r) => {
	if (r === void 0 || !Number.isFinite(r) || r < 0) return !1;
	if (n !== "load1") return !0;
	let i = e[F(e, t, "cpu") ?? ""], a = H(i, "cpu_cores").length;
	return r <= Math.max(a * 64, 1024);
}, dn = (e, t, n, r) => P(e, `diskMetric:${t}:${n}:${r}`, () => {
	let i = A(e, {
		size: [`sensor.ugos_bridge_host_${t}_disk_${n}_size_bytes`, `sensor.ugos_bridge_disk_${n}_size_bytes`],
		temperature: [`sensor.ugos_bridge_host_${t}_disk_${n}_temperature_celsius`, `sensor.ugos_bridge_disk_${n}_temperature_celsius`],
		read: [`sensor.ugos_bridge_host_${t}_disk_${n}_read_bytes_per_second`, `sensor.ugos_bridge_disk_${n}_read_bytes_per_second`],
		write: [`sensor.ugos_bridge_host_${t}_disk_${n}_write_bytes_per_second`, `sensor.ugos_bridge_disk_${n}_write_bytes_per_second`],
		busy: [`sensor.ugos_bridge_host_${t}_disk_${n}_busy_percent`, `sensor.ugos_bridge_disk_${n}_busy_percent`]
	}[r]);
	if (i) return i;
	let a = k(e, [
		`sensor.ugos_bridge_host_${t}_disk_${n}_`,
		`sensor.${t}_disk_${n}_`,
		`sensor.ugos_bridge_disk_${n}_`
	]), o = r === "size" ? {
		entityIncludes: ["size"],
		friendlyIncludes: ["size"],
		unit: "B"
	} : r === "temperature" ? {
		entityIncludes: ["temperature"],
		friendlyIncludes: ["temperature"],
		unit: "°C"
	} : r === "busy" ? {
		entityIncludes: ["busy"],
		friendlyIncludes: ["busy"],
		unit: "%"
	} : {
		entityIncludes: [r === "read" ? "read" : "write"],
		friendlyIncludes: [r === "read" ? "read" : "write", "throughput"],
		unit: "B/s"
	};
	if (a.length > 0) return M(a, o);
	let s = j(e, "disk", n);
	return s.length > 0 ? M(s, o) : M(D(e).filter(([, e]) => K(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), fn = (e, t, n, r) => P(e, `diskTextMetric:${t}:${n}:${r}`, () => {
	let i = A(e, {
		model: [`sensor.ugos_bridge_host_${t}_disk_${n}_model`, `sensor.ugos_bridge_disk_${n}_model`],
		vendor: [`sensor.ugos_bridge_host_${t}_disk_${n}_vendor`, `sensor.ugos_bridge_disk_${n}_vendor`],
		serial: [`sensor.ugos_bridge_host_${t}_disk_${n}_serial`, `sensor.ugos_bridge_disk_${n}_serial`],
		type: [`sensor.ugos_bridge_host_${t}_disk_${n}_media_type`, `sensor.ugos_bridge_disk_${n}_media_type`]
	}[r]);
	if (i) return i;
	let a = [
		`sensor.ugos_bridge_host_${t}_disk_${n}_`,
		`sensor.${t}_disk_${n}_`,
		`sensor.ugos_bridge_disk_${n}_`
	], o = r === "type" ? {
		entityIncludes: ["media"],
		friendlyIncludes: ["media"]
	} : {
		entityIncludes: [r],
		friendlyIncludes: [r]
	}, s = k(e, a);
	if (s.length > 0) return M(s, o);
	let c = j(e, "disk", n);
	return c.length > 0 ? M(c, o) : M(D(e).filter(([, e]) => K(e, [n])), {
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), pn = (e, t, n, r) => P(e, `filesystemMetric:${t}:${n}:${r}`, () => {
	let i = A(e, {
		used: [`sensor.ugos_bridge_host_${t}_filesystem_${n}_used_bytes`, `sensor.ugos_bridge_filesystem_${n}_used_bytes`],
		free: [`sensor.ugos_bridge_host_${t}_filesystem_${n}_free_bytes`, `sensor.ugos_bridge_filesystem_${n}_free_bytes`]
	}[r]);
	if (i) return i;
	let a = k(e, [
		`sensor.ugos_bridge_host_${t}_filesystem_${n}_`,
		`sensor.${t}_filesystem_${n}_`,
		`sensor.ugos_bridge_filesystem_${n}_`
	]);
	if (a.length > 0) return M(a, {
		entityIncludes: [r],
		friendlyIncludes: [r],
		unit: "B"
	});
	let o = j(e, "filesystem", n);
	return o.length > 0 ? M(o, {
		entityIncludes: [r],
		friendlyIncludes: [r],
		unit: "B"
	}) : M(D(e).filter(([, e]) => ir(e, t) === n), {
		entityIncludes: [r],
		friendlyIncludes: [r],
		unit: "B"
	});
}), mn = (e, t, n) => P(e, `filesystemReadonly:${t}:${n}`, () => {
	let r = A(e, [`binary_sensor.ugos_bridge_host_${t}_filesystem_${n}_read_only`, `binary_sensor.ugos_bridge_filesystem_${n}_read_only`]);
	if (r) return r;
	let i = k(e, [
		`binary_sensor.ugos_bridge_host_${t}_filesystem_${n}_`,
		`binary_sensor.${t}_filesystem_${n}_`,
		`binary_sensor.ugos_bridge_filesystem_${n}_`
	]);
	if (i.length > 0) return M(i, {
		entityIncludes: ["read"],
		friendlyIncludes: ["read", "only"]
	});
	let a = j(e, "filesystem", n, "binary_sensor.");
	return a.length > 0 ? M(a, {
		entityIncludes: ["read"],
		friendlyIncludes: ["read", "only"]
	}) : M(D(e).filter(([, e]) => ir(e, t) === n), {
		entityIncludes: ["read"],
		friendlyIncludes: ["read", "only"]
	});
}), I = (e, t, n, r) => P(e, `arrayMetric:${t}:${n}:${r}`, () => {
	let i = A(e, {
		size: [`sensor.ugos_bridge_host_${t}_array_${n}_size_bytes`, `sensor.ugos_bridge_array_${n}_size_bytes`],
		degraded: [`sensor.ugos_bridge_host_${t}_array_${n}_degraded_disks`, `sensor.ugos_bridge_array_${n}_degraded_disks`],
		active: [`sensor.ugos_bridge_host_${t}_array_${n}_active_disks`, `sensor.ugos_bridge_array_${n}_active_disks`],
		total: [`sensor.ugos_bridge_host_${t}_array_${n}_total_disks`, `sensor.ugos_bridge_array_${n}_total_disks`],
		sync: [`sensor.ugos_bridge_host_${t}_array_${n}_sync_completed_percent`, `sensor.ugos_bridge_array_${n}_sync_completed_percent`]
	}[r]);
	if (i) return i;
	let a = [
		`sensor.ugos_bridge_host_${t}_array_${n}_`,
		`sensor.${t}_array_${n}_`,
		`sensor.ugos_bridge_array_${n}_`
	], o = r === "size" ? {
		entityIncludes: ["size"],
		friendlyIncludes: ["size"],
		unit: "B"
	} : r === "degraded" ? {
		entityIncludes: ["degraded"],
		friendlyIncludes: ["degraded"]
	} : r === "active" ? {
		entityIncludes: ["active"],
		friendlyIncludes: ["active", "disks"]
	} : r === "total" ? {
		entityIncludes: ["total"],
		friendlyIncludes: ["total", "disks"]
	} : {
		entityIncludes: ["sync"],
		friendlyIncludes: ["sync"],
		unit: "%"
	}, s = k(e, a);
	if (s.length > 0) return M(s, o);
	let c = j(e, "array", n);
	return c.length > 0 ? M(c, o) : M(D(e).filter(([, e]) => K(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), hn = (e, t, n, r) => P(e, `arrayTextMetric:${t}:${n}:${r}`, () => {
	let i = A(e, { level: [`sensor.ugos_bridge_host_${t}_array_${n}_level`, `sensor.ugos_bridge_array_${n}_level`] }[r]);
	if (i) return i;
	let a = k(e, [
		`sensor.ugos_bridge_host_${t}_array_${n}_`,
		`sensor.${t}_array_${n}_`,
		`sensor.ugos_bridge_array_${n}_`
	]);
	if (a.length > 0) return M(a, {
		entityIncludes: ["level"],
		friendlyIncludes: ["level"]
	});
	let o = j(e, "array", n);
	return o.length > 0 ? M(o, {
		entityIncludes: ["level"],
		friendlyIncludes: ["level"]
	}) : M(D(e).filter(([, e]) => K(e, [n, "level"])), {
		entityIncludes: [],
		friendlyIncludes: [n, "level"]
	});
}), gn = (e, t, n, r) => P(e, `networkMetric:${t}:${n}:${r}`, () => {
	let i = A(e, {
		rx: [`sensor.ugos_bridge_host_${t}_network_${n}_rx_bytes_per_second`, `sensor.ugos_bridge_network_${n}_rx_bytes_per_second`],
		tx: [`sensor.ugos_bridge_host_${t}_network_${n}_tx_bytes_per_second`, `sensor.ugos_bridge_network_${n}_tx_bytes_per_second`],
		speed: [`sensor.ugos_bridge_host_${t}_network_${n}_speed_mbps`, `sensor.ugos_bridge_network_${n}_speed_mbps`]
	}[r]);
	if (i) return i;
	let a = [
		`sensor.ugos_bridge_host_${t}_network_${n}_`,
		`sensor.${t}_network_${n}_`,
		`sensor.ugos_bridge_network_${n}_`
	], o = r === "speed" ? {
		entityIncludes: ["speed"],
		friendlyIncludes: ["link", "speed"],
		unit: "Mbit/s"
	} : {
		entityIncludes: [r],
		friendlyIncludes: [r === "rx" ? "rx" : "tx", "throughput"],
		unit: "B/s"
	}, s = k(e, a);
	if (s.length > 0) return M(s, o);
	let c = j(e, "network", n);
	return c.length > 0 ? M(c, o) : M(D(e).filter(([, e]) => K(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), _n = (e, t, n) => P(e, `networkCarrier:${t}:${n}`, () => {
	let r = A(e, [`binary_sensor.ugos_bridge_host_${t}_network_${n}_carrier`, `binary_sensor.ugos_bridge_network_${n}_carrier`]);
	if (r) return r;
	let i = k(e, [
		`binary_sensor.ugos_bridge_host_${t}_network_${n}_`,
		`binary_sensor.${t}_network_${n}_`,
		`binary_sensor.ugos_bridge_network_${n}_`
	]);
	if (i.length > 0) return M(i, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	});
	let a = j(e, "network", n, "binary_sensor.");
	return a.length > 0 ? M(a, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	}) : M(dt(e, "binary_sensor.").filter(([, e]) => K(e, [n, "carrier"])), {
		entityIncludes: [],
		friendlyIncludes: [n, "carrier"]
	});
}), vn = (e, t, n, r) => P(e, `bondMetric:${t}:${n}:${r}`, () => {
	let i = A(e, {
		speed: [`sensor.ugos_bridge_host_${t}_bond_${n}_speed_mbps`, `sensor.ugos_bridge_bond_${n}_speed_mbps`],
		mode: [`sensor.ugos_bridge_host_${t}_bond_${n}_mode`, `sensor.ugos_bridge_bond_${n}_mode`],
		active_slave: [`sensor.ugos_bridge_host_${t}_bond_${n}_active_slave`, `sensor.ugos_bridge_bond_${n}_active_slave`]
	}[r]);
	if (i) return i;
	let a = [
		`sensor.ugos_bridge_host_${t}_bond_${n}_`,
		`sensor.${t}_bond_${n}_`,
		`sensor.ugos_bridge_bond_${n}_`
	], o = r === "speed" ? {
		entityIncludes: ["speed"],
		friendlyIncludes: ["link", "speed"],
		unit: "Mbit/s"
	} : r === "mode" ? {
		entityIncludes: ["mode"],
		friendlyIncludes: ["mode"]
	} : {
		entityIncludes: ["active"],
		friendlyIncludes: ["active", "slave"]
	}, s = k(e, a);
	if (s.length > 0) return M(s, o);
	let c = j(e, "bond", n);
	return c.length > 0 ? M(c, o) : M(D(e).filter(([, e]) => K(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), yn = (e, t, n) => P(e, `bondCarrier:${t}:${n}`, () => {
	let r = A(e, [`binary_sensor.ugos_bridge_host_${t}_bond_${n}_carrier`, `binary_sensor.ugos_bridge_bond_${n}_carrier`]);
	if (r) return r;
	let i = k(e, [
		`binary_sensor.ugos_bridge_host_${t}_bond_${n}_`,
		`binary_sensor.${t}_bond_${n}_`,
		`binary_sensor.ugos_bridge_bond_${n}_`
	]);
	if (i.length > 0) return M(i, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	});
	let a = j(e, "bond", n, "binary_sensor.");
	return a.length > 0 ? M(a, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	}) : M(dt(e, "binary_sensor.").filter(([, e]) => K(e, [n, "carrier"])), {
		entityIncludes: [],
		friendlyIncludes: [n, "carrier"]
	});
}), bn = (e, t, n, r, i) => P(e, `gpuMetric:${t}:${n}:${r}:${i}`, () => {
	let a = A(e, {
		busy: [`sensor.${n}_gpu_${r}_busy_percent`, `sensor.ugos_bridge_gpu_${r}_busy_percent`],
		current: [`sensor.${n}_gpu_${r}_current_mhz`, `sensor.ugos_bridge_gpu_${r}_current_mhz`],
		max: [`sensor.${n}_gpu_${r}_max_mhz`, `sensor.ugos_bridge_gpu_${r}_max_mhz`]
	}[i]);
	if (a) return a;
	let o = k(e, [
		`sensor.${n}_gpu_${r}_`,
		`sensor.${t}_gpu_${r}_`,
		`sensor.ugos_bridge_gpu_${r}_`
	]), s = i === "busy" ? {
		entityIncludes: ["busy"],
		friendlyIncludes: ["busy"],
		unit: "%"
	} : {
		entityIncludes: [i],
		friendlyIncludes: [i, "frequency"],
		unit: "MHz"
	};
	return M(o, s) ?? M(j(e, "gpu", r), s);
}), xn = (e, t, n, r, i) => {
	let a = i.filter((t) => qn(e[t ?? ""])), o = Sn(e, t, n, r).filter(([, e]) => H(e, "engines").length > 0 || H(e, "stats").length > 0).map(([e]) => e);
	return Array.from(/* @__PURE__ */ new Set([...a, ...o]));
}, Sn = (e, t, n, r) => N(e, `gpuEntries:${t}:${n}:${r}`, () => {
	let i = k(e, [
		`sensor.${n}_gpu_${r}_`,
		`sensor.${t}_gpu_${r}_`,
		`sensor.ugos_bridge_gpu_${r}_`
	]), a = j(e, "gpu", r), o = D(e).filter(([e, t]) => e.startsWith("sensor.") && J(B(t, "name") ?? "") === r && (H(t, "engines").length > 0 || H(t, "stats").length > 0 || V(t, "busy_percent") !== void 0 || V(t, "current_mhz") !== void 0 || V(t, "max_mhz") !== void 0));
	return Array.from(new Map([
		...i,
		...a,
		...o
	]).entries());
}), Cn = (e, t, n) => P(e, `projectMetric:${t}:${n}`, () => {
	let r = {
		cpu: `sensor.ugos_bridge_project_${t}_cpu_usage_percent`,
		memory: `sensor.ugos_bridge_project_${t}_memory_usage_bytes`,
		total: `sensor.ugos_bridge_project_${t}_total_containers`,
		running: `sensor.ugos_bridge_project_${t}_running_containers`
	};
	if (e[r[n]]) return r[n];
	let i = k(e, [
		`sensor.ugos_bridge_project_${t}_`,
		`sensor.compose_project_${t}_`,
		`sensor.project_${t}_`,
		...t === "virtual_machines" ? ["sensor.virtual_machines_"] : []
	]), a = n === "cpu" ? {
		entityIncludes: ["cpu"],
		friendlyIncludes: ["cpu"],
		unit: "%"
	} : n === "memory" ? {
		entityIncludes: ["memory"],
		friendlyIncludes: ["memory"],
		unit: "B"
	} : n === "total" ? {
		entityIncludes: ["total"],
		friendlyIncludes: ["total", "containers"]
	} : {
		entityIncludes: ["running"],
		friendlyIncludes: ["running", "containers"]
	};
	return i.length > 0 ? L(i, a) : L(D(e).filter(([, e]) => gr(e) === t), a);
}), wn = (e, t) => P(e, `projectPayload:${t}`, () => {
	let n, r = -1;
	for (let [i, a] of D(e)) {
		if (!i.startsWith("sensor.") || Tr(B(a, "project_slug") ?? B(a, "project")) !== t) continue;
		let e = 0;
		H(a, "containers").length > 0 && (e += 8), V(a, "total_containers") !== void 0 && (e += 4), V(a, "running_containers") !== void 0 && (e += 3), V(a, "memory_usage_bytes") !== void 0 && (e += 2), V(a, "cpu_usage_percent") !== void 0 && (e += 2), i.startsWith("sensor.compose_project_") && (e += 3), i.startsWith("sensor.ugos_bridge_project_") && (e += 3), (e > r || e === r && n !== void 0 && i.localeCompare(n) < 0 || n === void 0) && (n = i, r = e);
	}
	return n;
}), Tn = (e, t, n) => {
	let r = J(e), i = J(t);
	return n.some((e) => {
		let t = J(e);
		return t === r || t === i;
	});
}, En = (e, t) => e.samples.at(-1)?.key === t.key ? e : { samples: [...e.samples, t].slice(-21) }, Dn = (e, t, n) => {
	if (e.length >= n) return e.slice(-21);
	let r = Math.max(n - e.length, 0);
	return [...Array.from({ length: r }, () => t), ...e];
}, On = (e, t, n) => {
	let r = {
		key: "initial",
		timestampLabel: "",
		cpuPercent: 0,
		ramPercent: 0,
		gpuPercent: 0,
		load1: 0,
		networkBpsBySlug: n
	}, i = e.length > 0 ? e : [r], a = Math.max(5 - i.length, 0), o = i[0] ?? r;
	return [...Array.from({ length: a }, () => o), ...i].map((e) => ({
		timestampLabel: e.timestampLabel,
		totalsByInterface: Object.fromEntries(t.map((t) => [t, e.networkBpsBySlug[t] ?? 0]))
	}));
}, kn = (e, t) => {
	let n = e.find((e) => t.some((t) => e.label.includes(t)));
	return n ? n.value : e.find((e) => !e.entityId.includes("_disk_"))?.value;
}, An = (e, t) => {
	let n = t.toLowerCase(), r = e.find((e) => e.label.includes(n) && (e.label.includes("phy temperature") || e.label.includes("mac temperature")));
	return r ? r.value : e.find((e) => e.label.includes(n))?.value;
}, jn = (e) => e === void 0 ? "healthy" : e >= 55 ? "degraded" : e >= 48 ? "warning" : "healthy", Mn = (e) => e >= 3 ? "High" : e >= 1 ? "Busy" : "Good", Nn = (e) => e >= 90 ? "High" : e >= 70 ? "Busy" : "Good", Pn = (e) => Math.max(0, Math.min(100, e)), Fn = (e) => {
	let t = e >= 100 ? 0 : e >= 10 ? 1 : 2;
	return `${e.toFixed(t)}%`;
}, In = (e, t) => N(e, `hasEntityPrefix:${t}`, () => E(e).some((e) => e.startsWith(`sensor.${t}_`) || e.startsWith(`binary_sensor.${t}_`))), Ln = (e, t) => N(e, `hasBridgeHostEntityPrefix:${t}`, () => E(e).some((e) => e.startsWith(`sensor.ugos_bridge_host_${t}_`) || e.startsWith(`binary_sensor.ugos_bridge_host_${t}_`))), Rn = (e) => N(e, "hostSlugCandidates", () => {
	let t = /* @__PURE__ */ new Map(), n = (e, n) => {
		e === void 0 || e.startsWith("ugos_bridge_") || t.set(e, (t.get(e) ?? 0) + n);
	};
	for (let t of E(e)) n(Xe.exec(t)?.[1], 1e3), n($e.exec(t)?.[1], 500), n(Qe.exec(t)?.[1], 100), n(rt.exec(t)?.[1], 1);
	let r = Array.from(t.keys()), i = (e) => r.some((t) => t !== e && e.startsWith(`${t}_`) && et.test(e.slice(t.length + 1)));
	return Array.from(t.entries()).filter(([e]) => !i(e)).sort(([e, t], [n, r]) => r - t || e.localeCompare(n)).map(([e]) => e);
}), zn = (e, t) => N(e, `hostScoped:${t}`, () => B(e[F(e, t, "cpu") ?? ""], "identity_scope") === "host" || E(e).some((e) => Bn(e, t) !== void 0)), Bn = (e, t) => {
	for (let n of ["sensor", "binary_sensor"]) {
		let r = `${n}.ugos_bridge_host_${t}_`;
		if (e.startsWith(r)) {
			let t = e.slice(r.length);
			return tt.test(t) ? `${n}.ugos_bridge_${t}` : void 0;
		}
	}
}, Vn = (e) => {
	let t = B(e, "host");
	return t ? J(t) : void 0;
}, Hn = (e, t) => N(e, `workloadStates:${t}`, () => {
	let n = {};
	if (zn(e, t)) {
		for (let [r, i] of D(e)) {
			let e = Bn(r, t);
			e === void 0 ? Vn(i) === t && (n[r] = i) : n[e] = i;
		}
		return n;
	}
	let r = Rn(e).filter((t) => zn(e, t));
	if (r.length === 0) return e;
	let i = r.flatMap((e) => ["sensor", "binary_sensor"].flatMap((t) => [`${t}.ugos_bridge_host_${e}_`, ...nt.some((t) => t.startsWith(`${e}_`)) ? [] : [`${t}.${e}_`]]));
	for (let [r, a] of D(e)) {
		let e = Vn(a);
		e !== void 0 && e !== t || i.some((e) => r.startsWith(e)) || (n[r] = a);
	}
	return n;
}), Un = (e) => [
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
], Wn = (e, t, n, r) => E(e).filter((i) => {
	if (n !== void 0 && i === n || t.some((e) => i.startsWith(e))) return !0;
	let a = e[i];
	return Lt(i, a) && a !== void 0 && Rt(i, a, r) || B(a, "container") !== void 0 || B(a, "project") !== void 0 || V(a, "process_count") !== void 0 || V(a, "cpu_time_seconds") !== void 0;
}).sort(), Gn = (e, t) => e.startsWith(`sensor.${t}_`) && ![
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
].some((t) => e.includes(t)), L = (e, t) => {
	let n, r = -1;
	entryLoop: for (let [i, a] of e) {
		let e = i.toLowerCase(), o = br(a), s = nr(a), c = qn(a);
		if (t.unit && s !== t.unit) continue;
		let l = c ? 100 : -100;
		for (let n of t.entityIncludes) {
			if (!e.includes(n)) continue entryLoop;
			l += 2;
		}
		for (let e of t.friendlyIncludes) {
			if (!o.includes(e)) continue entryLoop;
			l += 1;
		}
		(l > r || l === r && n !== void 0 && i.localeCompare(n) < 0 || n === void 0) && (n = i, r = l);
	}
	return n;
}, R = (e, t) => N(e, `entitySlugs:${t.source}`, () => Array.from(new Set(E(e).map((e) => t.exec(e)?.[1]).filter((e) => !!e))).sort()), Kn = (e, t, n, r, i) => N(e, `componentSlugs:${t}:${n}:${r}`, () => {
	let a = [
		RegExp(`^(?:sensor|binary_sensor)\\.${Y(n)}_${r}_([^_]+)_`),
		RegExp(`^(?:sensor|binary_sensor)\\.${Y(t)}_${r}_([^_]+)_`),
		RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_${r}_([^_]+)_`)
	];
	return Array.from(new Set(E(e).flatMap((e) => a.map((t) => t.exec(e)?.[1]).filter((e) => !!e)).map((e) => J(e)).filter((e) => !!e && i(e)))).sort();
}), qn = (e) => e !== void 0 && e.state !== "unknown" && e.state !== "unavailable", z = (e, t) => t ? $n(e[t]) : void 0, Jn = (e, t) => {
	if (!t) return;
	let n = e[t];
	if (!n) return;
	let r = ft(n);
	if (!r) return;
	if (r.textState !== void 0) return r.textState ?? void 0;
	let i = n.state;
	return r.textState = !i || i === "unknown" || i === "unavailable" ? null : i, r.textState ?? void 0;
}, B = (e, t) => {
	let n = e?.attributes[t];
	return typeof n == "string" && n.trim() !== "" ? n : void 0;
}, V = (e, t) => {
	let n = e?.attributes[t];
	if (typeof n == "number" && Number.isFinite(n)) return n;
	if (typeof n == "string") return G(n);
}, Yn = (e, t) => {
	let n = e?.attributes[t];
	if (typeof n == "boolean") return n;
	if (typeof n == "number") return n !== 0;
	if (typeof n == "string") {
		let e = n.trim().toLowerCase();
		if (e === "1" || e === "true" || e === "on" || e === "running") return !0;
		if (e === "0" || e === "false" || e === "off" || e === "stopped") return !1;
	}
}, Xn = (e, t) => {
	let n = e?.attributes[t];
	return Array.isArray(n) ? n.filter((e) => typeof e == "string" && e.trim() !== "") : [];
}, Zn = (e, t) => {
	for (let n of e) {
		let e = Xn(n, t);
		if (e.length > 0) return e;
	}
	return [];
}, H = (e, t) => {
	let n = e?.attributes[t];
	return Array.isArray(n) ? n.filter((e) => typeof e == "object" && !!e) : [];
}, U = (e, t) => {
	for (let n of t) {
		let t = e[n];
		if (typeof t == "string" && t.trim() !== "") return t;
	}
}, Qn = (e, t) => {
	for (let n of t) {
		let t = e[n];
		if (typeof t == "boolean") return t;
		if (typeof t == "number") return t !== 0;
		if (typeof t == "string") {
			let e = t.trim().toLowerCase();
			if (e === "1" || e === "true" || e === "on" || e === "running") return !0;
			if (e === "0" || e === "false" || e === "off" || e === "stopped") return !1;
		}
	}
}, W = (e, t) => {
	for (let n of t) {
		let t = e[n];
		if (typeof t == "number" && Number.isFinite(t)) return t;
		if (typeof t == "string") {
			let e = G(t);
			if (e !== void 0) return e;
		}
	}
}, G = (e) => {
	if (!e || e === "unknown" || e === "unavailable") return;
	let t = Number(e);
	return Number.isFinite(t) ? t : void 0;
}, $n = (e) => {
	let t = ft(e);
	if (t && e) return t.parsedNumber === void 0 && (t.parsedNumber = G(e.state) ?? null), t.parsedNumber ?? void 0;
}, er = (e) => e?.state === "on";
function tr(e) {
	if (!e) return;
	let t = e.trim();
	return t === "°C" || t === "ºC" || t === "Â°C" || t === "В°C" ? "°C" : t || void 0;
}
var nr = (e) => ft(e)?.unit, K = (e, t) => {
	let n = br(e);
	return t.every((e) => n.includes(e));
}, rr = (e, t, n) => {
	let r = q(e);
	if (!r) return;
	let i = ar(r, t);
	if (!i) return;
	let a = i.toLowerCase();
	for (let e of n) {
		let t = e.toLowerCase();
		if (!a.endsWith(` ${t}`)) continue;
		let n = i.slice(0, i.length - e.length).trim();
		return n ? J(n) : void 0;
	}
}, ir = (e, t) => {
	let n = q(e);
	if (!n) return;
	let r = n.toLowerCase(), i = t.replace(/_/g, " ");
	if (!r.includes(i) || !r.includes("/")) return;
	let a = n.match(/(\/[^\s]*)/)?.[1];
	return a ? J(a) : void 0;
}, ar = (e, t) => {
	let n = t.replace(/_/g, " ");
	if (e.toLowerCase().startsWith(`${n.toLowerCase()} `)) return e.slice(n.length + 1).trim();
}, or = (e) => /^(sd[a-z]+|hd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+|loop\d+|serial_[a-z0-9_]+|path_[a-f0-9]+|name_[a-z0-9_]+)$/i.test(e), sr = (e) => /^md\d+$/i.test(e), cr = (e) => /^bond\d+$/i.test(e), lr = (e) => /^(eth\d+|en[a-z0-9]+|eno\d+|ens\d+|enp[a-z0-9]+|wlan\d+|wl[a-z0-9]+|lo)$/i.test(e), ur = (e) => {
	if (e) return e.replace(/\s+/g, " ").trim() || void 0;
}, dr = (e) => {
	let t = e?.trim().toLowerCase();
	if (t) return t === "hdd" || t === "sata" ? "hdd" : t === "nvme" || t === "ssd" ? "nvme" : t;
}, fr = (e) => {
	let t = e?.trim().toLowerCase();
	if (t) return t === "linear" ? "JBOD" : t.toUpperCase();
}, pr = (e) => {
	let t = e.match(/^\/volume(\d+)$/i);
	return t ? `Volume ${t[1]}` : e;
}, mr = (e, t) => {
	let n = t.reduce((e, t) => (t.mediaType && (e[t.mediaType] = (e[t.mediaType] ?? 0) + t.capacityBytes), e), {}), r = Object.entries(n).map(([t, n]) => ({
		mediaType: t,
		distance: Math.abs(n - e.sizeBytes) / Math.max(e.sizeBytes, n, 1)
	})).sort((e, t) => e.distance - t.distance)[0];
	if (r) return r.mediaType === "hdd" ? "SATA" : r.mediaType.toUpperCase();
}, hr = (e, t) => {
	if (e !== void 0 || t !== void 0) return `Drives ${e ?? t ?? 0}/${t ?? e ?? 0}`;
}, gr = (e) => {
	let t = q(e);
	if (!t) return;
	let n = t.replace(/^(?:(?:compose|docker)\s+)?project\s+/i, "").replace(/\s+(CPU|Memory|Total Containers|Running Containers)$/i, "").trim();
	if (!n) return;
	let r = n.split(/\s+/).filter((e, t, n) => t === 0 || e.toLowerCase() !== n[t - 1]?.toLowerCase()).join(" ");
	return r ? J(r) : void 0;
}, _r = (e) => {
	let t = e.trim();
	if (!t) return t;
	let n = t.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(), r = n.split(" ");
	if (r.length % 2 == 0) {
		let e = r.length / 2;
		if (r.slice(0, e).join(" ").toLowerCase() === r.slice(e).join(" ").toLowerCase()) return r.slice(0, e).join(" ");
	}
	return n;
}, vr = (e, t, n, r) => {
	let i = Object.entries(e).filter(([e, n]) => {
		if (!e.startsWith("sensor.") || nr(n) !== "%") return !1;
		let i = `${e} ${q(n)}`.toLowerCase(), a = i.includes(t) || i.includes(t.replace(/_/g, " ")), o = i.includes(r), s = i.includes("busy"), c = i.includes("render/3d") || i.includes("render_3d") || i.includes("blitter") || i.includes("videoenhance") || i.includes("video_enhance") || i.includes("video/") || i.includes("video_");
		return a && o && s && c;
	}).map(([, e]) => G(e.state)).filter((e) => e !== void 0);
	return i.length > 0 ? Math.max(...i) : z(e, bn(e, t, n, r, "busy")) ?? 0;
}, yr = (e, t, n) => {
	let r = q(e);
	if (!r) return null;
	let i = r.trim();
	return t && i.endsWith(` ${t}`) && (i = i.slice(0, -` ${t}`.length)), n && i.startsWith(`${n} `) && (i = i.slice(n.length + 1)), i.startsWith("Compose project ") && (i = i.slice(16)), i.trim() || null;
}, q = (e) => ft(e)?.friendlyName ?? "", br = (e) => ft(e)?.friendlyNameLower ?? "", xr = (e) => {
	let t = e.match(/^cpu\s*(\d+)$/i);
	return t ? `Core ${t[1]}` : e.replace(/\s+/g, " ").trim();
}, Sr = (e, t) => (G(e.key.replace(/[^\d]/g, "")) ?? 2 ** 53 - 1) - (G(t.key.replace(/[^\d]/g, "")) ?? 2 ** 53 - 1) || e.name.localeCompare(t.name), Cr = (e) => {
	let t = e.replace(/\/\d+$/g, "").replace(/\/3d/gi, "").replace(/\s+/g, "");
	return /^render/i.test(t) ? "Render" : /^blitter/i.test(t) ? "Blitter" : /^videoenhance/i.test(t) ? "VideoEnhance" : /^video/i.test(t) ? "Video" : e.replace(/\/\d+$/g, "").trim();
}, wr = (e) => e.split("_").filter(Boolean).map((e) => e === "imc" ? "IMC" : e === "rc6" ? "RC6" : e === "mhz" ? "MHz" : e === "mib" ? "MiB" : Ir(e)).join(" "), Tr = (e) => {
	if (!e) return;
	let t = J(e);
	return t === "unknown" ? void 0 : t;
}, Er = (e) => {
	let t = q(e), n = /(?:^|\s)(?:Docker container|Virtual machine)\s+(.+?)\s+(CPU|Memory(?: Used)?|Running)$/i.exec(t);
	if (!n) return;
	let r = n[1], i = n[2];
	if (!r || !i) return;
	let a = Dr(r), o = i.toLowerCase(), s = o === "cpu" ? "cpu_usage_percent" : o.startsWith("memory") ? "memory_usage_bytes" : "running";
	return {
		key: J(a),
		name: a,
		metric: s
	};
}, Dr = (e) => {
	let t = e.trim().split(/\s+/).filter(Boolean);
	if (t.length > 1 && t.length % 2 == 0) {
		let e = t.length / 2, n = t.slice(0, e), r = t.slice(e);
		if (n.every((e, t) => e.toLowerCase() === r[t]?.toLowerCase())) return n.join(" ");
	}
	return t.filter((e, n) => n === 0 || e.toLowerCase() !== t[n - 1]?.toLowerCase()).join(" ");
}, Or = (e) => {
	let t = String(e?.state ?? "").trim().toLowerCase();
	return t ? t === "1" || t === "on" ? "running" : t === "0" || t === "off" ? "stopped" : t : "unknown";
}, kr = (e, t) => {
	let n = Yn(e, "running");
	if (n !== void 0) return n;
	let r = String(e?.state ?? t ?? "").trim().toLowerCase();
	if (r === "1" || r === "on" || r === "running") return !0;
	if (r === "0" || r === "off" || r === "stopped" || r === "exited") return !1;
}, Ar = (e, t, n) => Tr(B(t, "project_slug") ?? B(t, "project")) || ([
	e,
	B(t, "container") ?? "",
	B(t, "image") ?? ""
].some((e) => Mr(e, n)) ? n : void 0), jr = (e, t) => [
	e.key,
	e.name ?? "",
	e.image ?? ""
].some((e) => Mr(e, t)), Mr = (e, t) => {
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = t.trim().toLowerCase(), i = r.replace(/[^a-z0-9]+/g, ""), a = n.replace(/[^a-z0-9]+/g, "");
	return n === r || a === i || Array.from(/* @__PURE__ */ new Set([
		r,
		r.replace(/-/g, "_"),
		r.replace(/_/g, "-"),
		...r.split(/[_-]+/g).filter((e) => e.length >= 4)
	])).some((e) => {
		let t = e.replace(/[^a-z0-9]+/g, "");
		return t ? n.startsWith(`${e}_`) || n.startsWith(`${e}-`) || n.endsWith(`_${e}`) || n.endsWith(`-${e}`) || n.includes(`_${e}_`) || n.includes(`-${e}-`) || a.includes(t) : !1;
	});
}, Nr = (e) => {
	let t = e.trim().toLowerCase();
	if (!t) return [];
	let n = /* @__PURE__ */ new Set(), r = (e) => {
		let t = J(e);
		t && t !== "unknown" && n.add(t);
	}, i = t.replace(/\[[^\]]+\]/g, "").replace(/^.*\//g, "").trim();
	if (!i) return [];
	r(i);
	let a = [i];
	for (; a.length > 0;) {
		let e = a.pop() ?? "";
		for (let t of [
			/^(.+)-part\d+$/,
			/^(nvme\d+n\d+)p\d+$/,
			/^(mmcblk\d+)p\d+$/,
			/^([a-z]+[a-z0-9]*)\d+$/
		]) {
			let i = e.match(t);
			if (!i?.[1]) continue;
			let o = J(i[1]);
			n.has(o) || (r(i[1]), a.push(i[1]));
		}
	}
	return Array.from(n);
}, Pr = (e) => e === "root" ? "/" : `/${e.replace(/_/g, "/")}`, Fr = (e) => e.split("_").filter(Boolean).map(Ir).join(" "), Ir = (e) => e.charAt(0).toUpperCase() + e.slice(1), J = (e) => {
	let t = e.trim().toLowerCase();
	return t ? t === "/" ? "root" : t.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown" : "unknown";
}, Y = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), Lr = (e) => {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "" : new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: !1
	}).format(t);
}, Rr = (e) => {
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? "Unavailable" : new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: !1
	}).format(t);
}, zr = (e) => `${Math.floor(e / 86400)}d ${Math.floor(e % 86400 / 3600)}h ${Math.floor(e % 3600 / 60)}m`, Br = (e) => {
	let t = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB",
		"PB"
	];
	if (!Number.isFinite(e) || e <= 0) return "0 B";
	let n = Math.min(Math.floor(Math.log(e) / Math.log(1024)), t.length - 1), r = e / 1024 ** n, i = n === 0 ? 0 : +(n >= 4);
	return `${r.toLocaleString("en-US", {
		minimumFractionDigits: i,
		maximumFractionDigits: i
	})} ${t[n]}`;
}, Vr = (e) => e.trim().toLowerCase(), X = (e) => e * 1024 ** 3, Z = (e) => e * 1024 ** 4, Q = (e) => e * 1e6, $ = (e) => e * 1e9, Hr = (e, t) => t.map((t) => Math.max(0, Number((e + t).toFixed(3)))), Ur = [
	{
		key: "gitea",
		title: "Gitea",
		cpuPercent: .3925496609109711,
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
			cpuPercent: .21,
			memoryBytes: 218 * 1024 ** 2,
			memoryLimitBytes: X(2)
		}, {
			key: "cloudflared_gitea",
			name: "cloudflared_gitea",
			image: "cloudflare/cloudflared:latest",
			status: "Up 5 days",
			state: "running",
			running: !0,
			cpuPercent: .18,
			memoryBytes: 106 * 1024 ** 2,
			memoryLimitBytes: X(1)
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
				memoryLimitBytes: X(2)
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
				memoryLimitBytes: X(1)
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
				memoryLimitBytes: X(2)
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
				memoryLimitBytes: X(2)
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
				memoryLimitBytes: X(1)
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
				memoryLimitBytes: X(2)
			}
		]
	},
	{
		key: "home-assistant",
		title: "Home Assistant",
		cpuPercent: .10272887844115354,
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
				cpuPercent: .08,
				memoryBytes: 356 * 1024 ** 2,
				memoryLimitBytes: X(3)
			},
			{
				key: "go2rtc",
				name: "go2rtc",
				image: "alexxit/go2rtc:latest",
				status: "Up 14 days",
				state: "running",
				running: !0,
				cpuPercent: .01,
				memoryBytes: 88 * 1024 ** 2,
				memoryLimitBytes: X(1)
			},
			{
				key: "mosquitto",
				name: "mosquitto",
				image: "eclipse-mosquitto:2",
				status: "Up 14 days",
				state: "running",
				running: !0,
				cpuPercent: .01,
				memoryBytes: 52 * 1024 ** 2,
				memoryLimitBytes: X(1)
			},
			{
				key: "ugos-bridge",
				name: "ugos-bridge",
				image: "rcooler/ugos-bridge:latest",
				status: "Up 14 days",
				state: "running",
				running: !0,
				cpuPercent: .01,
				memoryBytes: 116 * 1024 ** 2,
				memoryLimitBytes: X(1)
			}
		]
	},
	{
		key: "virtual_machines",
		title: "Virtual machines",
		cpuPercent: 3.4,
		memoryBytes: X(5.8),
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
				memoryBytes: X(4.1),
				memoryLimitBytes: X(8)
			},
			{
				key: "ugos-vm-ubuntu",
				name: "Ubuntu Server",
				image: "ubuntu-24.04.2-live-server-amd64",
				status: "Running",
				state: "running",
				running: !0,
				cpuPercent: .7,
				memoryBytes: X(1.7),
				memoryLimitBytes: X(4)
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
				memoryLimitBytes: X(2)
			}
		]
	},
	{
		key: "jellyfin",
		title: "Jellyfin",
		cpuPercent: .009448818897637795,
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
			cpuPercent: .01,
			memoryBytes: 256 * 1024 ** 2,
			memoryLimitBytes: X(4)
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
				memoryLimitBytes: X(2)
			},
			{
				key: "cloudflared_kuma",
				name: "cloudflared_kuma",
				image: "cloudflare/cloudflared:latest",
				status: "Up 8 days",
				state: "running",
				running: !0,
				cpuPercent: .14,
				memoryBytes: 76 * 1024 ** 2,
				memoryLimitBytes: X(1)
			},
			{
				key: "kuma_vpn",
				name: "kuma_vpn",
				image: "qmcgaw/gluetun:latest",
				status: "Up 8 days",
				state: "running",
				running: !0,
				cpuPercent: .19,
				memoryBytes: 70 * 1024 ** 2,
				memoryLimitBytes: X(1)
			}
		]
	},
	{
		key: "monitoring",
		title: "Monitoring",
		cpuPercent: 1.8076912575738409,
		memoryBytes: X(1.2),
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
				cpuPercent: .52,
				memoryBytes: 298 * 1024 ** 2,
				memoryLimitBytes: X(2)
			},
			{
				key: "prometheus",
				name: "prometheus",
				image: "prom/prometheus:latest",
				status: "Up 6 days",
				state: "running",
				running: !0,
				cpuPercent: .41,
				memoryBytes: 356 * 1024 ** 2,
				memoryLimitBytes: X(2)
			},
			{
				key: "loki",
				name: "loki",
				image: "grafana/loki:latest",
				status: "Up 6 days",
				state: "running",
				running: !0,
				cpuPercent: .18,
				memoryBytes: 184 * 1024 ** 2,
				memoryLimitBytes: X(2)
			}
		]
	},
	{
		key: "nas",
		title: "NAS",
		cpuPercent: .8259763328145205,
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
				cpuPercent: .31,
				memoryBytes: 188 * 1024 ** 2,
				memoryLimitBytes: X(1)
			},
			{
				key: "cloudflared_nas",
				name: "cloudflared_nas",
				image: "cloudflare/cloudflared:latest",
				status: "Up 20 days",
				state: "running",
				running: !0,
				cpuPercent: .21,
				memoryBytes: 94 * 1024 ** 2,
				memoryLimitBytes: X(1)
			},
			{
				key: "jinko_exporter",
				name: "jinko_exporter",
				image: "ghcr.io/example/jinko-exporter:latest",
				status: "Up 20 days",
				state: "running",
				running: !0,
				cpuPercent: .31,
				memoryBytes: 226 * 1024 ** 2,
				memoryLimitBytes: X(1)
			}
		]
	},
	{
		key: "torrent",
		title: "Torrent",
		cpuPercent: .07306297825467073,
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
			cpuPercent: .05,
			memoryBytes: 128 * 1024 ** 2,
			memoryLimitBytes: X(2)
		}, {
			key: "qbittorrent_gluetun",
			name: "qbittorrent_gluetun",
			image: "qmcgaw/gluetun:latest",
			status: "Up 12 days",
			state: "running",
			running: !0,
			cpuPercent: .02,
			memoryBytes: 56 * 1024 ** 2,
			memoryLimitBytes: X(1)
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
				cpuPercent: .31,
				memoryBytes: 146 * 1024 ** 2,
				memoryLimitBytes: X(1)
			},
			{
				key: "nginx-proxy-manager",
				name: "nginx-proxy-manager",
				image: "jc21/nginx-proxy-manager:latest",
				status: "Up 17 days",
				state: "running",
				running: !0,
				cpuPercent: .49,
				memoryBytes: 308 * 1024 ** 2,
				memoryLimitBytes: X(2)
			},
			{
				key: "php84",
				name: "php84",
				image: "php:8.4-fpm",
				status: "Up 17 days",
				state: "running",
				running: !0,
				cpuPercent: .32,
				memoryBytes: 282 * 1024 ** 2,
				memoryLimitBytes: X(2)
			}
		]
	}
], Wr = (e) => ({
	totalContainers: e.reduce((e, t) => e + t.totalContainers, 0),
	runningContainers: e.reduce((e, t) => e + t.runningContainers, 0),
	totalProjects: e.length,
	onlineProjects: e.filter((e) => e.status === "up").length
}), Gr = [{
	name: "Pool 1",
	layout: "RAID 6 | 6 Drives",
	status: "healthy",
	usedBytes: Z(10.2),
	totalBytes: Z(40.5),
	accent: T.green,
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
	usedBytes: Z(6.1),
	totalBytes: Z(8.2),
	accent: T.purple,
	key: "pool_2",
	driveSlugs: ["nvme0n1", "nvme1n1"]
}], Kr = Gr.reduce((e, t) => e + t.totalBytes, 0), qr = Gr.reduce((e, t) => e + t.usedBytes, 0), Jr = [
	{
		kind: "cpu",
		title: "CPU",
		accent: T.blue,
		valuePercent: 18,
		temperatureCelsius: 45,
		fanSpeeds: [{
			key: "ugos_it86_cpufan",
			label: "CPU Fan",
			rpm: 3139
		}],
		series: Hr(18, [
			-2.2,
			-1.8,
			.3,
			-.4,
			1.7,
			-.9,
			2.8,
			-2.1,
			1.2,
			.4
		])
	},
	{
		kind: "ram",
		title: "RAM",
		accent: T.purple,
		valuePercent: 46,
		usedBytes: X(14.6),
		totalBytes: X(32),
		series: Hr(46, [
			-2.1,
			-.5,
			1.1,
			-1.4,
			-2.2,
			1.8,
			1.4,
			.2,
			-1.1,
			1
		])
	},
	{
		kind: "gpu",
		title: "GPU",
		accent: T.green,
		valuePercent: 32,
		temperatureCelsius: 48,
		series: Hr(32, [
			-1.5,
			-1.1,
			.2,
			2,
			1.3,
			.4,
			-.8,
			1.1,
			.2,
			-1.9
		])
	},
	{
		kind: "system-load",
		title: "System Load",
		accent: T.softBlue,
		value: .78,
		valuePercent: .78,
		valueText: "0.78%",
		unit: "percent",
		statusText: "Good",
		fanSpeeds: [{
			key: "ugos_it86_sysfan1",
			label: "System Fan 1",
			rpm: 2295
		}, {
			key: "ugos_it86_sysfan2",
			label: "System Fan 2",
			rpm: 2295
		}],
		series: Hr(.78, [
			-.12,
			-.08,
			.04,
			-.03,
			.06,
			.09,
			-.04,
			.05,
			-.02,
			.07
		])
	},
	{
		kind: "total-storage",
		title: "Total Storage",
		accent: T.cyan,
		totalBytes: Kr,
		usedBytes: qr
	},
	{
		kind: "network",
		title: "Network",
		accent: T.green,
		downloadBps: $(1.2),
		uploadBps: Q(123)
	}
], Yr = [
	{
		key: "cpu",
		title: "CPU",
		subtitle: "Intel Core i5-1235U",
		accent: T.blue,
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
				label: "CPU Fan",
				value: "3139 RPM"
			},
			{
				label: "Power Usage",
				value: "18 W"
			}
		],
		series: Hr(18, [
			-2.5,
			-1.8,
			.1,
			-.6,
			1.9,
			.4,
			2.8,
			-1.9,
			1.2,
			3.3,
			-.8,
			-1.6,
			.7,
			-.9,
			0,
			1.9,
			-2.4,
			.9,
			.1,
			1.8,
			-.7
		])
	},
	{
		key: "ram",
		title: "RAM",
		subtitle: "32 GB DDR5",
		accent: T.purple,
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
		series: Hr(46, [
			-2.1,
			-1.1,
			.9,
			.1,
			-1.1,
			-2.1,
			-1.2,
			2.1,
			.3,
			1.2,
			2.9,
			1.1,
			2.1,
			-1,
			.2,
			1,
			2,
			-1.9,
			-1.1,
			.2,
			1
		])
	},
	{
		key: "gpu",
		title: "GPU",
		subtitle: "Intel Iris Xe",
		accent: T.green,
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
		series: Hr(32, [
			-3.8,
			-2,
			-1,
			1.1,
			-1,
			-2,
			2.1,
			3.8,
			1,
			.2,
			2,
			-1,
			-3,
			-2,
			1.2,
			3.1,
			2,
			.1,
			-1,
			1,
			-2
		])
	}
], Xr = [
	{
		name: "M.2 1",
		model: "Lexar NM790 1TB SSD",
		capacityBytes: X(931),
		temperatureCelsius: 40,
		status: "healthy",
		diskSlug: "nvme0n1"
	},
	{
		name: "M.2 2",
		model: "Lexar NM790 1TB SSD",
		capacityBytes: X(931),
		temperatureCelsius: 41,
		status: "healthy",
		diskSlug: "nvme1n1"
	},
	{
		name: "HDD 1",
		model: "Seagate IronWolf 12TB",
		capacityBytes: Z(10.9),
		temperatureCelsius: 36,
		status: "healthy",
		diskSlug: "sda"
	},
	{
		name: "HDD 2",
		model: "Seagate IronWolf 12TB",
		capacityBytes: Z(10.9),
		temperatureCelsius: 37,
		status: "healthy",
		diskSlug: "sdb"
	},
	{
		name: "HDD 3",
		model: "Seagate IronWolf 12TB",
		capacityBytes: Z(10.9),
		temperatureCelsius: 36,
		status: "healthy",
		diskSlug: "sdc"
	},
	{
		name: "HDD 4",
		model: "Seagate IronWolf 12TB",
		capacityBytes: Z(10.9),
		temperatureCelsius: 37,
		status: "healthy",
		diskSlug: "sdd"
	},
	{
		name: "HDD 5",
		model: "Seagate IronWolf 12TB",
		capacityBytes: Z(10.9),
		temperatureCelsius: 36,
		status: "healthy",
		diskSlug: "sde"
	},
	{
		name: "HDD 6",
		model: "Seagate IronWolf 12TB",
		capacityBytes: Z(10.9),
		temperatureCelsius: 37,
		status: "healthy",
		diskSlug: "sdf"
	}
], Zr = [
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
], Qr = [
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
], $r = [
	{
		key: "blitter",
		label: "Blitter",
		busyPercent: 4.2,
		semaPercent: .3,
		waitPercent: .8
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
		semaPercent: .6,
		waitPercent: 1.1
	},
	{
		key: "video-enhance",
		label: "VideoEnhance",
		busyPercent: 7.9,
		semaPercent: .1,
		waitPercent: .4
	}
], ei = [
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
], ti = [
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
		cpuPercent: .96,
		memoryBytes: 228 * 1024 ** 2,
		cpuTimeSeconds: 2311.9
	},
	{
		key: "smbd",
		name: "smbd",
		processCount: 3,
		cpuPercent: .63,
		memoryBytes: 96 * 1024 ** 2,
		cpuTimeSeconds: 418.5
	},
	{
		key: "redis-server",
		name: "redis-server",
		processCount: 1,
		cpuPercent: .31,
		memoryBytes: 48 * 1024 ** 2,
		cpuTimeSeconds: 702.2
	},
	{
		key: "prometheus",
		name: "prometheus",
		processCount: 1,
		cpuPercent: .22,
		memoryBytes: 354 * 1024 ** 2,
		cpuTimeSeconds: 1550.7
	}
], ni = [
	{
		timestampLabel: "14:25",
		totalsByInterface: {
			bond0: $(1.2),
			eth0: Q(430),
			eth1: Q(780)
		}
	},
	{
		timestampLabel: "14:25",
		totalsByInterface: {
			bond0: $(1.24),
			eth0: Q(440),
			eth1: Q(800)
		}
	},
	{
		timestampLabel: "14:25",
		totalsByInterface: {
			bond0: $(1.18),
			eth0: Q(410),
			eth1: Q(770)
		}
	},
	{
		timestampLabel: "14:26",
		totalsByInterface: {
			bond0: $(1.28),
			eth0: Q(455),
			eth1: Q(825)
		}
	},
	{
		timestampLabel: "14:26",
		totalsByInterface: {
			bond0: $(1.31),
			eth0: Q(468),
			eth1: Q(840)
		}
	},
	{
		timestampLabel: "14:26",
		totalsByInterface: {
			bond0: $(1.27),
			eth0: Q(452),
			eth1: Q(818)
		}
	},
	{
		timestampLabel: "14:27",
		totalsByInterface: {
			bond0: $(1.35),
			eth0: Q(489),
			eth1: Q(861)
		}
	},
	{
		timestampLabel: "14:27",
		totalsByInterface: {
			bond0: $(1.33),
			eth0: Q(474),
			eth1: Q(852)
		}
	},
	{
		timestampLabel: "14:27",
		totalsByInterface: {
			bond0: $(1.39),
			eth0: Q(495),
			eth1: Q(890)
		}
	},
	{
		timestampLabel: "14:28",
		totalsByInterface: {
			bond0: $(1.3),
			eth0: Q(462),
			eth1: Q(834)
		}
	},
	{
		timestampLabel: "14:28",
		totalsByInterface: {
			bond0: $(1.26),
			eth0: Q(448),
			eth1: Q(805)
		}
	},
	{
		timestampLabel: "14:29",
		totalsByInterface: {
			bond0: $(1.41),
			eth0: Q(508),
			eth1: Q(902)
		}
	},
	{
		timestampLabel: "14:29",
		totalsByInterface: {
			bond0: $(1.44),
			eth0: Q(516),
			eth1: Q(925)
		}
	},
	{
		timestampLabel: "14:30",
		totalsByInterface: {
			bond0: $(1.37),
			eth0: Q(492),
			eth1: Q(876)
		}
	},
	{
		timestampLabel: "14:30",
		totalsByInterface: {
			bond0: $(1.46),
			eth0: Q(521),
			eth1: Q(938)
		}
	}
], ri = {
	deviceInfo: {
		model: "DXP6800 Pro",
		ugosVersion: "1.2.0",
		hostname: "DXP6800PRO",
		ipAddress: "192.168.1.100",
		uptimeSeconds: 1104120,
		lastUpdated: "2026-04-23 20:30"
	},
	hardwareSummary: Jr,
	hardwareDetails: Yr,
	drives: Xr,
	storagePools: Gr,
	dockerProjects: Ur,
	dockerTotals: Wr(Ur),
	networkInterfaces: [
		{
			name: "bond0",
			status: "up",
			linkSpeedMbps: 5e3,
			temperatureCelsius: 38,
			downloadBps: Q(620),
			uploadBps: Q(580)
		},
		{
			name: "eth0",
			status: "up",
			linkSpeedMbps: 2500,
			temperatureCelsius: 37,
			downloadBps: Q(240),
			uploadBps: Q(190)
		},
		{
			name: "eth1",
			status: "up",
			linkSpeedMbps: 2500,
			temperatureCelsius: 39,
			downloadBps: Q(380),
			uploadBps: Q(400)
		}
	],
	networkTrafficHistory: ni,
	networkTrafficLines: [
		{
			key: "bond0",
			label: "bond0",
			color: T.cyan,
			currentBps: $(1.46),
			series: ni.map((e) => e.totalsByInterface.bond0 ?? 0)
		},
		{
			key: "eth0",
			label: "eth0",
			color: T.good,
			currentBps: Q(521),
			series: ni.map((e) => e.totalsByInterface.eth0 ?? 0)
		},
		{
			key: "eth1",
			label: "eth1",
			color: T.purple,
			currentBps: Q(938),
			series: ni.map((e) => e.totalsByInterface.eth1 ?? 0)
		}
	],
	cpuCores: Zr,
	ramBreakdown: Qr,
	gpuEngines: $r,
	gpuStats: ei,
	topProcesses: ti
}, ii = () => ({
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
			accent: T.blue,
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
			accent: T.purple,
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
			accent: T.softBlue,
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
			accent: T.cyan,
			totalBytes: 0,
			usedBytes: 0
		},
		{
			kind: "network",
			title: "Network",
			accent: T.green,
			downloadBps: 0,
			uploadBps: 0
		}
	],
	hardwareDetails: [{
		key: "cpu",
		title: "CPU",
		subtitle: "No live data",
		accent: T.blue,
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
		accent: T.purple,
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
}), ai = o`
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

  .tile-body-with-fans {
    height: auto;
  }

  .fan-speeds {
    display: grid;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--ugreen-border);
    min-width: 0;
  }

  .fan-speed-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 6px;
    font-size: 11px;
    line-height: 1.3;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .fan-label {
    flex: 1 1 4.5em;
    min-width: 0;
    color: var(--ugreen-text-dim);
  }

  .fan-rpm {
    min-width: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
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
    .traffic-row,
    .fan-speed-row {
      font-size: 10px;
    }
  }
`, oi = [
	"B",
	"KB",
	"MB",
	"GB",
	"TB",
	"PB"
], si = [
	"bps",
	"Kbps",
	"Mbps",
	"Gbps",
	"Tbps"
], ci = (e, t) => new Intl.NumberFormat("en-US", {
	minimumFractionDigits: t,
	maximumFractionDigits: t
}).format(e), li = (e, t = 0) => `${ci(e, t)}%`, ui = (e, t = 1) => {
	if (!Number.isFinite(e) || e <= 0) return "0 B";
	let n = Math.min(Math.floor(Math.log(e) / Math.log(1024)), oi.length - 1);
	return `${ci(e / 1024 ** n, n === 0 ? 0 : t)} ${oi[n]}`;
}, di = (e) => ui(e, +(e >= 1024 ** 4)), fi = (e, t = 1) => {
	if (!Number.isFinite(e) || e <= 0) return "0 bps";
	let n = Math.min(Math.floor(Math.log(e) / Math.log(1e3)), si.length - 1);
	return `${ci(e / 1e3 ** n, n === 0 ? 0 : t)} ${si[n]}`;
}, pi = (e) => `${ci(e, 0)}°C`, mi = (e, t) => `${di(e)} / ${di(t)}`, hi = (e, t) => t > 0 ? e / t * 100 : 0, gi = (e) => e.kind === "cpu" || e.kind === "gpu", _i = (e) => e.kind === "ram", vi = (e) => e.kind === "system-load", yi = (e) => Math.max(0, Math.min(1, e)), bi = (e) => {
	let t = e.drives.reduce((e, t) => (t.mediaType === "nvme" ? e.nvme += t.capacityBytes : t.mediaType === "hdd" && (e.sata += t.capacityBytes), e), {
		nvme: 0,
		sata: 0
	}), n = {
		nvme: {
			totalBytes: 0,
			usedBytes: 0
		},
		sata: {
			totalBytes: 0,
			usedBytes: 0
		}
	}, r = [...e.storagePools];
	for (let t of e.storagePools) {
		let e = xi(t.name, t.layout);
		e && (n[e].totalBytes += t.totalBytes, n[e].usedBytes += t.usedBytes, r.splice(r.indexOf(t), 1));
	}
	for (let e of r) {
		let r = Si(e.totalBytes, t, n);
		n[r].totalBytes += e.totalBytes, n[r].usedBytes += e.usedBytes;
	}
	return n;
}, xi = (e, t) => {
	let n = `${e} ${t}`.toLowerCase();
	return n.includes("nvme") || n.includes("m.2") || n.includes("ssd") ? "nvme" : n.includes("sata") || n.includes("hdd") ? "sata" : null;
}, Si = (e, t, n) => ["nvme", "sata"].filter((e) => t[e] > 0).map((r) => ({
	media: r,
	distance: Math.abs(t[r] - n[r].totalBytes - e)
})).sort((e, t) => e.distance - t.distance)[0]?.media ?? "sata", Ci = (e, t, n, r, i) => {
	let a = r > 0 ? yi(hi(i, r) / 100) : 0;
	return {
		id: e,
		label: t,
		icon: "database",
		accent: n,
		value: di(r),
		secondary: r > 0 ? mi(i, r) : "Unavailable",
		progress: a
	};
}, wi = (e) => {
	let t = e.networkInterfaces.map((e) => e.name), n = e.networkInterfaces.reduce((e, t) => e + t.downloadBps, 0), r = e.networkInterfaces.reduce((e, t) => e + t.uploadBps, 0), i = e.networkInterfaces.filter((e) => e.status === "up").length, a = e.networkInterfaces.length;
	return {
		id: "network",
		label: "Network State",
		icon: "network",
		accent: T.softBlue,
		value: a > 0 ? `${i}/${a} Up` : "Unavailable",
		secondary: t.length > 0 ? t.join(" | ") : "No interfaces",
		down: fi(n),
		up: fi(r)
	};
}, Ti = (e) => {
	switch (e) {
		case "live": return {
			label: "Online",
			color: "var(--ugreen-green)"
		};
		case "missing": return {
			label: "No Data",
			color: "#ffd84d"
		};
		default: return {
			label: "Preview",
			color: "var(--ugreen-soft-blue)"
		};
	}
}, Ei = (e, t, n) => {
	let r = e.hardwareSummary.filter(gi).find((e) => e.kind === "cpu"), i = e.hardwareSummary.filter(_i).find((e) => e.kind === "ram"), a = e.hardwareSummary.filter(gi).find((e) => e.kind === "gpu"), o = e.hardwareSummary.filter(vi).find((e) => e.kind === "system-load"), s = Ti(t), c = bi(e), l = [
		{
			id: "cpu",
			label: "CPU",
			icon: "chip",
			accent: T.blue,
			value: li(r?.valuePercent ?? 0),
			secondary: r ? pi(r.temperatureCelsius) : "Unavailable",
			progress: yi((r?.valuePercent ?? 0) / 100),
			fanSpeeds: r?.fanSpeeds
		},
		{
			id: "ram",
			label: "RAM",
			icon: "memory",
			accent: T.purple,
			value: li(i?.valuePercent ?? 0),
			secondary: i ? mi(i.usedBytes, i.totalBytes) : "Unavailable",
			progress: yi((i?.valuePercent ?? 0) / 100)
		},
		{
			id: "gpu",
			label: "GPU",
			icon: "gpu",
			accent: T.green,
			value: a ? li(a.valuePercent) : "N/A",
			secondary: a ? pi(a.temperatureCelsius) : "Unavailable",
			progress: yi((a?.valuePercent ?? 0) / 100)
		},
		{
			id: "systemLoad",
			label: "Load",
			icon: "pulse",
			accent: T.softBlue,
			value: o?.valueText ?? "0.00",
			secondary: o?.statusText ?? "Unavailable",
			progress: yi((o?.valuePercent ?? 0) / 100),
			fanSpeeds: o?.fanSpeeds
		},
		Ci("nvme", "NVMe Volume", T.cyan, c.nvme.totalBytes, c.nvme.usedBytes),
		Ci("sata", "SATA Volume", T.green, c.sata.totalBytes, c.sata.usedBytes),
		wi(e)
	];
	return {
		title: e.deviceInfo.model,
		statusLabel: s.label,
		statusColor: s.color,
		metricTiles: l
	};
}, Di = (e) => Ei(ri, "preview", e);
// \0@oxc-project+runtime@0.156.0/helpers/esm/decorate.js
function Oi(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
// src/ugreen-nas-mini-card.ts
var ki = class extends Ve {
	constructor(...e) {
		super(...e), this.config = { type: "custom:ugreen-nas-mini-card" }, this.model = Di(), this.history = pt(), this.dataMode = "preview", this.watchEntityIds = [], this.watchPrefixes = [];
	}
	static {
		this.styles = ai;
	}
	set hass(e) {
		let t = this._hass;
		this.shouldRefreshForHassUpdate(t, e) ? (this._hass = e, this.requestUpdate("hass", t), this.refreshModel()) : this._hass = e;
	}
	get hass() {
		return this._hass;
	}
	setConfig(e) {
		if (!e || typeof e != "object") throw Error("Invalid configuration");
		this.config = {
			title: "UGREEN NAS",
			...e
		}, this.refreshModel();
	}
	getCardSize() {
		return 2;
	}
	render() {
		return b`
      <ha-card>
        <div class="card-shell">
          <section class="metrics">
            ${this.renderIdentityTile()}
            ${this.model.metricTiles.map((e) => this.renderMetricTile(e))}
          </section>
        </div>
      </ha-card>
    `;
	}
	renderIdentityTile() {
		return b`
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
        ${this.renderProgress(this.model.statusLabel === "Online" ? 1 : this.model.statusLabel === "No Data" ? .45 : .7, this.model.statusColor)}
      </article>
    `;
	}
	renderMetricTile(e) {
		let t = e.id === "cpu" || e.id === "gpu" || e.id === "systemLoad" ? "tile-secondary success" : "tile-secondary";
		return b`
      <article class="tile">
        <div class=${e.fanSpeeds?.length ? "tile-body tile-body-with-fans" : "tile-body"}>
          <div class="tile-top">
            ${this.renderIcon(e.icon, `icon icon-${e.icon} accent`)}
            <div class="tile-label">${e.label}</div>
          </div>

          ${e.value ? b`<div class="tile-value">${e.value}</div>` : C}
          ${e.secondary ? b`<div class=${t}>${e.secondary}</div>` : C}

          ${typeof e.progress == "number" ? this.renderProgress(e.progress, e.accent) : C}
          ${e.down || e.up ? this.renderNetworkRows(e.down, e.up) : C}
          ${e.fanSpeeds?.length ? b`
            <div class="fan-speeds">
              ${e.fanSpeeds.map((e) => b`
                <div class="fan-speed-row">
                  <span class="fan-label">${e.label}</span>
                  <span class="fan-rpm">${Math.round(e.rpm)} RPM</span>
                </div>
              `)}
            </div>
          ` : C}
        </div>
      </article>
    `;
	}
	renderProgress(e, t) {
		return b`
      <div class="progress-bar" aria-hidden="true">
        <div
          class="progress-fill"
          style=${`width:${Math.max(0, Math.min(1, e)) * 100}%; --progress-color:${t}; box-shadow:0 0 10px ${t}55;`}
        ></div>
      </div>
    `;
	}
	renderNetworkRows(e, t) {
		return b`
      <div class="network-lines">
        ${e ? b`
          <div class="traffic-row down">
            ${this.renderArrowDown()}
            <span>${e}</span>
          </div>
        ` : C}
        ${t ? b`
          <div class="traffic-row up">
            ${this.renderArrowUp()}
            <span>${t}</span>
          </div>
        ` : C}
      </div>
    `;
	}
	refreshModel() {
		let e = mt(this._hass, this.config, this.history);
		if (e) this.history = e.history, this.watchEntityIds = e.watchEntityIds, this.watchPrefixes = e.watchPrefixes, this.model = Ei(e.model, "live", this.config), this.dataMode = "live";
		else if (this.history = pt(), this.watchEntityIds = [], this.watchPrefixes = [], this._hass?.states) {
			let e = ii();
			e.deviceInfo = {
				...e.deviceInfo,
				model: this.config.deviceModel ?? e.deviceInfo.model,
				hostname: this.config.host ?? e.deviceInfo.hostname
			}, this.model = Ei(e, "missing", this.config), this.dataMode = "missing";
		} else this.model = Di(this.config), this.dataMode = "preview";
	}
	shouldRefreshForHassUpdate(e, t) {
		let n = e?.states, r = t?.states;
		return !n || !r || this.watchEntityIds.length === 0 && this.watchPrefixes.length === 0 || this.countWatchedEntities(n) !== this.countWatchedEntities(r) || this.watchEntityIds.some((e) => n[e] !== r[e]);
	}
	countWatchedEntities(e) {
		let t = 0;
		for (let n of Object.keys(e)) (this.watchPrefixes.some((e) => n.startsWith(e)) || Lt(n, e[n])) && (t += 1);
		return t;
	}
	renderArrowDown() {
		return x`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 11.5 10 16l5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
	}
	renderArrowUp() {
		return x`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 17V6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 8.5 10 4l5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
	}
	renderIcon(e, t) {
		switch (e) {
			case "chip": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3M4 4l2 2M18 18l2 2M20 4l-2 2M4 20l2-2"></path></svg>`;
			case "memory": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"></rect><path d="M7 10v4M11 10v4M15 10v4M19 10v4M5 19v2M9 19v2M13 19v2M17 19v2"></path></svg>`;
			case "gpu": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="9" cy="11" r="2.2"></circle><path d="M16 9.5h2M16 12.5h2M8 18h8"></path></svg>`;
			case "pulse": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.2-6 4 12 2.2-8H22"></path></svg>`;
			case "database": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></svg>`;
			case "network": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="3" width="4" height="4" rx="1"></rect><rect x="3" y="16" width="4" height="4" rx="1"></rect><rect x="17" y="16" width="4" height="4" rx="1"></rect><path d="M12 7v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path></svg>`;
			case "device": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M9 2h6"></path></svg>`;
			case "clock": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path></svg>`;
			case "monitor": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 17v3"></path></svg>`;
			case "calendar": return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 9h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01"></path></svg>`;
			default: return x`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle></svg>`;
		}
	}
};
Oi([qe()], ki.prototype, "config", void 0), Oi([qe()], ki.prototype, "model", void 0), Oi([qe()], ki.prototype, "history", void 0), Oi([qe()], ki.prototype, "dataMode", void 0), Oi([Ke({ attribute: !1 })], ki.prototype, "hass", null), ki = Oi([Ue("ugreen-nas-mini-card")], ki);
