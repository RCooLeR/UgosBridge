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
var ce = class extends HTMLElement {
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
ce.elementStyles = [], ce.shadowRootOptions = { mode: "open" }, ce[ie("elementProperties")] = /* @__PURE__ */ new Map(), ce[ie("finalized")] = /* @__PURE__ */ new Map(), re?.({ ReactiveElement: ce }), (ee.reactiveElementVersions ??= []).push("2.1.2");
// ../node_modules/lit-html/lit-html.js
var le = globalThis, h = (e) => e, ue = le.trustedTypes, de = ue ? ue.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, fe = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, pe = "?" + g, me = `<${pe}>`, _ = document, he = () => _.createComment(""), ge = (e) => e === null || typeof e != "object" && typeof e != "function", _e = Array.isArray, ve = (e) => _e(e) || typeof e?.[Symbol.iterator] == "function", ye = "[ 	\n\f\r]", be = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, xe = /-->/g, Se = />/g, v = RegExp(`>|${ye}(?:([^\\s"'>=/]+)(${ye}*=${ye}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), Ce = /'/g, we = /"/g, Te = /^(?:script|style|textarea|title)$/i, Ee = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), y = Ee(1), b = Ee(2), x = Symbol.for("lit-noChange"), S = Symbol.for("lit-nothing"), De = /* @__PURE__ */ new WeakMap(), C = _.createTreeWalker(_, 129);
function Oe(e, t) {
	if (!_e(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return de === void 0 ? t : de.createHTML(t);
}
var ke = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = be;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === be ? c[1] === "!--" ? o = xe : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = v) : (Te.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = v) : o = Se : o === v ? c[0] === ">" ? (o = i ?? be, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? v : c[3] === "\"" ? we : Ce) : o === we || o === Ce ? o = v : o === xe || o === Se ? o = be : (o = v, i = void 0);
		let d = o === v && e[t + 1].startsWith("/>") ? " " : "";
		a += o === be ? n + me : l >= 0 ? (r.push(s), n.slice(0, l) + fe + n.slice(l) + g + d) : n + g + (l === -2 ? t : d);
	}
	return [Oe(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Ae = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ke(t, n);
		if (this.el = e.createElement(l, r), C.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = C.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(fe)) {
					let t = u[o++], n = i.getAttribute(e).split(g), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Fe : r[1] === "?" ? Ie : r[1] === "@" ? Le : Pe
					}), i.removeAttribute(e);
				} else e.startsWith(g) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Te.test(i.tagName)) {
					let e = i.textContent.split(g), t = e.length - 1;
					if (t > 0) {
						i.textContent = ue ? ue.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], he()), C.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], he());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === pe) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(g, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += g.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = _.createElement("template");
		return n.innerHTML = e, n;
	}
};
function je(e, t, n = e, r) {
	if (t === x) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = ge(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = je(e, i._$AS(e, t.values), i, r)), t;
}
var Me = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? _).importNode(t, !0);
		C.currentNode = r;
		let i = C.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Ne(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Re(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = C.nextNode(), a++);
		}
		return C.currentNode = _, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Ne = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = S, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = je(this, e, t), ge(e) ? e === S || e == null || e === "" ? (this._$AH !== S && this._$AR(), this._$AH = S) : e !== this._$AH && e !== x && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ve(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== S && ge(this._$AH) ? this._$AA.nextSibling.data = e : this.T(_.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Ae.createElement(Oe(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Me(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = De.get(e.strings);
		return t === void 0 && De.set(e.strings, t = new Ae(e)), t;
	}
	k(t) {
		_e(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(he()), this.O(he()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = h(e).nextSibling;
			h(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, Pe = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = S, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = S;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = je(this, e, t, 0), a = !ge(e) || e !== this._$AH && e !== x, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = je(this, r[n + o], t, o), s === x && (s = this._$AH[o]), a ||= !ge(s) || s !== this._$AH[o], s === S ? e = S : e !== S && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === S ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Fe = class extends Pe {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === S ? void 0 : e;
	}
}, Ie = class extends Pe {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== S);
	}
}, Le = class extends Pe {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = je(this, e, t, 0) ?? S) === x) return;
		let n = this._$AH, r = e === S && n !== S || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== S && (n === S || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Re = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		je(this, e);
	}
}, ze = le.litHtmlPolyfillSupport;
ze?.(Ae, Ne), (le.litHtmlVersions ??= []).push("3.3.3");
var Be = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Ne(t.insertBefore(he(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ve = globalThis, He = class extends ce {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Be(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return x;
	}
};
He._$litElement$ = !0, He.finalized = !0, Ve.litElementHydrateSupport?.({ LitElement: He });
var Ue = Ve.litElementPolyfillSupport;
Ue?.({ LitElement: He }), (Ve.litElementVersions ??= []).push("4.2.2");
// ../node_modules/@lit/reactive-element/decorators/custom-element.js
var We = (e) => (t, n) => {
	n === void 0 ? customElements.define(e, t) : n.addInitializer(() => {
		customElements.define(e, t);
	});
}, Ge = {
	attribute: !0,
	type: String,
	converter: ae,
	reflect: !1,
	hasChanged: oe
}, Ke = (e = Ge, t, n) => {
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
function qe(e) {
	return (t, n) => typeof n == "object" ? Ke(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
// ../node_modules/@lit/reactive-element/decorators/state.js
function Je(e) {
	return qe({
		...e,
		state: !0,
		attribute: !1
	});
}
// ../detailed/src/theme.ts
var w = {
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
}, Ye = [
	w.green,
	w.cyan,
	w.purple,
	w.softBlue
], Xe = (e) => Ye[e % Ye.length] ?? w.green, Ze = /^sensor\.ugos_bridge_host_(.+?)_cpu_usage_percent$/, Qe = /^sensor\.ugos_bridge_project_(.+?)_cpu_usage_percent$/, $e = /^sensor\.([a-z0-9_]+)_\1_cpu(?:_|$)/, et = /^(?:sensor|binary_sensor)\.ugos_bridge_host_(.+?)_(?:array|bond|container|cooling|disk|filesystem|gpu|health|network|process|project|software|ups|vm)_/, tt = /^(?:container|process|project|vm)(?:_|$)/, nt = /^(?:container|project|vm)_/, rt = [
	"compose_project_",
	"docker_container_",
	"project_",
	"virtual_machine_",
	"virtual_machines_"
], it = /^(?:sensor|binary_sensor)\.([a-z0-9_]+)_(?:array|bond|cooling|disk|filesystem|gpu|health|network|software|ups)_[a-z0-9][a-z0-9_]*_[a-z0-9_]+(?:_\d+)?$/, at = /^(?:sensor|binary_sensor)\.ugos_bridge_container_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/, ot = /^(?:sensor|binary_sensor)\.ugos_bridge_vm_(.+?)_(cpu_usage_percent|memory_usage_bytes|running)$/, st = /^sensor\.ugos_bridge_process_(.+?)_(process_count|cpu_usage_percent|memory_usage_bytes|cpu_time_seconds)$/, ct = {
	cpu: "cpu_usage_percent",
	load1: "load_1",
	cpufreq: "cpu_frequency_mhz",
	memoryUsedBytes: "memory_used_bytes",
	memoryUsedPercent: "memory_used_percent",
	swapUsedPercent: "swap_used_percent",
	uptime: "uptime_seconds"
}, lt = /* @__PURE__ */ new WeakMap(), ut = /* @__PURE__ */ new WeakMap(), dt = (e) => {
	let t = lt.get(e);
	return t || (t = {
		prefixEntries: /* @__PURE__ */ new Map(),
		computedResults: /* @__PURE__ */ new Map(),
		resolutionResults: /* @__PURE__ */ new Map(),
		booleanResults: /* @__PURE__ */ new Map()
	}, lt.set(e, t)), t;
}, T = (e) => {
	let t = dt(e);
	return t.keys ||= Object.keys(e), t.keys;
}, E = (e) => {
	let t = dt(e);
	return t.entries ||= Object.entries(e), t.entries;
}, D = (e) => {
	let t = dt(e);
	return t.values ||= Object.values(e), t.values;
}, ft = (e, t) => {
	let n = dt(e), r = n.prefixEntries.get(t);
	if (r) return r;
	let i = E(e).filter(([e]) => e.startsWith(t));
	return n.prefixEntries.set(t, i), i;
}, O = (e, t) => Array.from(new Map(t.flatMap((t) => ft(e, t))).entries()), k = (e, t) => t.find((t) => Jn(e[t])), A = (e, t, n, r = "sensor.") => {
	let i = J(n);
	return E(e).filter(([e, n]) => {
		if (!e.startsWith(r)) return !1;
		let a = e.toLowerCase();
		return J(z(n, "name") ?? "") === i || a.includes(`_${t}_${i}_`) || a.includes(`ugos_bridge_${t}_${i}_`);
	});
}, j = (e, t) => I(e, t) ?? I(e, {
	...t,
	unit: void 0
}), M = (e, t, n) => {
	let r = dt(e), i = r.computedResults.get(t);
	if (i !== void 0) return i;
	let a = n();
	return r.computedResults.set(t, a), a;
}, N = (e, t, n) => {
	let r = dt(e);
	if (r.resolutionResults.has(t)) return r.resolutionResults.get(t);
	let i = n();
	return r.resolutionResults.set(t, i), i;
}, pt = (e) => {
	if (!e) return;
	let t = ut.get(e), n = typeof e.attributes.friendly_name == "string" ? e.attributes.friendly_name : "", r = nr(typeof e.attributes.unit_of_measurement == "string" ? e.attributes.unit_of_measurement : void 0);
	return !t || t.friendlyName !== n || t.unit !== r ? (t = {
		friendlyName: n,
		friendlyNameLower: n.toLowerCase(),
		state: e.state,
		unit: r
	}, ut.set(e, t)) : t.state !== e.state && (t.state = e.state, t.parsedNumber = void 0, t.textState = void 0), t;
}, mt = () => ({ samples: [] }), ht = (e, t, n) => {
	let r = e?.states;
	if (!r) return null;
	lt.delete(r);
	let i = Ht(r, t?.host);
	if (!i) return null;
	let a = `ugos_bridge_host_${i}`, o = P(r, i, "cpu"), s = P(r, i, "memoryUsedBytes"), c = cn(r, i, "cpu") ?? 0, l = ln(r, i), u = l.value, d = cn(r, i, "cpufreq"), f = cn(r, i, "uptime") ?? 0, p = cn(r, i, "memoryUsedBytes") ?? 0, m = cn(r, i, "memoryUsedPercent") ?? 0, ee = cn(r, i, "swapUsedPercent") ?? 0, te = Kt(p, m, t?.memoryTotalBytes), ne = Wt(r, i, t?.host), re = wt(r, o), ie = Tt(r, s, te, p), ae = Un(r, i), oe = Ot(ae, r[o ?? ""]), se = Lt(r, i), ce = An(se, [
		"cpu",
		"package",
		"soc",
		"core",
		"tctl"
	]), le = Vt(r, i), h = on(r, i, a)[0], ue = h === void 0 ? void 0 : xn(r, i, a, h, "busy"), de = h === void 0 ? void 0 : xn(r, i, a, h, "current"), fe = h === void 0 ? void 0 : xn(r, i, a, h, "max"), g = h === void 0 ? void 0 : yr(r, i, a, h), pe = h === void 0 ? void 0 : R(r, de), me = h === void 0 ? void 0 : R(r, fe), _ = An(se, [
		"gpu",
		"graphics",
		"igpu",
		"intel"
	]), he = h === void 0 ? [] : Sn(r, i, a, h, [
		ue,
		de,
		fe
	]), ge = Et(r, he), _e = Dt(r, he), ve = qt(Pt(r, i), t?.storageFilesystems), ye = Xt(r, i, a).map((e) => _t(r, i, ne, e)).filter((e) => e !== null).sort((e, t) => e.name.localeCompare(t.name)), be = vt(Ft(r, i), ve, ye), xe = Yt(ae), Se = Array.from(new Set(xe)).map((e) => yt(ae, e)).filter((e) => e !== null).sort((e, t) => t.cpuPercent - e.cpuPercent || e.title.localeCompare(t.title)), v = Qt(r, i, a), Ce = $t(r, i, a), we = Jt(en(Array.from(/* @__PURE__ */ new Set([...v, ...Ce])).sort(), t?.networkInterfaces), t?.networkInterfaces), Te = we.map((e) => v.includes(e) ? Mt(r, i, e, se) : Nt(r, i, e, se)).filter((e) => e !== null).sort((e, t) => e.name.localeCompare(t.name)), Ee = we.filter((e) => v.includes(e)), y = Ee.length > 0 ? Ee : v, b = y.reduce((e, t) => e + (R(r, _n(r, i, t, "rx")) ?? 0) * 8, 0), x = y.reduce((e, t) => e + (R(r, _n(r, i, t, "tx")) ?? 0) * 8, 0), S = tn(we), De = Object.fromEntries(S.map((e) => [e, rn(r, i, e)])), C = (o ? r[o]?.last_updated : void 0) ?? (o ? r[o]?.last_changed : void 0) ?? `${c}:${m}:${g ?? 0}:${b}:${x}:${JSON.stringify(De)}`, Oe = Dn(n, {
		key: C,
		timestampLabel: Lr(C),
		cpuPercent: c,
		ramPercent: m,
		gpuPercent: g ?? 0,
		load1: u,
		networkBpsBySlug: De
	}), ke = On(Oe.samples.map((e) => e.cpuPercent), c, 12), Ae = On(Oe.samples.map((e) => e.ramPercent), m, 12), je = On(Oe.samples.map((e) => e.gpuPercent), g ?? 0, 12), Me = On(Oe.samples.map((e) => e.load1), u, 12), Ne = kn(Oe.samples, S, De), Pe = S.map((e, t) => ({
		key: e,
		label: Vr(e),
		color: an(e, t),
		currentBps: De[e] ?? 0,
		series: Ne.map((t) => t.totalsByInterface[e] ?? 0)
	})), Fe = [
		{
			kind: "cpu",
			title: "CPU",
			accent: w.blue,
			valuePercent: c,
			temperatureCelsius: ce ?? 0,
			fanSpeeds: le.cpu.length > 0 ? le.cpu : void 0,
			series: ke
		},
		{
			kind: "ram",
			title: "RAM",
			accent: w.purple,
			valuePercent: m,
			usedBytes: p,
			totalBytes: te,
			series: Ae
		},
		...g === void 0 ? [] : [{
			kind: "gpu",
			title: "GPU",
			accent: w.green,
			valuePercent: g,
			temperatureCelsius: _ ?? 0,
			series: je
		}],
		{
			kind: "system-load",
			title: "System Load",
			accent: w.softBlue,
			value: u,
			valuePercent: l.valuePercent,
			valueText: l.valueText,
			unit: l.unit,
			statusText: l.statusText,
			fanSpeeds: le.system.length > 0 ? le.system : void 0,
			series: Me
		},
		{
			kind: "network",
			title: "Network",
			accent: w.green,
			downloadBps: b,
			uploadBps: x
		}
	], Ie = gt({
		cpuFans: le.cpu,
		cpuFrequencyMHz: d,
		cpuPercent: c,
		cpuSeries: ke,
		cpuTemperature: ce,
		gpuBusyPercent: g,
		gpuCurrentMHz: pe,
		gpuMaxMHz: me,
		gpuSeries: je,
		gpuTemperature: _,
		load1: u,
		loadValueText: l.valueText,
		memoryTotalBytes: te,
		memoryUsedBytes: p,
		memoryUsedPercent: m,
		ramSeries: Ae,
		swapUsedPercent: ee,
		uptimeSeconds: f
	}), Le = Wn(i);
	return {
		history: Oe,
		watchEntityIds: Gn(r, Le, t?.ipEntity, i),
		watchPrefixes: Le,
		model: {
			deviceInfo: {
				model: t?.deviceModel ?? "UGREEN NAS",
				ugosVersion: t?.ugosVersion ?? "Unavailable",
				hostname: ne,
				ipAddress: Gt(r, t),
				uptimeSeconds: f,
				lastUpdated: Rr(C)
			},
			hardwareSummary: Fe,
			hardwareDetails: Ie,
			drives: ye,
			storagePools: be,
			dockerProjects: Se,
			dockerTotals: {
				totalContainers: Se.reduce((e, t) => e + t.totalContainers, 0),
				runningContainers: Se.reduce((e, t) => e + t.runningContainers, 0),
				totalProjects: Se.length,
				onlineProjects: Se.filter((e) => e.status === "up").length
			},
			networkInterfaces: Te,
			networkTrafficHistory: Ne,
			networkTrafficLines: Pe,
			cpuCores: re,
			ramBreakdown: ie,
			gpuEngines: ge,
			gpuStats: _e,
			topProcesses: oe
		}
	};
}, gt = ({ cpuFans: e, cpuFrequencyMHz: t, cpuPercent: n, cpuSeries: r, cpuTemperature: i, gpuBusyPercent: a, gpuCurrentMHz: o, gpuMaxMHz: s, gpuSeries: c, gpuTemperature: l, load1: u, loadValueText: d, memoryTotalBytes: f, memoryUsedBytes: p, memoryUsedPercent: m, ramSeries: ee, swapUsedPercent: te, uptimeSeconds: ne }) => {
	let re = [{
		key: "cpu",
		title: "CPU",
		subtitle: "System Processor",
		accent: w.blue,
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
		accent: w.purple,
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
		accent: w.green,
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
}, _t = (e, t, n, r) => {
	let i = fn(e, t, r, "size"), a = R(e, i), o = R(e, fn(e, t, r, "temperature")), s = R(e, fn(e, t, r, "read")), c = R(e, fn(e, t, r, "write")), l = R(e, fn(e, t, r, "busy")), u = Yn(e, pn(e, t, r, "model")), d = fr(Yn(e, pn(e, t, r, "type")));
	if (a === void 0 && o === void 0 && s === void 0 && c === void 0 && l === void 0 && u === void 0 && d === void 0) return null;
	let f = dr(u), p = z(e[i ?? ""], "name"), m = K(e[i ?? ""], "Size", n) ?? p ?? Fr(r);
	return {
		name: d === "hdd" ? `${f ?? m} ${(p ?? r).toUpperCase()}` : f ?? m,
		model: d ? d.toUpperCase() : o === void 0 ? "Disk" : "Physical Disk",
		capacityBytes: a ?? 0,
		temperatureCelsius: o,
		readBytesPerSecond: s,
		writeBytesPerSecond: c,
		busyPercent: l,
		status: Mn(o),
		mediaType: d,
		diskSlug: r,
		deviceName: p,
		deviceModel: f ?? void 0
	};
}, vt = (e, t, n) => {
	if (e.length === 0) return t.map((e, t) => ({
		key: e.slug,
		name: mr(Pr(e.slug)),
		layout: e.readOnly ? "Filesystem | Read-only" : "Filesystem",
		status: e.readOnly ? "warning" : "healthy",
		usedBytes: e.usedBytes,
		totalBytes: e.totalBytes,
		accent: Xe(t)
	}));
	let r = [...t];
	return e.map((t, i) => {
		let a = r.findIndex((e) => Math.abs(e.totalBytes - t.sizeBytes) / Math.max(t.sizeBytes, 1) < .05), o = a >= 0 ? r.splice(a, 1)[0] : void 0, s = hr(t, n), c = o ? mr(Pr(o.slug)) : void 0, l = pr(t.level), u = jt(t.members, n), d = u.length === 0 && e.length === 1 ? n.map((e) => e.diskSlug).filter((e) => !!e) : u;
		return {
			key: t.slug,
			name: s ?? c ?? t.name,
			layout: [l, c].filter(Boolean).join(" | ") || `${t.slug.toUpperCase()} Array`,
			driveCountText: gr(t.activeDisks, t.totalDisks),
			status: t.degradedDisks > 0 ? "degraded" : o?.readOnly ? "warning" : "healthy",
			usedBytes: o?.usedBytes ?? 0,
			totalBytes: o?.totalBytes ?? t.sizeBytes,
			accent: Xe(i),
			driveSlugs: d
		};
	});
}, yt = (e, t) => {
	let n = Tn(e, t), r = wn(e, t, "cpu"), i = e[n ?? ""], a = B(i, "cpu_usage_percent") ?? R(e, r), o = B(i, "memory_usage_bytes") ?? R(e, wn(e, t, "memory")), s = B(i, "total_containers") ?? R(e, wn(e, t, "total")), c = B(i, "running_containers") ?? R(e, wn(e, t, "running"));
	if (a === void 0 || o === void 0 || s === void 0 || c === void 0) return null;
	let l = bt(t, St(e, t, n ?? r)), u = xt(t, o, l);
	return {
		key: t,
		title: vr(z(i, "project") ?? K(i, "CPU", "") ?? K(e[r ?? ""], "CPU", "") ?? t.split("_").filter(Boolean).map(Ir).join(" ")),
		cpuPercent: a,
		memoryBytes: u,
		runningContainers: Math.round(c),
		totalContainers: Math.round(s),
		status: c <= 0 ? "down" : c < s ? "partial" : "up",
		containers: l
	};
}, bt = (e, t) => e === "virtual_machines" ? t.map((e) => e.running ? e : {
	...e,
	memoryBytes: 0
}) : t, xt = (e, t, n) => e !== "virtual_machines" || n.length === 0 ? t : n.reduce((e, t) => e + (t.running ? t.memoryBytes : 0), 0), St = (e, t, n) => {
	let r = V(e[n ?? ""], "containers");
	if (r.length > 0) return r.map((e, n) => Ct(e, t, n)).filter((e) => e !== null).sort((e, t) => Number(t.running) - Number(e.running) || t.cpuPercent - e.cpuPercent || t.memoryBytes - e.memoryBytes || e.name.localeCompare(t.name));
	let i = /* @__PURE__ */ new Map();
	for (let [n, r] of E(e)) {
		if (!Jn(r)) continue;
		let e = at.exec(n) ?? ot.exec(n), a = Er(r), o = e?.[2] ?? a?.metric, s = z(r, "container"), c = Tr(z(r, "project_slug") ?? z(r, "project")), l = z(r, "image"), u = z(r, "status"), d = z(r, "state"), f = Xn(r, "running");
		if (!(s || l !== void 0 || u !== void 0 || d !== void 0 || f !== void 0 || B(r, "memory_current_bytes") !== void 0 || B(r, "memory_limit_bytes") !== void 0 || o !== void 0)) continue;
		let p = a?.key ?? J(s ?? z(r, "container_slug") ?? z(r, "container_id") ?? e?.[1] ?? n), m = i.get(p) ?? { key: p };
		m.projectSlug = c ?? m.projectSlug ?? Ar(p, r, t), m.name = m.name ?? s ?? a?.name ?? K(r, "", "") ?? Fr(p), m.image = m.image ?? l, m.status = m.status ?? u, m.state = m.state ?? d ?? (o === "running" ? Or(r) : void 0), m.memoryCurrentBytes = m.memoryCurrentBytes ?? B(r, "memory_current_bytes"), m.memoryLimitBytes = m.memoryLimitBytes ?? B(r, "memory_limit_bytes"), m.cpuPercent = B(r, "cpu_usage_percent") ?? (o === "cpu_usage_percent" ? W(r.state) : void 0) ?? m.cpuPercent ?? 0, m.memoryBytes = B(r, "memory_usage_bytes") ?? (o === "memory_usage_bytes" ? W(r.state) : void 0) ?? m.memoryBytes ?? 0, m.running = f ?? (o === "running" ? kr(r, m.state) : void 0) ?? m.running, i.set(p, m);
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
}, Ct = (e, t, n) => {
	let r = Tr(H(e, [
		"project_slug",
		"project",
		"ProjectSlug",
		"Project"
	]));
	if (r !== void 0 && r !== t) return null;
	let i = H(e, [
		"name",
		"container",
		"Name",
		"Container"
	]), a = H(e, [
		"container_slug",
		"key",
		"ContainerSlug",
		"Key"
	]) ?? J(i ?? H(e, ["container_id", "ContainerID"]) ?? `container_${n}`);
	return {
		key: a,
		name: i ?? Fr(a),
		image: H(e, ["image", "Image"]) ?? "Unknown",
		status: H(e, ["status", "Status"]) ?? "Unavailable",
		state: H(e, ["state", "State"]) ?? "unknown",
		running: $n(e, ["running", "Running"]) ?? H(e, ["state", "State"])?.toLowerCase() === "running",
		cpuPercent: U(e, [
			"cpu_usage_percent",
			"cpuPercent",
			"CPUUsagePercent",
			"CPUPercent"
		]) ?? 0,
		memoryBytes: U(e, [
			"memory_usage_bytes",
			"memoryBytes",
			"MemoryUsageBytes",
			"MemoryBytes"
		]) ?? 0,
		memoryCurrentBytes: U(e, [
			"memory_current_bytes",
			"memoryCurrentBytes",
			"MemoryCurrentBytes"
		]),
		memoryLimitBytes: U(e, [
			"memory_limit_bytes",
			"memoryLimitBytes",
			"MemoryLimitBytes"
		])
	};
}, wt = (e, t) => {
	let n = [];
	return V(e[t ?? ""], "cpu_cores").forEach((e, t) => {
		let r = H(e, ["name"]) ?? `cpu${t}`, i = U(e, ["usage_percent", "UsagePercent"]);
		i !== void 0 && n.push({
			key: J(r) || `cpu_${t}`,
			name: xr(r),
			usagePercent: i,
			currentMHz: U(e, ["current_mhz", "CurrentMHz"]),
			minMHz: U(e, ["min_mhz", "MinMHz"]),
			maxMHz: U(e, ["max_mhz", "MaxMHz"]),
			governor: H(e, ["governor", "Governor"])
		});
	}), n.sort(Sr);
}, Tt = (e, t, n, r) => {
	let i = e[t ?? ""], a = B(i, "memory_total_bytes") ?? n, o = B(i, "memory_used_bytes") ?? r, s = B(i, "memory_buffers_bytes"), c = B(i, "memory_cached_bytes"), l = B(i, "swap_used_bytes"), u = B(i, "swap_total_bytes");
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
}, Et = (e, t) => {
	let n = /* @__PURE__ */ new Map();
	for (let r of t) V(e[r], "engines").forEach((e, t) => {
		let r = H(e, ["name", "Name"]), i = U(e, ["busy_percent", "BusyPercent"]);
		if (!r || i === void 0) return;
		let a = J(r) || `engine_${t}`, o = {
			key: a,
			label: Cr(r),
			busyPercent: i,
			semaPercent: U(e, ["sema_percent", "SemaPercent"]),
			waitPercent: U(e, ["wait_percent", "WaitPercent"])
		}, s = n.get(a);
		(!s || o.busyPercent > s.busyPercent) && n.set(a, o);
	});
	return Array.from(n.values()).sort((e, t) => t.busyPercent - e.busyPercent || e.label.localeCompare(t.label));
}, Dt = (e, t) => {
	let n = /* @__PURE__ */ new Map();
	for (let r of t) V(e[r], "stats").forEach((e, t) => {
		let r = U(e, ["value", "Value"]);
		if (r === void 0) return;
		let i = H(e, ["key", "Key"]) ?? `stat_${t}`;
		n.set(i, {
			key: i,
			label: H(e, ["label", "Label"]) ?? wr(i),
			value: r,
			unit: H(e, ["unit", "Unit"])
		});
	});
	return Array.from(n.values());
}, Ot = (e, t) => {
	let n = V(t, "top_processes").map((e, t) => kt(e, t)).filter((e) => e !== null);
	if (n.length > 0) return At(n);
	let r = /* @__PURE__ */ new Map();
	for (let [t, n] of E(e)) {
		let e = st.exec(t), i = e?.[2], a = W(n.state), o = z(n, "name"), s = B(n, "process_count"), c = B(n, "cpu_time_seconds"), l = B(n, "cpu_usage_percent"), u = B(n, "memory_usage_bytes");
		if (!(s !== void 0 || c !== void 0 || o !== void 0 && br(n).includes("process") && l !== void 0 && u !== void 0 || e !== null)) continue;
		let d = J(o ?? e?.[1] ?? t), f = r.get(d) ?? {
			key: d,
			name: o ?? K(n, "", "") ?? Fr(e?.[1] ?? d),
			processCount: 0,
			cpuPercent: 0,
			memoryBytes: 0
		};
		f.name = o ?? f.name, f.processCount = Math.round(s ?? (i === "process_count" ? a : void 0) ?? f.processCount), f.cpuPercent = l ?? (i === "cpu_usage_percent" ? a : void 0) ?? f.cpuPercent, f.memoryBytes = u ?? (i === "memory_usage_bytes" ? a : void 0) ?? f.memoryBytes, f.cpuTimeSeconds = c ?? (i === "cpu_time_seconds" ? a : void 0) ?? f.cpuTimeSeconds, r.set(d, f);
	}
	return At(Array.from(r.values()));
}, kt = (e, t) => {
	let n = H(e, ["name", "Name"]), r = U(e, [
		"cpu_usage_percent",
		"cpu_percent",
		"CPUPercent"
	]), i = U(e, [
		"memory_usage_bytes",
		"memory_bytes",
		"MemoryBytes"
	]);
	if (!n && r === void 0 && i === void 0) return null;
	let a = J(n ?? `process_${t}`);
	return {
		key: a,
		name: n ?? Fr(a),
		processCount: Math.round(U(e, ["process_count", "ProcessCount"]) ?? 0),
		cpuPercent: r ?? 0,
		memoryBytes: i ?? 0,
		cpuTimeSeconds: U(e, ["cpu_time_seconds", "CPUTimeSeconds"])
	};
}, At = (e) => e.sort((e, t) => t.cpuPercent - e.cpuPercent || t.memoryBytes - e.memoryBytes || t.processCount - e.processCount || e.name.localeCompare(t.name)).slice(0, 10), jt = (e, t) => {
	if (e.length === 0) return [];
	let n = /* @__PURE__ */ new Map();
	return t.filter((e) => !!e.diskSlug).forEach((e) => {
		let t = e.diskSlug;
		for (let r of [t, e.deviceName ?? ""].flatMap(Nr)) n.set(r, t);
	}), Array.from(new Set(e.flatMap((e) => Nr(e)).map((e) => n.get(e)).filter((e) => !!e)));
}, Mt = (e, t, n, r) => {
	let i = _n(e, t, n, "rx"), a = _n(e, t, n, "tx"), o = R(e, i), s = R(e, a), c = R(e, _n(e, t, n, "speed")), l = vn(e, t, n);
	return o === void 0 && s === void 0 && c === void 0 && !l ? null : {
		name: Vr(n),
		status: tr(e[l ?? ""]) ? "up" : "down",
		linkSpeedMbps: c ?? void 0,
		temperatureCelsius: jn(r, n),
		downloadBps: (o ?? 0) * 8,
		uploadBps: (s ?? 0) * 8
	};
}, Nt = (e, t, n, r) => {
	let i = R(e, yn(e, t, n, "speed")), a = bn(e, t, n), o = rn(e, t, n);
	return i === void 0 && !a ? null : {
		name: Vr(n),
		status: tr(e[a ?? ""]) ? "up" : "down",
		linkSpeedMbps: i ?? void 0,
		temperatureCelsius: jn(r, n),
		downloadBps: o / 2,
		uploadBps: o / 2
	};
}, Pt = (e, t) => Zt(e, t).map((n) => {
	let r = mn(e, t, n, "used"), i = mn(e, t, n, "free"), a = R(e, r), o = R(e, i);
	return a === void 0 || o === void 0 ? null : {
		slug: n,
		name: K(e[r ?? ""], "Used", "") ?? Pr(n),
		usedBytes: a,
		freeBytes: o,
		totalBytes: a + o,
		readOnly: tr(e[hn(e, t, n) ?? ""])
	};
}).filter((e) => e !== null).sort((e, t) => e.name.localeCompare(t.name)), Ft = (e, t) => {
	let n = sn(e, t), r = [];
	for (let i of n) {
		let n = F(e, t, i, "size"), a = R(e, n), o = R(e, F(e, t, i, "degraded")) ?? 0, s = R(e, F(e, t, i, "active")), c = R(e, F(e, t, i, "total")), l = R(e, F(e, t, i, "sync")), u = gn(e, t, i, "level"), d = Yn(e, u);
		if (a === void 0 && s === void 0 && c === void 0 && l === void 0 && d === void 0) continue;
		let f = Qn([
			e[n ?? ""],
			e[u ?? ""],
			e[F(e, t, i, "active") ?? ""],
			e[F(e, t, i, "total") ?? ""],
			e[F(e, t, i, "degraded") ?? ""]
		], "members");
		r.push({
			slug: i,
			name: K(e[n ?? ""], "Size", "") ?? K(e[u ?? ""], "Level", "") ?? i.toUpperCase(),
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
}, It = (e, t) => M(e, `hostRootEntries:${t}`, () => E(e).filter(([e]) => Kn(e, t))), Lt = (e, t) => M(e, `temperatures:${t}`, () => {
	let n = [
		`sensor.ugos_bridge_host_${t}_`,
		`sensor.${t}_`,
		"sensor.ugos_bridge_disk_",
		"sensor.ugos_bridge_gpu_"
	];
	return E(e).filter(([e, t]) => e.startsWith("sensor.") && n.some((t) => e.startsWith(t)) && (e.endsWith("_temperature_celsius") || G(t, ["temperature"]))).map(([e, t]) => {
		let n = W(t.state);
		return n === void 0 ? null : {
			entityId: e,
			label: `${q(t)} ${e}`.trim().toLowerCase(),
			value: n
		};
	}).filter((e) => e !== null);
}), Rt = (e, t) => {
	if (!t || !e.startsWith("sensor.")) return !1;
	let n = rr(t)?.toLowerCase();
	return n !== void 0 && n !== "rpm" ? !1 : n === "rpm" || /_fan_speed(?:_rpm)?(?:_\d+)?$/.test(e) || /\bfan speed\b/i.test(q(t)) || Object.hasOwn(t.attributes, "fan_speed_rpm");
}, zt = (e, t, n) => {
	let r = z(t, "device_type");
	if (r !== void 0 && r.toLowerCase() !== "host") return !1;
	let i = z(t, "host");
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
}, Bt = (e) => {
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
}, Vt = (e, t) => {
	let n = {
		cpu: [],
		system: []
	};
	for (let [r, i] of E(e)) {
		if (!Rt(r, i) || !zt(r, i, t)) continue;
		let e = W(i.state.trim());
		if (e === void 0 || e < 0) continue;
		let a = [
			z(i, "label"),
			z(i, "name"),
			z(i, "sensor"),
			q(i),
			r
		].map((e) => e ? Bt(e) : void 0).find((e) => e !== void 0);
		a && n[a.group].push({
			key: r,
			label: a.label,
			rpm: e
		});
	}
	for (let e of Object.values(n)) e.sort((e, t) => e.label.localeCompare(t.label, "en", { numeric: !0 }) || e.key.localeCompare(t.key));
	return n;
}, Ht = (e, t) => M(e, `hostSlug:${t ?? ""}`, () => {
	if (t) {
		let n = Ut(t);
		if (Ln(e, n) || Rn(e, n)) return n;
	}
	let n = zn(e), r = n[0];
	if (!r) return null;
	if (!t) return n.find((t) => !Bn(e, t)) ?? r;
	let i = Ut(t);
	return n.find((e) => e === i) ?? r;
}), Ut = (e) => {
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
}, Wt = (e, t, n) => Dr(K(e[P(e, t, "cpu") ?? ""], "CPU", "") ?? n?.trim() ?? Fr(t)), Gt = (e, t) => {
	if (t?.ipEntity) {
		let n = e[t.ipEntity]?.state;
		if (n && n !== "unknown" && n !== "unavailable") return n;
	}
	return t?.ipAddress?.trim() || "Unavailable";
}, Kt = (e, t, n) => n && n > 0 ? n : t > 0 ? Math.max(e, Math.round(e / (t / 100))) : e, qt = (e, t) => {
	if (t && t.length > 0) {
		let n = e.filter((e) => En(e.slug, e.name, t));
		if (n.length > 0) return n;
	}
	let n = e.filter((e) => e.name !== "/");
	return n.length > 0 ? n : e;
}, Jt = (e, t) => {
	if (!t || t.length === 0) return e.filter((e) => e !== "lo");
	let n = t.map((e) => J(e)), r = e.filter((e) => n.includes(J(e)));
	return r.length > 0 ? r : e;
}, Yt = (e) => M(e, "projectSlugs", () => {
	let t = T(e).map((e) => Qe.exec(e)?.[1]).filter((e) => !!e), n = ft(e, "sensor.compose_project_").map(([, e]) => _r(e)).filter((e) => !!e), r = E(e).filter(([e, t]) => e.startsWith("sensor.") && (z(t, "project_slug") !== void 0 || z(t, "project") !== void 0)).map(([, e]) => Tr(z(e, "project_slug") ?? z(e, "project"))).filter((e) => !!e);
	return Array.from(/* @__PURE__ */ new Set([
		...t,
		...n,
		...r
	])).sort();
}), Xt = (e, t, n) => M(e, `diskSlugs:${t}:${n}`, () => {
	let r = qn(e, t, n, "disk", sr), i = [
		...L(e, RegExp(`^sensor\\.${Y(n)}_disk_(.+?)_size_bytes$`)),
		...L(e, /^sensor\.ugos_bridge_disk_(.+?)_size_bytes$/),
		...L(e, RegExp(`^sensor\\.${Y(n)}_disk_(.+?)_(?:size_bytes|read_bytes_per_second|write_bytes_per_second|busy_percent|model|vendor|serial|media_type)(?:_\\d+)?$`))
	], a = Array.from(/* @__PURE__ */ new Set([...r, ...i])).sort();
	if (a.length > 0) return a;
	let o = T(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_disk_([^_]+)_`))?.[1]).filter((e) => !!e), s = D(e).map((e) => ir(e, t, [
		"Size",
		"Busy",
		"Read Throughput",
		"Write Throughput"
	])).filter((e) => e !== void 0 && sr(e)), c = D(e).filter((e) => B(e, "size_bytes") !== void 0 || B(e, "read_bytes_per_second") !== void 0 || B(e, "write_bytes_per_second") !== void 0).map((e) => J(z(e, "name") ?? "")).filter((e) => sr(e));
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...o,
		...s,
		...c
	])).sort();
}), Zt = (e, t) => M(e, `filesystemSlugs:${t}`, () => {
	let n = qn(e, t, `ugos_bridge_host_${t}`, "filesystem", (e) => !!e), r = [
		...L(e, RegExp(`^sensor\\.ugos_bridge_host_${Y(t)}_filesystem_(.+?)_used_bytes$`)),
		...L(e, /^sensor\.ugos_bridge_filesystem_(.+?)_used_bytes$/),
		...L(e, RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_host_${Y(t)}_filesystem_(.+?)_(?:used_bytes|free_bytes|used_percent|read_only)(?:_\\d+)?$`))
	], i = T(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_filesystem_([^_]+)_`))?.[1]).filter((e) => !!e), a = D(e).map((e) => ar(e, t)).filter((e) => !!e), o = D(e).filter((e) => B(e, "used_bytes") !== void 0 || B(e, "free_bytes") !== void 0).map((e) => J(z(e, "name") ?? "")).filter((e) => !!e);
	return Array.from(/* @__PURE__ */ new Set([
		...n,
		...r,
		...i,
		...a,
		...o
	])).sort();
}), Qt = (e, t, n) => M(e, `networkSlugs:${t}:${n}`, () => {
	let r = qn(e, t, n, "network", ur), i = [
		...L(e, RegExp(`^sensor\\.${Y(n)}_network_(.+?)_rx_bytes_per_second$`)),
		...L(e, /^sensor\.ugos_bridge_network_(.+?)_rx_bytes_per_second$/),
		...L(e, RegExp(`^(?:sensor|binary_sensor)\\.${Y(n)}_network_(.+?)_(?:rx_bytes_per_second|tx_bytes_per_second|speed_mbps|carrier)(?:_\\d+)?$`))
	], a = T(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_network_([^_]+)_`))?.[1]).filter((e) => !!e), o = D(e).map((e) => ir(e, t, [
		"RX Throughput",
		"TX Throughput",
		"Link Speed",
		"Carrier"
	])).filter((e) => e !== void 0 && ur(e)), s = D(e).filter((e) => B(e, "rx_bytes_per_second") !== void 0 || B(e, "tx_bytes_per_second") !== void 0 || B(e, "speed_mbps") !== void 0).map((e) => J(z(e, "name") ?? "")).filter((e) => ur(e));
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...a,
		...o,
		...s
	])).sort();
}), $t = (e, t, n) => M(e, `bondSlugs:${t}:${n}`, () => {
	let r = qn(e, t, n, "bond", lr), i = [
		...L(e, RegExp(`^sensor\\.${Y(n)}_bond_(.+?)_speed_mbps$`)),
		...L(e, /^sensor\.ugos_bridge_bond_(.+?)_speed_mbps$/),
		...L(e, RegExp(`^(?:sensor|binary_sensor)\\.${Y(n)}_bond_(.+?)_(?:speed_mbps|mode|active_slave|mii_status|slave_count|carrier)(?:_\\d+)?$`))
	], a = T(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_bond_([^_]+)_`))?.[1]).filter((e) => !!e), o = D(e).map((e) => ir(e, t, [
		"Link Speed",
		"Mode",
		"Active Slave",
		"MII Status",
		"Slave Count",
		"Carrier"
	])).filter((e) => e !== void 0 && lr(e)), s = D(e).filter((e) => z(e, "mode") !== void 0 || z(e, "active_slave") !== void 0 || B(e, "speed_mbps") !== void 0).map((e) => J(z(e, "name") ?? "")).filter((e) => lr(e));
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...a,
		...o,
		...s
	])).sort();
}), en = (e, t) => {
	if (t && t.length > 0) return e;
	let n = e.filter((e) => /^(bond\d+|eth\d+)$/i.test(e));
	return n.length > 0 ? n : e;
}, tn = (e) => [...e].filter((e) => /^(bond\d+|eth\d+)$/i.test(e)).sort((e, t) => nn(e) - nn(t) || e.localeCompare(t)).slice(0, 3), nn = (e) => {
	let t = e.toLowerCase();
	return t.startsWith("bond") ? 0 : t.startsWith("eth") ? 1 : 2;
}, rn = (e, t, n) => {
	let r = R(e, _n(e, t, n, "rx")), i = R(e, _n(e, t, n, "tx"));
	return ((r ?? 0) + (i ?? 0)) * 8;
}, an = (e, t) => {
	let n = e.toLowerCase();
	if (n.startsWith("bond")) return w.cyan;
	if (n === "eth0") return w.good;
	if (n === "eth1") return w.purple;
	let r = [
		w.softBlue,
		w.green,
		w.blue
	];
	return r[t % r.length] ?? w.softBlue;
}, on = (e, t, n) => M(e, `gpuSlugs:${t}:${n}`, () => {
	let r = qn(e, t, n, "gpu", (e) => !!e), i = [...L(e, RegExp(`^sensor\\.${Y(n)}_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\\d+)?$`)), ...L(e, /^sensor\.ugos_bridge_gpu_(.+?)_(?:busy_percent|busy|current_mhz|current_frequency|max_mhz|max_frequency)(?:_\d+)?$/)], a = T(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_gpu_([^_]+)_`))?.[1]).filter((e) => !!e), o = D(e).filter((e) => V(e, "engines").length > 0 || V(e, "stats").length > 0 || B(e, "busy_percent") !== void 0 || B(e, "current_mhz") !== void 0).map((e) => J(z(e, "name") ?? "")).filter((e) => !!e);
	return Array.from(/* @__PURE__ */ new Set([
		...r,
		...i,
		...a,
		...o
	])).sort();
}), sn = (e, t) => M(e, `arraySlugs:${t}`, () => {
	let n = qn(e, t, `ugos_bridge_host_${t}`, "array", cr), r = [
		...L(e, RegExp(`^sensor\\.ugos_bridge_host_${Y(t)}_array_(.+?)_size_bytes$`)),
		...L(e, /^sensor\.ugos_bridge_array_(.+?)_size_bytes$/),
		...L(e, RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_host_${Y(t)}_array_(.+?)_(?:size_bytes|degraded_disks|active_disks|total_disks|sync_completed_percent|level|degraded)(?:_\\d+)?$`))
	], i = T(e).map((e) => e.match(RegExp(`^sensor\\.${Y(t)}_array_([^_]+)_`))?.[1]).filter((e) => !!e), a = D(e).map((e) => ir(e, t, [
		"Size",
		"Degraded Disks",
		"Sync Progress"
	])).filter((e) => e !== void 0 && cr(e)), o = D(e).filter((e) => B(e, "size_bytes") !== void 0 || z(e, "level") !== void 0 || B(e, "degraded_disks") !== void 0).map((e) => J(z(e, "name") ?? "")).filter((e) => cr(e));
	return Array.from(/* @__PURE__ */ new Set([
		...n,
		...r,
		...i,
		...a,
		...o
	])).sort();
}), P = (e, t, n) => N(e, `hostMetric:${t}:${n}`, () => {
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
	let i = It(e, t);
	switch (n) {
		case "cpu": return I(i, {
			entityIncludes: ["_cpu"],
			friendlyIncludes: ["cpu"],
			unit: "%"
		});
		case "load1": return I(i, {
			entityIncludes: ["load"],
			friendlyIncludes: ["load", "1"],
			unit: void 0
		});
		case "cpufreq": return I(i, {
			entityIncludes: ["frequency"],
			friendlyIncludes: ["frequency"],
			unit: "MHz"
		});
		case "memoryUsedBytes": return I(i, {
			entityIncludes: ["memory"],
			friendlyIncludes: ["memory", "used"],
			unit: "B"
		});
		case "memoryUsedPercent": return I(i, {
			entityIncludes: ["memory"],
			friendlyIncludes: ["memory", "used"],
			unit: "%"
		});
		case "swapUsedPercent": return I(i, {
			entityIncludes: ["swap"],
			friendlyIncludes: ["swap", "used"],
			unit: "%"
		});
		case "uptime": return I(i, {
			entityIncludes: ["uptime"],
			friendlyIncludes: ["uptime"],
			unit: "s"
		});
	}
}), cn = (e, t, n) => {
	let r = P(e, t, n), i = ct[n], a = [
		r ? e[r] : void 0,
		e[P(e, t, "cpu") ?? ""],
		e[P(e, t, "memoryUsedBytes") ?? ""]
	];
	for (let r of a) {
		let a = B(r, i);
		if (dn(e, t, n, a)) return a;
	}
	for (let [, r] of It(e, t)) {
		let a = B(r, i);
		if (dn(e, t, n, a)) return a;
	}
	let o = R(e, r);
	return dn(e, t, n, o) ? o : void 0;
}, ln = (e, t) => {
	let n = P(e, t, "load1"), r = e[n ?? ""], i = cn(e, t, "load1") ?? 0, a = rr(r) === "%" || un(n, r), o = a ? i : i * 100;
	return {
		value: i,
		valuePercent: Fn(o),
		valueText: a ? In(i) : i.toFixed(2),
		unit: a ? "percent" : "load",
		statusText: a ? Pn(o) : Nn(i)
	};
}, un = (e, t) => {
	let n = e?.toLowerCase() ?? "", r = br(t);
	return n.endsWith("_load_1") || n.includes("_load_1m") || r.includes("load 1m") || r.includes("load (1m)");
}, dn = (e, t, n, r) => {
	if (r === void 0 || !Number.isFinite(r) || r < 0) return !1;
	if (n !== "load1") return !0;
	let i = e[P(e, t, "cpu") ?? ""], a = V(i, "cpu_cores").length;
	return r <= Math.max(a * 64, 1024);
}, fn = (e, t, n, r) => N(e, `diskMetric:${t}:${n}:${r}`, () => {
	let i = k(e, {
		size: [`sensor.ugos_bridge_host_${t}_disk_${n}_size_bytes`, `sensor.ugos_bridge_disk_${n}_size_bytes`],
		temperature: [`sensor.ugos_bridge_host_${t}_disk_${n}_temperature_celsius`, `sensor.ugos_bridge_disk_${n}_temperature_celsius`],
		read: [`sensor.ugos_bridge_host_${t}_disk_${n}_read_bytes_per_second`, `sensor.ugos_bridge_disk_${n}_read_bytes_per_second`],
		write: [`sensor.ugos_bridge_host_${t}_disk_${n}_write_bytes_per_second`, `sensor.ugos_bridge_disk_${n}_write_bytes_per_second`],
		busy: [`sensor.ugos_bridge_host_${t}_disk_${n}_busy_percent`, `sensor.ugos_bridge_disk_${n}_busy_percent`]
	}[r]);
	if (i) return i;
	let a = O(e, [
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
	if (a.length > 0) return j(a, o);
	let s = A(e, "disk", n);
	return s.length > 0 ? j(s, o) : j(E(e).filter(([, e]) => G(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), pn = (e, t, n, r) => N(e, `diskTextMetric:${t}:${n}:${r}`, () => {
	let i = k(e, {
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
	}, s = O(e, a);
	if (s.length > 0) return j(s, o);
	let c = A(e, "disk", n);
	return c.length > 0 ? j(c, o) : j(E(e).filter(([, e]) => G(e, [n])), {
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), mn = (e, t, n, r) => N(e, `filesystemMetric:${t}:${n}:${r}`, () => {
	let i = k(e, {
		used: [`sensor.ugos_bridge_host_${t}_filesystem_${n}_used_bytes`, `sensor.ugos_bridge_filesystem_${n}_used_bytes`],
		free: [`sensor.ugos_bridge_host_${t}_filesystem_${n}_free_bytes`, `sensor.ugos_bridge_filesystem_${n}_free_bytes`]
	}[r]);
	if (i) return i;
	let a = O(e, [
		`sensor.ugos_bridge_host_${t}_filesystem_${n}_`,
		`sensor.${t}_filesystem_${n}_`,
		`sensor.ugos_bridge_filesystem_${n}_`
	]);
	if (a.length > 0) return j(a, {
		entityIncludes: [r],
		friendlyIncludes: [r],
		unit: "B"
	});
	let o = A(e, "filesystem", n);
	return o.length > 0 ? j(o, {
		entityIncludes: [r],
		friendlyIncludes: [r],
		unit: "B"
	}) : j(E(e).filter(([, e]) => ar(e, t) === n), {
		entityIncludes: [r],
		friendlyIncludes: [r],
		unit: "B"
	});
}), hn = (e, t, n) => N(e, `filesystemReadonly:${t}:${n}`, () => {
	let r = k(e, [`binary_sensor.ugos_bridge_host_${t}_filesystem_${n}_read_only`, `binary_sensor.ugos_bridge_filesystem_${n}_read_only`]);
	if (r) return r;
	let i = O(e, [
		`binary_sensor.ugos_bridge_host_${t}_filesystem_${n}_`,
		`binary_sensor.${t}_filesystem_${n}_`,
		`binary_sensor.ugos_bridge_filesystem_${n}_`
	]);
	if (i.length > 0) return j(i, {
		entityIncludes: ["read"],
		friendlyIncludes: ["read", "only"]
	});
	let a = A(e, "filesystem", n, "binary_sensor.");
	return a.length > 0 ? j(a, {
		entityIncludes: ["read"],
		friendlyIncludes: ["read", "only"]
	}) : j(E(e).filter(([, e]) => ar(e, t) === n), {
		entityIncludes: ["read"],
		friendlyIncludes: ["read", "only"]
	});
}), F = (e, t, n, r) => N(e, `arrayMetric:${t}:${n}:${r}`, () => {
	let i = k(e, {
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
	}, s = O(e, a);
	if (s.length > 0) return j(s, o);
	let c = A(e, "array", n);
	return c.length > 0 ? j(c, o) : j(E(e).filter(([, e]) => G(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), gn = (e, t, n, r) => N(e, `arrayTextMetric:${t}:${n}:${r}`, () => {
	let i = k(e, { level: [`sensor.ugos_bridge_host_${t}_array_${n}_level`, `sensor.ugos_bridge_array_${n}_level`] }[r]);
	if (i) return i;
	let a = O(e, [
		`sensor.ugos_bridge_host_${t}_array_${n}_`,
		`sensor.${t}_array_${n}_`,
		`sensor.ugos_bridge_array_${n}_`
	]);
	if (a.length > 0) return j(a, {
		entityIncludes: ["level"],
		friendlyIncludes: ["level"]
	});
	let o = A(e, "array", n);
	return o.length > 0 ? j(o, {
		entityIncludes: ["level"],
		friendlyIncludes: ["level"]
	}) : j(E(e).filter(([, e]) => G(e, [n, "level"])), {
		entityIncludes: [],
		friendlyIncludes: [n, "level"]
	});
}), _n = (e, t, n, r) => N(e, `networkMetric:${t}:${n}:${r}`, () => {
	let i = k(e, {
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
	}, s = O(e, a);
	if (s.length > 0) return j(s, o);
	let c = A(e, "network", n);
	return c.length > 0 ? j(c, o) : j(E(e).filter(([, e]) => G(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), vn = (e, t, n) => N(e, `networkCarrier:${t}:${n}`, () => {
	let r = k(e, [`binary_sensor.ugos_bridge_host_${t}_network_${n}_carrier`, `binary_sensor.ugos_bridge_network_${n}_carrier`]);
	if (r) return r;
	let i = O(e, [
		`binary_sensor.ugos_bridge_host_${t}_network_${n}_`,
		`binary_sensor.${t}_network_${n}_`,
		`binary_sensor.ugos_bridge_network_${n}_`
	]);
	if (i.length > 0) return j(i, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	});
	let a = A(e, "network", n, "binary_sensor.");
	return a.length > 0 ? j(a, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	}) : j(ft(e, "binary_sensor.").filter(([, e]) => G(e, [n, "carrier"])), {
		entityIncludes: [],
		friendlyIncludes: [n, "carrier"]
	});
}), yn = (e, t, n, r) => N(e, `bondMetric:${t}:${n}:${r}`, () => {
	let i = k(e, {
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
	}, s = O(e, a);
	if (s.length > 0) return j(s, o);
	let c = A(e, "bond", n);
	return c.length > 0 ? j(c, o) : j(E(e).filter(([, e]) => G(e, [n])), {
		...o,
		entityIncludes: [],
		friendlyIncludes: [n, ...o.friendlyIncludes]
	});
}), bn = (e, t, n) => N(e, `bondCarrier:${t}:${n}`, () => {
	let r = k(e, [`binary_sensor.ugos_bridge_host_${t}_bond_${n}_carrier`, `binary_sensor.ugos_bridge_bond_${n}_carrier`]);
	if (r) return r;
	let i = O(e, [
		`binary_sensor.ugos_bridge_host_${t}_bond_${n}_`,
		`binary_sensor.${t}_bond_${n}_`,
		`binary_sensor.ugos_bridge_bond_${n}_`
	]);
	if (i.length > 0) return j(i, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	});
	let a = A(e, "bond", n, "binary_sensor.");
	return a.length > 0 ? j(a, {
		entityIncludes: ["carrier"],
		friendlyIncludes: ["carrier"]
	}) : j(ft(e, "binary_sensor.").filter(([, e]) => G(e, [n, "carrier"])), {
		entityIncludes: [],
		friendlyIncludes: [n, "carrier"]
	});
}), xn = (e, t, n, r, i) => N(e, `gpuMetric:${t}:${n}:${r}:${i}`, () => {
	let a = k(e, {
		busy: [`sensor.${n}_gpu_${r}_busy_percent`, `sensor.ugos_bridge_gpu_${r}_busy_percent`],
		current: [`sensor.${n}_gpu_${r}_current_mhz`, `sensor.ugos_bridge_gpu_${r}_current_mhz`],
		max: [`sensor.${n}_gpu_${r}_max_mhz`, `sensor.ugos_bridge_gpu_${r}_max_mhz`]
	}[i]);
	if (a) return a;
	let o = O(e, [
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
	return j(o, s) ?? j(A(e, "gpu", r), s);
}), Sn = (e, t, n, r, i) => {
	let a = i.filter((t) => Jn(e[t ?? ""])), o = Cn(e, t, n, r).filter(([, e]) => V(e, "engines").length > 0 || V(e, "stats").length > 0).map(([e]) => e);
	return Array.from(/* @__PURE__ */ new Set([...a, ...o]));
}, Cn = (e, t, n, r) => M(e, `gpuEntries:${t}:${n}:${r}`, () => {
	let i = O(e, [
		`sensor.${n}_gpu_${r}_`,
		`sensor.${t}_gpu_${r}_`,
		`sensor.ugos_bridge_gpu_${r}_`
	]), a = A(e, "gpu", r), o = E(e).filter(([e, t]) => e.startsWith("sensor.") && J(z(t, "name") ?? "") === r && (V(t, "engines").length > 0 || V(t, "stats").length > 0 || B(t, "busy_percent") !== void 0 || B(t, "current_mhz") !== void 0 || B(t, "max_mhz") !== void 0));
	return Array.from(new Map([
		...i,
		...a,
		...o
	]).entries());
}), wn = (e, t, n) => N(e, `projectMetric:${t}:${n}`, () => {
	let r = {
		cpu: `sensor.ugos_bridge_project_${t}_cpu_usage_percent`,
		memory: `sensor.ugos_bridge_project_${t}_memory_usage_bytes`,
		total: `sensor.ugos_bridge_project_${t}_total_containers`,
		running: `sensor.ugos_bridge_project_${t}_running_containers`
	};
	if (e[r[n]]) return r[n];
	let i = O(e, [
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
	return i.length > 0 ? I(i, a) : I(E(e).filter(([, e]) => _r(e) === t), a);
}), Tn = (e, t) => N(e, `projectPayload:${t}`, () => {
	let n, r = -1;
	for (let [i, a] of E(e)) {
		if (!i.startsWith("sensor.") || Tr(z(a, "project_slug") ?? z(a, "project")) !== t) continue;
		let e = 0;
		V(a, "containers").length > 0 && (e += 8), B(a, "total_containers") !== void 0 && (e += 4), B(a, "running_containers") !== void 0 && (e += 3), B(a, "memory_usage_bytes") !== void 0 && (e += 2), B(a, "cpu_usage_percent") !== void 0 && (e += 2), i.startsWith("sensor.compose_project_") && (e += 3), i.startsWith("sensor.ugos_bridge_project_") && (e += 3), (e > r || e === r && n !== void 0 && i.localeCompare(n) < 0 || n === void 0) && (n = i, r = e);
	}
	return n;
}), En = (e, t, n) => {
	let r = J(e), i = J(t);
	return n.some((e) => {
		let t = J(e);
		return t === r || t === i;
	});
}, Dn = (e, t) => e.samples.at(-1)?.key === t.key ? e : { samples: [...e.samples, t].slice(-21) }, On = (e, t, n) => {
	if (e.length >= n) return e.slice(-21);
	let r = Math.max(n - e.length, 0);
	return [...Array.from({ length: r }, () => t), ...e];
}, kn = (e, t, n) => {
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
}, An = (e, t) => {
	let n = e.find((e) => t.some((t) => e.label.includes(t)));
	return n ? n.value : e.find((e) => !e.entityId.includes("_disk_"))?.value;
}, jn = (e, t) => {
	let n = t.toLowerCase(), r = e.find((e) => e.label.includes(n) && (e.label.includes("phy temperature") || e.label.includes("mac temperature")));
	return r ? r.value : e.find((e) => e.label.includes(n))?.value;
}, Mn = (e) => e === void 0 ? "healthy" : e >= 55 ? "degraded" : e >= 48 ? "warning" : "healthy", Nn = (e) => e >= 3 ? "High" : e >= 1 ? "Busy" : "Good", Pn = (e) => e >= 90 ? "High" : e >= 70 ? "Busy" : "Good", Fn = (e) => Math.max(0, Math.min(100, e)), In = (e) => {
	let t = e >= 100 ? 0 : e >= 10 ? 1 : 2;
	return `${e.toFixed(t)}%`;
}, Ln = (e, t) => M(e, `hasEntityPrefix:${t}`, () => T(e).some((e) => e.startsWith(`sensor.${t}_`) || e.startsWith(`binary_sensor.${t}_`))), Rn = (e, t) => M(e, `hasBridgeHostEntityPrefix:${t}`, () => T(e).some((e) => e.startsWith(`sensor.ugos_bridge_host_${t}_`) || e.startsWith(`binary_sensor.ugos_bridge_host_${t}_`))), zn = (e) => M(e, "hostSlugCandidates", () => {
	let t = /* @__PURE__ */ new Map(), n = (e, n) => {
		e === void 0 || e.startsWith("ugos_bridge_") || t.set(e, (t.get(e) ?? 0) + n);
	};
	for (let t of T(e)) n(Ze.exec(t)?.[1], 1e3), n(et.exec(t)?.[1], 500), n($e.exec(t)?.[1], 100), n(it.exec(t)?.[1], 1);
	let r = Array.from(t.keys()), i = (e) => r.some((t) => t !== e && e.startsWith(`${t}_`) && tt.test(e.slice(t.length + 1)));
	return Array.from(t.entries()).filter(([e]) => !i(e)).sort(([e, t], [n, r]) => r - t || e.localeCompare(n)).map(([e]) => e);
}), Bn = (e, t) => M(e, `hostScoped:${t}`, () => z(e[P(e, t, "cpu") ?? ""], "identity_scope") === "host" || T(e).some((e) => Vn(e, t) !== void 0)), Vn = (e, t) => {
	for (let n of ["sensor", "binary_sensor"]) {
		let r = `${n}.ugos_bridge_host_${t}_`;
		if (e.startsWith(r)) {
			let t = e.slice(r.length);
			return nt.test(t) ? `${n}.ugos_bridge_${t}` : void 0;
		}
	}
}, Hn = (e) => {
	let t = z(e, "host");
	return t ? J(t) : void 0;
}, Un = (e, t) => M(e, `workloadStates:${t}`, () => {
	let n = {};
	if (Bn(e, t)) {
		for (let [r, i] of E(e)) {
			let e = Vn(r, t);
			e === void 0 ? Hn(i) === t && (n[r] = i) : n[e] = i;
		}
		return n;
	}
	let r = zn(e).filter((t) => Bn(e, t));
	if (r.length === 0) return e;
	let i = r.flatMap((e) => ["sensor", "binary_sensor"].flatMap((t) => [`${t}.ugos_bridge_host_${e}_`, ...rt.some((t) => t.startsWith(`${e}_`)) ? [] : [`${t}.${e}_`]]));
	for (let [r, a] of E(e)) {
		let e = Hn(a);
		e !== void 0 && e !== t || i.some((e) => r.startsWith(e)) || (n[r] = a);
	}
	return n;
}), Wn = (e) => [
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
], Gn = (e, t, n, r) => T(e).filter((i) => {
	if (n !== void 0 && i === n || t.some((e) => i.startsWith(e))) return !0;
	let a = e[i];
	return Rt(i, a) && a !== void 0 && zt(i, a, r) || z(a, "container") !== void 0 || z(a, "project") !== void 0 || B(a, "process_count") !== void 0 || B(a, "cpu_time_seconds") !== void 0;
}).sort(), Kn = (e, t) => e.startsWith(`sensor.${t}_`) && ![
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
].some((t) => e.includes(t)), I = (e, t) => {
	let n, r = -1;
	entryLoop: for (let [i, a] of e) {
		let e = i.toLowerCase(), o = br(a), s = rr(a), c = Jn(a);
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
}, L = (e, t) => M(e, `entitySlugs:${t.source}`, () => Array.from(new Set(T(e).map((e) => t.exec(e)?.[1]).filter((e) => !!e))).sort()), qn = (e, t, n, r, i) => M(e, `componentSlugs:${t}:${n}:${r}`, () => {
	let a = [
		RegExp(`^(?:sensor|binary_sensor)\\.${Y(n)}_${r}_([^_]+)_`),
		RegExp(`^(?:sensor|binary_sensor)\\.${Y(t)}_${r}_([^_]+)_`),
		RegExp(`^(?:sensor|binary_sensor)\\.ugos_bridge_${r}_([^_]+)_`)
	];
	return Array.from(new Set(T(e).flatMap((e) => a.map((t) => t.exec(e)?.[1]).filter((e) => !!e)).map((e) => J(e)).filter((e) => !!e && i(e)))).sort();
}), Jn = (e) => e !== void 0 && e.state !== "unknown" && e.state !== "unavailable", R = (e, t) => t ? er(e[t]) : void 0, Yn = (e, t) => {
	if (!t) return;
	let n = e[t];
	if (!n) return;
	let r = pt(n);
	if (!r) return;
	if (r.textState !== void 0) return r.textState ?? void 0;
	let i = n.state;
	return r.textState = !i || i === "unknown" || i === "unavailable" ? null : i, r.textState ?? void 0;
}, z = (e, t) => {
	let n = e?.attributes[t];
	return typeof n == "string" && n.trim() !== "" ? n : void 0;
}, B = (e, t) => {
	let n = e?.attributes[t];
	if (typeof n == "number" && Number.isFinite(n)) return n;
	if (typeof n == "string") return W(n);
}, Xn = (e, t) => {
	let n = e?.attributes[t];
	if (typeof n == "boolean") return n;
	if (typeof n == "number") return n !== 0;
	if (typeof n == "string") {
		let e = n.trim().toLowerCase();
		if (e === "1" || e === "true" || e === "on" || e === "running") return !0;
		if (e === "0" || e === "false" || e === "off" || e === "stopped") return !1;
	}
}, Zn = (e, t) => {
	let n = e?.attributes[t];
	return Array.isArray(n) ? n.filter((e) => typeof e == "string" && e.trim() !== "") : [];
}, Qn = (e, t) => {
	for (let n of e) {
		let e = Zn(n, t);
		if (e.length > 0) return e;
	}
	return [];
}, V = (e, t) => {
	let n = e?.attributes[t];
	return Array.isArray(n) ? n.filter((e) => typeof e == "object" && !!e) : [];
}, H = (e, t) => {
	for (let n of t) {
		let t = e[n];
		if (typeof t == "string" && t.trim() !== "") return t;
	}
}, $n = (e, t) => {
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
}, U = (e, t) => {
	for (let n of t) {
		let t = e[n];
		if (typeof t == "number" && Number.isFinite(t)) return t;
		if (typeof t == "string") {
			let e = W(t);
			if (e !== void 0) return e;
		}
	}
}, W = (e) => {
	if (!e || e === "unknown" || e === "unavailable") return;
	let t = Number(e);
	return Number.isFinite(t) ? t : void 0;
}, er = (e) => {
	let t = pt(e);
	if (t && e) return t.parsedNumber === void 0 && (t.parsedNumber = W(e.state) ?? null), t.parsedNumber ?? void 0;
}, tr = (e) => e?.state === "on";
function nr(e) {
	if (!e) return;
	let t = e.trim();
	return t === "°C" || t === "ºC" || t === "Â°C" || t === "В°C" ? "°C" : t || void 0;
}
var rr = (e) => pt(e)?.unit, G = (e, t) => {
	let n = br(e);
	return t.every((e) => n.includes(e));
}, ir = (e, t, n) => {
	let r = q(e);
	if (!r) return;
	let i = or(r, t);
	if (!i) return;
	let a = i.toLowerCase();
	for (let e of n) {
		let t = e.toLowerCase();
		if (!a.endsWith(` ${t}`)) continue;
		let n = i.slice(0, i.length - e.length).trim();
		return n ? J(n) : void 0;
	}
}, ar = (e, t) => {
	let n = q(e);
	if (!n) return;
	let r = n.toLowerCase(), i = t.replace(/_/g, " ");
	if (!r.includes(i) || !r.includes("/")) return;
	let a = n.match(/(\/[^\s]*)/)?.[1];
	return a ? J(a) : void 0;
}, or = (e, t) => {
	let n = t.replace(/_/g, " ");
	if (e.toLowerCase().startsWith(`${n.toLowerCase()} `)) return e.slice(n.length + 1).trim();
}, sr = (e) => /^(sd[a-z]+|hd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+|loop\d+|serial_[a-z0-9_]+|path_[a-f0-9]+|name_[a-z0-9_]+)$/i.test(e), cr = (e) => /^md\d+$/i.test(e), lr = (e) => /^bond\d+$/i.test(e), ur = (e) => /^(eth\d+|en[a-z0-9]+|eno\d+|ens\d+|enp[a-z0-9]+|wlan\d+|wl[a-z0-9]+|lo)$/i.test(e), dr = (e) => {
	if (e) return e.replace(/\s+/g, " ").trim() || void 0;
}, fr = (e) => {
	let t = e?.trim().toLowerCase();
	if (t) return t === "hdd" || t === "sata" ? "hdd" : t === "nvme" || t === "ssd" ? "nvme" : t;
}, pr = (e) => {
	let t = e?.trim().toLowerCase();
	if (t) return t === "linear" ? "JBOD" : t.toUpperCase();
}, mr = (e) => {
	let t = e.match(/^\/volume(\d+)$/i);
	return t ? `Volume ${t[1]}` : e;
}, hr = (e, t) => {
	let n = t.reduce((e, t) => (t.mediaType && (e[t.mediaType] = (e[t.mediaType] ?? 0) + t.capacityBytes), e), {}), r = Object.entries(n).map(([t, n]) => ({
		mediaType: t,
		distance: Math.abs(n - e.sizeBytes) / Math.max(e.sizeBytes, n, 1)
	})).sort((e, t) => e.distance - t.distance)[0];
	if (r) return r.mediaType === "hdd" ? "SATA" : r.mediaType.toUpperCase();
}, gr = (e, t) => {
	if (e !== void 0 || t !== void 0) return `Drives ${e ?? t ?? 0}/${t ?? e ?? 0}`;
}, _r = (e) => {
	let t = q(e);
	if (!t) return;
	let n = t.replace(/^(?:(?:compose|docker)\s+)?project\s+/i, "").replace(/\s+(CPU|Memory|Total Containers|Running Containers)$/i, "").trim();
	if (!n) return;
	let r = n.split(/\s+/).filter((e, t, n) => t === 0 || e.toLowerCase() !== n[t - 1]?.toLowerCase()).join(" ");
	return r ? J(r) : void 0;
}, vr = (e) => {
	let t = e.trim();
	if (!t) return t;
	let n = t.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(), r = n.split(" ");
	if (r.length % 2 == 0) {
		let e = r.length / 2;
		if (r.slice(0, e).join(" ").toLowerCase() === r.slice(e).join(" ").toLowerCase()) return r.slice(0, e).join(" ");
	}
	return n;
}, yr = (e, t, n, r) => {
	let i = Object.entries(e).filter(([e, n]) => {
		if (!e.startsWith("sensor.") || rr(n) !== "%") return !1;
		let i = `${e} ${q(n)}`.toLowerCase(), a = i.includes(t) || i.includes(t.replace(/_/g, " ")), o = i.includes(r), s = i.includes("busy"), c = i.includes("render/3d") || i.includes("render_3d") || i.includes("blitter") || i.includes("videoenhance") || i.includes("video_enhance") || i.includes("video/") || i.includes("video_");
		return a && o && s && c;
	}).map(([, e]) => W(e.state)).filter((e) => e !== void 0);
	return i.length > 0 ? Math.max(...i) : R(e, xn(e, t, n, r, "busy")) ?? 0;
}, K = (e, t, n) => {
	let r = q(e);
	if (!r) return null;
	let i = r.trim();
	return t && i.endsWith(` ${t}`) && (i = i.slice(0, -` ${t}`.length)), n && i.startsWith(`${n} `) && (i = i.slice(n.length + 1)), i.startsWith("Compose project ") && (i = i.slice(16)), i.trim() || null;
}, q = (e) => pt(e)?.friendlyName ?? "", br = (e) => pt(e)?.friendlyNameLower ?? "", xr = (e) => {
	let t = e.match(/^cpu\s*(\d+)$/i);
	return t ? `Core ${t[1]}` : e.replace(/\s+/g, " ").trim();
}, Sr = (e, t) => (W(e.key.replace(/[^\d]/g, "")) ?? 2 ** 53 - 1) - (W(t.key.replace(/[^\d]/g, "")) ?? 2 ** 53 - 1) || e.name.localeCompare(t.name), Cr = (e) => {
	let t = e.replace(/\/\d+$/g, "").replace(/\/3d/gi, "").replace(/\s+/g, "");
	return /^render/i.test(t) ? "Render" : /^blitter/i.test(t) ? "Blitter" : /^videoenhance/i.test(t) ? "VideoEnhance" : /^video/i.test(t) ? "Video" : e.replace(/\/\d+$/g, "").trim();
}, wr = (e) => e.split("_").filter(Boolean).map((e) => e === "imc" ? "IMC" : e === "rc6" ? "RC6" : e === "mhz" ? "MHz" : e === "mib" ? "MiB" : Ir(e)).join(" "), Tr = (e) => {
	if (!e) return;
	let t = J(e);
	return t === "unknown" ? void 0 : t;
}, Er = (e) => {
	let t = q(e), n = /^(?:Docker container|Virtual machine)\s+(.+?)\s+(CPU|Memory(?: Used)?|Running)$/i.exec(t);
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
	let n = Xn(e, "running");
	if (n !== void 0) return n;
	let r = String(e?.state ?? t ?? "").trim().toLowerCase();
	if (r === "1" || r === "on" || r === "running") return !0;
	if (r === "0" || r === "off" || r === "stopped" || r === "exited") return !1;
}, Ar = (e, t, n) => Tr(z(t, "project_slug") ?? z(t, "project")) || ([
	e,
	z(t, "container") ?? "",
	z(t, "image") ?? ""
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
	accent: w.green,
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
	accent: w.purple,
	key: "pool_2",
	driveSlugs: ["nvme0n1", "nvme1n1"]
}], Kr = Gr.reduce((e, t) => e + t.totalBytes, 0), qr = Gr.reduce((e, t) => e + t.usedBytes, 0), Jr = [
	{
		kind: "cpu",
		title: "CPU",
		accent: w.blue,
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
		accent: w.purple,
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
		accent: w.green,
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
		accent: w.softBlue,
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
		accent: w.cyan,
		totalBytes: Kr,
		usedBytes: qr
	},
	{
		kind: "network",
		title: "Network",
		accent: w.green,
		downloadBps: $(1.2),
		uploadBps: Q(123)
	}
], Yr = [
	{
		key: "cpu",
		title: "CPU",
		subtitle: "Intel Core i5-1235U",
		accent: w.blue,
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
		accent: w.purple,
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
		accent: w.green,
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
			color: w.cyan,
			currentBps: $(1.46),
			series: ni.map((e) => e.totalsByInterface.bond0 ?? 0)
		},
		{
			key: "eth0",
			label: "eth0",
			color: w.good,
			currentBps: Q(521),
			series: ni.map((e) => e.totalsByInterface.eth0 ?? 0)
		},
		{
			key: "eth1",
			label: "eth1",
			color: w.purple,
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
			accent: w.blue,
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
			accent: w.purple,
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
			accent: w.softBlue,
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
			accent: w.cyan,
			totalBytes: 0,
			usedBytes: 0
		},
		{
			kind: "network",
			title: "Network",
			accent: w.green,
			downloadBps: 0,
			uploadBps: 0
		}
	],
	hardwareDetails: [{
		key: "cpu",
		title: "CPU",
		subtitle: "No live data",
		accent: w.blue,
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
		accent: w.purple,
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
		accent: w.softBlue,
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
			accent: w.blue,
			value: li(r?.valuePercent ?? 0),
			secondary: r ? pi(r.temperatureCelsius) : "Unavailable",
			progress: yi((r?.valuePercent ?? 0) / 100),
			fanSpeeds: r?.fanSpeeds
		},
		{
			id: "ram",
			label: "RAM",
			icon: "memory",
			accent: w.purple,
			value: li(i?.valuePercent ?? 0),
			secondary: i ? mi(i.usedBytes, i.totalBytes) : "Unavailable",
			progress: yi((i?.valuePercent ?? 0) / 100)
		},
		{
			id: "gpu",
			label: "GPU",
			icon: "gpu",
			accent: w.green,
			value: a ? li(a.valuePercent) : "N/A",
			secondary: a ? pi(a.temperatureCelsius) : "Unavailable",
			progress: yi((a?.valuePercent ?? 0) / 100)
		},
		{
			id: "systemLoad",
			label: "Load",
			icon: "pulse",
			accent: w.softBlue,
			value: o?.valueText ?? "0.00",
			secondary: o?.statusText ?? "Unavailable",
			progress: yi((o?.valuePercent ?? 0) / 100),
			fanSpeeds: o?.fanSpeeds
		},
		Ci("nvme", "NVMe Volume", w.cyan, c.nvme.totalBytes, c.nvme.usedBytes),
		Ci("sata", "SATA Volume", w.green, c.sata.totalBytes, c.sata.usedBytes),
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
var ki = class extends He {
	constructor(...e) {
		super(...e), this.config = { type: "custom:ugreen-nas-mini-card" }, this.model = Di(), this.history = mt(), this.dataMode = "preview", this.watchEntityIds = [], this.watchPrefixes = [];
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
		return y`
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
		return y`
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
		return y`
      <article class="tile">
        <div class=${e.fanSpeeds?.length ? "tile-body tile-body-with-fans" : "tile-body"}>
          <div class="tile-top">
            ${this.renderIcon(e.icon, `icon icon-${e.icon} accent`)}
            <div class="tile-label">${e.label}</div>
          </div>

          ${e.value ? y`<div class="tile-value">${e.value}</div>` : S}
          ${e.secondary ? y`<div class=${t}>${e.secondary}</div>` : S}

          ${typeof e.progress == "number" ? this.renderProgress(e.progress, e.accent) : S}
          ${e.down || e.up ? this.renderNetworkRows(e.down, e.up) : S}
          ${e.fanSpeeds?.length ? y`
            <div class="fan-speeds">
              ${e.fanSpeeds.map((e) => y`
                <div class="fan-speed-row">
                  <span class="fan-label">${e.label}</span>
                  <span class="fan-rpm">${Math.round(e.rpm)} RPM</span>
                </div>
              `)}
            </div>
          ` : S}
        </div>
      </article>
    `;
	}
	renderProgress(e, t) {
		return y`
      <div class="progress-bar" aria-hidden="true">
        <div
          class="progress-fill"
          style=${`width:${Math.max(0, Math.min(1, e)) * 100}%; --progress-color:${t}; box-shadow:0 0 10px ${t}55;`}
        ></div>
      </div>
    `;
	}
	renderNetworkRows(e, t) {
		return y`
      <div class="network-lines">
        ${e ? y`
          <div class="traffic-row down">
            ${this.renderArrowDown()}
            <span>${e}</span>
          </div>
        ` : S}
        ${t ? y`
          <div class="traffic-row up">
            ${this.renderArrowUp()}
            <span>${t}</span>
          </div>
        ` : S}
      </div>
    `;
	}
	refreshModel() {
		let e = ht(this._hass, this.config, this.history);
		if (e) this.history = e.history, this.watchEntityIds = e.watchEntityIds, this.watchPrefixes = e.watchPrefixes, this.model = Ei(e.model, "live", this.config), this.dataMode = "live";
		else if (this.history = mt(), this.watchEntityIds = [], this.watchPrefixes = [], this._hass?.states) {
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
		for (let n of Object.keys(e)) (this.watchPrefixes.some((e) => n.startsWith(e)) || Rt(n, e[n])) && (t += 1);
		return t;
	}
	renderArrowDown() {
		return b`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 11.5 10 16l5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
	}
	renderArrowUp() {
		return b`
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 17V6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M5 8.5 10 4l5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
	}
	renderIcon(e, t) {
		switch (e) {
			case "chip": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3M4 4l2 2M18 18l2 2M20 4l-2 2M4 20l2-2"></path></svg>`;
			case "memory": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"></rect><path d="M7 10v4M11 10v4M15 10v4M19 10v4M5 19v2M9 19v2M13 19v2M17 19v2"></path></svg>`;
			case "gpu": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="9" cy="11" r="2.2"></circle><path d="M16 9.5h2M16 12.5h2M8 18h8"></path></svg>`;
			case "pulse": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.2-6 4 12 2.2-8H22"></path></svg>`;
			case "database": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></svg>`;
			case "network": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="3" width="4" height="4" rx="1"></rect><rect x="3" y="16" width="4" height="4" rx="1"></rect><rect x="17" y="16" width="4" height="4" rx="1"></rect><path d="M12 7v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path></svg>`;
			case "device": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M9 2h6"></path></svg>`;
			case "clock": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path></svg>`;
			case "monitor": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 17v3"></path></svg>`;
			case "calendar": return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 9h18"></path><path d="M8 14h.01M12 14h.01M16 14h.01"></path></svg>`;
			default: return b`<svg class=${t} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle></svg>`;
		}
	}
};
Oi([Je()], ki.prototype, "config", void 0), Oi([Je()], ki.prototype, "model", void 0), Oi([Je()], ki.prototype, "history", void 0), Oi([Je()], ki.prototype, "dataMode", void 0), Oi([qe({ attribute: !1 })], ki.prototype, "hass", null), ki = Oi([We("ugreen-nas-mini-card")], ki);
