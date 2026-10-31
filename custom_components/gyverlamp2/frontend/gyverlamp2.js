// src/constants.ts
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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, re = f.trustedTypes, ie = re ? re.emptyScript : "", ae = f.reactiveElementPolyfillSupport, p = (e, t) => e, m = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ie : null;
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
}, h = (e, t) => !l(e, t), g = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	useDefault: !1,
	hasChanged: h
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var _ = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = g) {
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
		return this.elementProperties.get(e) ?? g;
	}
	static _$Ei() {
		if (this.hasOwnProperty(p("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(p("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(p("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
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
			let i = (n.converter?.toAttribute === void 0 ? m : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? m : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? h)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[p("elementProperties")] = /* @__PURE__ */ new Map(), _[p("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: _ }), (f.reactiveElementVersions ??= []).push("2.1.2");
// ../../gyverlamp2ha-lit/frontend/node_modules/lit-html/lit-html.js
var v = globalThis, y = (e) => e, b = v.trustedTypes, x = b ? b.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, S = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, w = "?" + C, oe = `<${w}>`, T = document, E = () => T.createComment(""), D = (e) => e === null || typeof e != "object" && typeof e != "function", O = Array.isArray, se = (e) => O(e) || typeof e?.[Symbol.iterator] == "function", k = "[ 	\n\f\r]", A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, j = /-->/g, M = />/g, N = RegExp(`>|${k}(?:([^\\s"'>=/]+)(${k}*=${k}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, le = /"/g, ue = /^(?:script|style|textarea|title)$/i, P = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), F = Symbol.for("lit-noChange"), I = Symbol.for("lit-nothing"), L = /* @__PURE__ */ new WeakMap(), R = T.createTreeWalker(T, 129);
function z(e, t) {
	if (!O(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return x === void 0 ? t : x.createHTML(t);
}
var B = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = A;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === A ? c[1] === "!--" ? o = j : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = N) : (ue.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = N) : o = M : o === N ? c[0] === ">" ? (o = i ?? A, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? N : c[3] === "\"" ? le : ce) : o === le || o === ce ? o = N : o === j || o === M ? o = A : (o = N, i = void 0);
		let d = o === N && e[t + 1].startsWith("/>") ? " " : "";
		a += o === A ? n + oe : l >= 0 ? (r.push(s), n.slice(0, l) + S + n.slice(l) + C + d) : n + C + (l === -2 ? t : d);
	}
	return [z(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, V = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = B(t, n);
		if (this.el = e.createElement(l, r), R.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = R.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(S)) {
					let t = u[o++], n = i.getAttribute(e).split(C), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? K : r[1] === "?" ? de : r[1] === "@" ? fe : G
					}), i.removeAttribute(e);
				} else e.startsWith(C) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ue.test(i.tagName)) {
					let e = i.textContent.split(C), t = e.length - 1;
					if (t > 0) {
						i.textContent = b ? b.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], E()), R.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], E());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === w) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(C, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += C.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = T.createElement("template");
		return n.innerHTML = e, n;
	}
};
function H(e, t, n = e, r) {
	if (t === F) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = D(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = H(e, i._$AS(e, t.values), i, r)), t;
}
var U = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? T).importNode(t, !0);
		R.currentNode = r;
		let i = R.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new W(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new pe(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = R.nextNode(), a++);
		}
		return R.currentNode = T, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, W = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = I, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = H(this, e, t), D(e) ? e === I || e == null || e === "" ? (this._$AH !== I && this._$AR(), this._$AH = I) : e !== this._$AH && e !== F && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? se(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== I && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = V.createElement(z(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new U(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = L.get(e.strings);
		return t === void 0 && L.set(e.strings, t = new V(e)), t;
	}
	k(t) {
		O(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(E()), this.O(E()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = y(e).nextSibling;
			y(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, G = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = I, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = I;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = H(this, e, t, 0), a = !D(e) || e !== this._$AH && e !== F, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = H(this, r[n + o], t, o), s === F && (s = this._$AH[o]), a ||= !D(s) || s !== this._$AH[o], s === I ? e = I : e !== I && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === I ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, K = class extends G {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === I ? void 0 : e;
	}
}, de = class extends G {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== I);
	}
}, fe = class extends G {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = H(this, e, t, 0) ?? I) === F) return;
		let n = this._$AH, r = e === I && n !== I || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== I && (n === I || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, pe = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		H(this, e);
	}
}, me = {
	M: S,
	P: C,
	A: w,
	C: 1,
	L: B,
	R: U,
	D: se,
	V: H,
	I: W,
	H: G,
	N: de,
	U: fe,
	B: K,
	F: pe
}, he = v.litHtmlPolyfillSupport;
he?.(V, W), (v.litHtmlVersions ??= []).push("3.3.3");
var ge = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new W(t.insertBefore(E(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, q = globalThis, J = class extends _ {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ge(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return F;
	}
};
J._$litElement$ = !0, J.finalized = !0, q.litElementHydrateSupport?.({ LitElement: J });
var _e = q.litElementPolyfillSupport;
_e?.({ LitElement: J }), (q.litElementVersions ??= []).push("4.2.2");
// ../../gyverlamp2ha-lit/frontend/node_modules/lit-html/directive.js
var Y = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, ve = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), ye = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, { I: be } = me, xe = (e) => e.strings === void 0, Se = {}, Ce = (e, t = Se) => e._$AH = t, X = ve(class extends ye {
	constructor(e) {
		if (super(e), e.type !== Y.PROPERTY && e.type !== Y.ATTRIBUTE && e.type !== Y.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
		if (!xe(e)) throw Error("`live` bindings can only contain a single expression");
	}
	render(e) {
		return e;
	}
	update(e, [t]) {
		if (t === F || t === I) return t;
		let n = e.element, r = e.name;
		if (e.type === Y.PROPERTY) {
			if (t === n[r]) return F;
		} else if (e.type === Y.BOOLEAN_ATTRIBUTE) {
			if (!!t === n.hasAttribute(r)) return F;
		} else if (e.type === Y.ATTRIBUTE && n.getAttribute(r) === t + "") return F;
		return Ce(e), t;
	}
}), we = o`
  :host {
    display: block;
    color: var(--primary-text-color);
  }

  * {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  ha-card {
    display: block;
    overflow: hidden;
    background: var(--ha-card-background, var(--card-background-color));
  }

  .card {
    padding: 24px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lamp-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--secondary-background-color);
  }

  .lamp-icon ha-icon {
    color: var(--primary-color);
  }

  .subtitle {
    color: var(--secondary-text-color);
    font-size: 13px;
    margin-bottom: 3px;
  }

  h2 {
    font-size: 22px;
    font-weight: 500;
    margin: 0;
  }

  button,
  select,
  input {
    font: inherit;
  }

  button {
    color: var(--primary-text-color);
    border: 0;
    cursor: pointer;
  }

  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0 22px;
  }

  .percent {
    font-size: 44px;
    line-height: 1.15;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  .state {
    min-height: 20px;
    margin-top: 6px;
    color: var(--secondary-text-color);
    font-size: 13px;
  }

  .brightness {
    width: ${132}px;
    height: ${240}px;
    margin: 22px 0 18px;
    border-radius: ${36}px;
    position: relative;
    overflow: hidden;
    background: var(--secondary-background-color);
  }

  .fill {
    position: absolute;
    inset: auto 0 0;
    height: var(--level, 0%);
    background: var(--lamp-color, #ffc107);
    pointer-events: none;
  }

  .grip {
    position: absolute;
    left: calc(50% - ${24}px);
    bottom: clamp(
      ${13}px,
      calc(var(--level, 0%) - ${17}px),
      ${220}px
    );
    width: ${48}px;
    height: ${5}px;
    border-radius: 4px;
    background: white;
    pointer-events: none;
  }

  .brightness input[type="range"],
  .brightness input[type="range"]:disabled {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    writing-mode: vertical-lr;
    direction: rtl;
    opacity: 0 !important;
    cursor: ns-resize;
  }

  .brightness:focus-within {
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
  }

  .power {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--secondary-background-color);
  }

  .power[aria-pressed="true"] {
    color: var(--primary-color);
  }

  .power ha-icon {
    --mdc-icon-size: 28px;
  }

  .controls {
    display: grid;
    gap: 16px;
  }

  .field {
    display: grid;
    gap: 7px;
    font-size: 14px;
  }

  .field > span,
  .range-title {
    color: var(--secondary-text-color);
  }

  select {
    width: 100%;
    min-height: 48px;
    padding: 10px 38px 10px 13px;
    color: var(--primary-text-color);
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    cursor: pointer;
  }

  option {
    color: var(--primary-text-color);
    background: var(--card-background-color);
  }

  .range-title {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  output {
    color: var(--primary-text-color);
    font-variant-numeric: tabular-nums;
  }

  .field input[type="range"] {
    width: 100%;
    min-height: 34px;
    margin: 0;
    accent-color: var(--primary-color);
    cursor: pointer;
  }

  .note {
    margin: 18px 0 0;
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .error {
    margin-top: 14px;
    color: var(--error-color, #db4437);
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  button:disabled,
  select:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: ${360}px) {
    .card {
      padding: 18px;
    }
  }
`, Te = o`
  dialog {
    width: ${560}px;
    max-width: calc(100vw - ${24}px);
    max-height: calc(100dvh - ${24}px);
    padding: 0;
    border: 1px solid var(--divider-color);
    border-radius: 24px;
    color: var(--primary-text-color);
    background: var(--ha-card-background, var(--card-background-color));
    box-shadow: 0 12px 48px #0006;
    overflow: hidden;
  }

  dialog::backdrop {
    background: #0008;
  }

  .tools {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    padding: 8px 10px;
    background: var(--ha-card-background, var(--card-background-color));
  }

  button {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    color: var(--primary-text-color);
    background: transparent;
  }

  button:hover {
    background: var(--secondary-background-color);
  }

  button:focus-visible {
    outline: 3px solid var(--primary-color);
  }

  .content {
    max-height: calc(100dvh - ${86}px);
    overflow: auto;
    overscroll-behavior: contain;
  }

  gyverlamp2-card {
    --ha-card-border-width: 0;
    --ha-card-box-shadow: none;
  }
`, Ee = o`
  :host {
    display: block;
  }

  [hidden] {
    display: none !important;
  }

  .wheel:focus-visible {
    outline: 3px solid var(--primary-color);
    outline-offset: 4px;
  }

  .color {
    padding: 4px 0;
  }

  .wheel {
    position: relative;
    width: ${220}px;
    height: ${220}px;
    margin: 12px auto 0;
    border-radius: 50%;
    touch-action: none;
    cursor: crosshair;
    background:
      radial-gradient(circle, white 0%, transparent 71%),
      conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red);
    box-shadow: inset 0 0 0 1px #0002;
  }

  .wheel-marker {
    position: absolute;
    width: ${18}px;
    height: ${18}px;
    border: 3px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow:
      0 0 0 1px #0008,
      0 1px 5px #0008;
    pointer-events: none;
  }

  .color-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    gap: 12px;
  }

  .color-tools small {
    color: var(--secondary-text-color);
  }

  .color-chip {
    appearance: none;
    -webkit-appearance: none;
    border: 0;
    background: none;
    padding: 0;
    width: 42px;
    height: 32px;
    cursor: pointer;
  }

  .color-chip::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-chip::-webkit-color-swatch {
    border: 1px solid var(--divider-color);
    border-radius: 8px;
  }

  @media (max-width: ${360}px) {
    .wheel {
      width: ${200}px;
      height: ${200}px;
    }
  }
`, Z = 6, De = 360 / Z, Oe = 4, ke = 2, Ae = 4, je = 5, Me = 3, Ne = 1, Pe = 16, Fe = 2, Ie = [
	1,
	3,
	5
], Le = 180, Re = 50;
function ze([e, t]) {
	let n = (n) => {
		let r = (n + e / De) % Z, i = 1 - t / 100 * Math.max(0, Math.min(r, Oe - r, 1));
		return Math.round(i * 255).toString(Pe).padStart(Fe, "0");
	};
	return `#${n(je)}${n(Me)}${n(Ne)}`;
}
function Be(e) {
	let [t, n, r] = Ie.map((t) => parseInt(e.slice(t, t + Fe), Pe) / 255), i = Math.max(t, n, r), a = i - Math.min(t, n, r), o = 0;
	return a && (o = i === t ? (n - r) / a % Z : i === n ? (r - t) / a + ke : (t - n) / a + Ae), [(o * De + 360) % 360, i === 0 ? 0 : a / i * 100];
}
var Ve = class extends J {
	constructor(...e) {
		super(...e), this.color = [0, 100], this.saturationEnabled = !1, this.disabled = !1, this.dragging = !1;
	}
	static {
		this.properties = {
			color: { attribute: !1 },
			saturationEnabled: { type: Boolean },
			disabled: { type: Boolean }
		};
	}
	static {
		this.styles = Ee;
	}
	render() {
		let [e, t] = this.color, n = e * Math.PI / Le, r = Re + Math.cos(n) * t / 2, i = Re + Math.sin(n) * t / 2;
		return P`
      <div
        class="wheel"
        tabindex=${this.disabled ? -1 : 0}
        role="group"
        aria-label="Цветовой круг: стрелки меняют оттенок, Shift со стрелками меняет насыщенность"
        aria-disabled=${this.disabled}
        @pointerdown=${this.startDrag}
        @pointermove=${this.moveDrag}
        @pointerup=${this.finishDrag}
        @pointercancel=${this.cancelDrag}
        @keydown=${this.onKey}
      >
        <div class="wheel-marker" style="left:${r}%;top:${i}%"></div>
      </div>
      <div class="color-tools">
        <small>Оттенок эффекта</small>
        <input
          type="color"
          class="color-chip"
          aria-label="Выбрать точный цвет"
          .value=${X(ze(this.color))}
          ?disabled=${this.disabled}
          @input=${this.previewNativeColor}
          @change=${this.commitNativeColor}
          @pointercancel=${this.cancelDrag}
        />
      </div>
    `;
	}
	emit(e, t) {
		this.dispatchEvent(new CustomEvent(e, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	normalizeColor([e, t]) {
		return [e, this.saturationEnabled ? t : 100];
	}
	position(e) {
		let t = e.currentTarget.getBoundingClientRect(), n = (e.clientX - t.left - t.width / 2) / (t.width / 2), r = (e.clientY - t.top - t.height / 2) / (t.height / 2);
		return this.normalizeColor([(Math.atan2(r, n) * Le / Math.PI + 360) % 360, Math.min(100, Math.hypot(n, r) * 100)]);
	}
	startDrag(e) {
		if (this.disabled) return;
		e.preventDefault(), this.dragging = !0;
		let t = e.currentTarget;
		t.focus(), t.setPointerCapture(e.pointerId), this.color = this.position(e), this.emit("color-preview", this.color);
	}
	moveDrag(e) {
		this.dragging && !this.disabled && (this.color = this.position(e), this.emit("color-preview", this.color));
	}
	finishDrag(e) {
		this.dragging && (this.dragging = !1, this.disabled ? this.emit("color-cancel") : (this.color = this.position(e), this.emit("color-commit", this.color)));
	}
	cancelDrag() {
		this.dragging = !1, this.emit("color-cancel");
	}
	onKey(e) {
		if (this.disabled || ![
			"ArrowLeft",
			"ArrowRight",
			"ArrowUp",
			"ArrowDown"
		].includes(e.key)) return;
		e.preventDefault();
		let t = ["ArrowLeft", "ArrowDown"].includes(e.key) ? -1 : 1, [n, r] = this.color;
		this.color = e.shiftKey && this.saturationEnabled ? [n, Math.max(0, Math.min(100, r + t * 5))] : [(n + t * 5 + 360) % 360, r], this.emit("color-commit", this.color);
	}
	previewNativeColor(e) {
		this.color = this.normalizeColor(Be(e.target.value)), this.emit("color-preview", this.color);
	}
	commitNativeColor(e) {
		this.color = this.normalizeColor(Be(e.target.value)), this.emit("color-commit", this.color);
	}
}, He = [
	"effect",
	"source",
	"palette"
], Ue = class {
	constructor(e, t, n) {
		this.host = e, this.state = t, this.execute = n, this.drafts = /* @__PURE__ */ new Map(), this.pending = /* @__PURE__ */ new Map(), this.queue = [], this.connected = !1, this.busy = !1, this.error = "", e.addController(this);
	}
	hostConnected() {
		this.connected = !0;
	}
	hostDisconnected() {
		this.connected = !1, this.drafts.clear();
		for (let e of this.pending.keys()) this.clearPending(e);
	}
	value(e) {
		return this.drafts.get(e)?.value ?? this.pending.get(e)?.value ?? this.state.read(e);
	}
	preview(e, t) {
		this.drafts.set(e, {
			value: t,
			scope: this.state.scope
		}), this.host.requestUpdate();
	}
	cancelPreview(e) {
		this.drafts.delete(e), this.host.requestUpdate();
	}
	get structuralPending() {
		return He.some((e) => this.pending.has(e));
	}
	reconcile() {
		for (let [e, t] of this.drafts) t.scope !== this.state.scope && this.drafts.delete(e);
		for (let [e, t] of this.pending) this.isStale(t) ? this.clearPending(e) : t.status !== "queued" && (this.matches(e, this.state.read(e), t.value) && (t.acknowledged = !0), t.status === "awaiting" && t.acknowledged && this.clearPending(e));
		this.host.requestUpdate();
	}
	submit(e, t, n) {
		this.drafts.delete(e), this.clearPending(e);
		let r = {
			...n,
			key: e,
			value: t,
			scope: e === "effect" || e === "power" ? void 0 : this.state.scope,
			status: "queued",
			acknowledged: !1
		};
		this.pending.set(e, r);
		let i = -1;
		for (let t = this.queue.length - 1; t >= 0; t--) {
			let n = this.queue[t];
			if (He.includes(n.key)) break;
			if (n.key === e && n.scope === r.scope) {
				i = t;
				break;
			}
		}
		i >= 0 ? this.queue[i] = r : this.queue.push(r), this.error = "", this.host.requestUpdate(), this.busy || this.drain();
	}
	isStale(e) {
		return e.scope !== void 0 && e.scope !== this.state.scope;
	}
	clearPending(e) {
		clearTimeout(this.pending.get(e)?.timer), this.pending.delete(e);
	}
	matches(e, t, n) {
		if (e !== "color") return t === n;
		if (!Array.isArray(t) || !Array.isArray(n)) return !1;
		let [r, i] = t, [a, o] = n, s = Math.abs(r - a) % 360;
		return Math.min(s, 360 - s) < .2 && Math.abs(i - o) < .5;
	}
	async drain() {
		this.busy = !0;
		try {
			for (; this.queue.length;) {
				let e = this.queue.shift();
				if (this.isStale(e)) this.pending.get(e.key) === e && this.clearPending(e.key);
				else {
					e.status = "sending";
					try {
						await this.execute(e), e.status = "awaiting", this.reconcile(), this.pending.get(e.key) === e && this.connected && (e.timer = setTimeout(() => {
							this.pending.get(e.key) === e && (this.clearPending(e.key), this.error = "Home Assistant не подтвердил изменение. Показано последнее полученное значение.", this.host.requestUpdate());
						}, 1e4));
					} catch (t) {
						this.pending.get(e.key) === e && (this.clearPending(e.key), this.error = t instanceof Error ? t.message : "Не удалось выполнить команду");
					}
					this.host.requestUpdate();
				}
			}
		} finally {
			this.busy = !1, this.host.requestUpdate();
		}
	}
}, We = [
	"mode",
	"palette",
	"color_source",
	"speed",
	"scale",
	"hue",
	"saturation"
], Ge = class {
	constructor() {
		this.knownBrightness = /* @__PURE__ */ new Map(), this.explicitConfig = { entity: "" }, this.config = { entity: "" };
	}
	configure(e) {
		if (!e.entity.startsWith("light.")) throw Error("Укажите entity: light.<имя лампы>");
		this.explicitConfig = { ...e };
		let t = e.entity.slice(6);
		this.config = {
			...Object.fromEntries(We.map((e) => [`${e}_entity`, `${[
				"mode",
				"palette",
				"color_source"
			].includes(e) ? "select" : "number"}.${t}_${e === "mode" ? "ha_mode" : e}`])),
			...e
		}, this.resolveBindings();
	}
	update(e) {
		this.hass = e, this.resolveBindings();
		let t = this.light?.attributes.brightness;
		t !== void 0 && Number.isFinite(t) && this.knownBrightness.set(this.scope, t);
	}
	resolveBindings() {
		let e = this.light?.attributes.gyverlamp2_ui;
		if (e?.schema === 1) for (let t of We) {
			let n = `${t}_entity`;
			this.config[n] = this.explicitConfig[n] || e[n];
		}
	}
	entity(e) {
		return e ? this.hass?.states[e] : void 0;
	}
	control(e) {
		return this.entity(this.config[e]);
	}
	get light() {
		return this.entity(this.config.entity);
	}
	get attributes() {
		return this.light?.attributes ?? {};
	}
	get scope() {
		return this.attributes.mode_key ?? this.attributes.effect ?? this.control("mode_entity")?.state;
	}
	get unavailable() {
		return !this.light || this.light.state === "unavailable";
	}
	available(e) {
		return !!e && !["unavailable", "unknown"].includes(e.state);
	}
	supports(e) {
		return this.attributes.mode_parameters?.[e] === !0;
	}
	options(e) {
		return this.control(e)?.attributes.options ?? (e === "mode_entity" ? this.attributes.effect_list ?? [] : []);
	}
	read(e) {
		let t = (e) => {
			let t = this.control(e)?.state;
			return t !== void 0 && Number.isFinite(Number(t)) ? Number(t) : void 0;
		}, n = this.attributes.brightness ?? this.knownBrightness.get(this.scope), r = this.attributes.hs_color ?? [t("hue_entity") ?? 0, this.supports("saturation") ? t("saturation_entity") ?? 0 : 100];
		return {
			power: this.light?.state === "on" || this.light?.state !== "off" && void 0,
			brightness: n !== void 0 && Number.isFinite(n) ? Math.max(1, Math.round(n * 100 / 255)) : void 0,
			color: r,
			effect: this.attributes.effect ?? this.control("mode_entity")?.state,
			speed: t("speed_entity"),
			scale: t("scale_entity"),
			source: this.control("color_source_entity")?.state,
			palette: this.control("palette_entity")?.state
		}[e];
	}
}, Ke = class extends J {
	constructor(...e) {
		super(...e), this.state = new Ge(), this.commands = new Ue(this, this.state, (e) => this.state.hass ? this.state.hass.callService(e.domain, e.service, e.data) : Promise.reject(/* @__PURE__ */ Error("Нет подключения к Home Assistant")));
	}
	static {
		this.styles = we;
	}
	set hass(e) {
		this.state.update(e), this.commands.reconcile();
	}
	set cardConfig(e) {
		this.setConfig(e);
	}
	setConfig(e) {
		this.state.configure(e), this.commands.reconcile();
	}
	getCardSize() {
		return 15;
	}
	getGridOptions() {
		return {
			columns: 12,
			rows: "auto",
			min_columns: 6
		};
	}
	static getStubConfig() {
		return { entity: "light.gyverlamp2" };
	}
	render() {
		if (!this.state.hass || !this.state.config.entity) return P``;
		let e = this.commands.value("power"), t = this.commands.value("brightness"), n = this.commands.value("color"), r = this.state.unavailable, i = this.commands.structuralPending, a = this.state.config.name || this.state.attributes.friendly_name || "GyverLamp2", o = r ? "Нет связи с лампой" : e === !0 ? "Включена" : e === !1 ? "Выключена" : "Питание неизвестно", s = this.state.available(this.state.control("color_source_entity")), c = this.state.available(this.state.control("palette_entity")) && (!s || this.commands.value("source") === "palette");
		return P`
      <ha-card data-version=${"2.0.1"}>
        <div class="card">
          <header>
            <span class="lamp-icon"><ha-icon icon="mdi:lava-lamp"></ha-icon></span>
            <div>
              <div class="subtitle">${this.state.config.subtitle ?? ""}</div>
              <h2>${a}</h2>
            </div>
          </header>

          <section class="hero" aria-label="Яркость и питание">
            <div class="percent">${t === void 0 ? "—" : `${t}%`}</div>
            <div class="state">${o}</div>
            <div
              class="brightness"
              style="--level:${t ?? 0}%;--lamp-color:${this.state.supports("hue") ? ze(n) : "#ffc107"}"
            >
              <div class="fill"></div>
              <div class="grip"></div>
              <input
                id="brightness"
                type="range"
                min=${1}
                max=${100}
                step=${1}
                aria-label="Яркость"
                .value=${X(String(t ?? 100))}
                ?disabled=${i || r}
                @input=${(e) => this.previewNumber("brightness", e)}
                @change=${this.changeBrightness}
                @pointercancel=${() => this.commands.cancelPreview("brightness")}
              />
            </div>
            <button
              class="power"
              type="button"
              aria-pressed=${e === !0}
              aria-label=${e === !0 ? "Выключить лампу" : "Включить лампу"}
              ?disabled=${i || r}
              @click=${this.togglePower}
            >
              <ha-icon icon="mdi:power"></ha-icon>
            </button>
          </section>

          <div class="controls" aria-busy=${this.commands.busy}>
            ${this.selectField("effect", "Эффект", "mode_entity")}
            ${this.selectField("source", "Источник цвета", "color_source_entity", !s, {
			hue: "Оттенок",
			palette: "Палитра"
		})}
            ${this.selectField("palette", "Палитра", "palette_entity", !c)}
            <section id="color-field" class="field" ?hidden=${!this.state.supports("hue")}>
              <span>Цвет</span>
              <gyverlamp2-color-picker
                .color=${X(n)}
                .saturationEnabled=${this.state.supports("saturation")}
                .disabled=${i || !this.state.supports("hue")}
                @color-preview=${(e) => this.commands.preview("color", e.detail)}
                @color-commit=${(e) => this.changeColor(e.detail)}
                @color-cancel=${() => this.commands.cancelPreview("color")}
              ></gyverlamp2-color-picker>
            </section>

            ${this.numberField("speed", "Скорость")} ${this.numberField("scale", "Масштаб")}
          </div>

          <p class="note" ?hidden=${!r}>
            Настройки можно изменить без связи. Они отправятся при следующем управлении лампой.
          </p>
          <div class="error" role="alert" ?hidden=${!this.commands.error}>
            ${this.commands.error}
          </div>
        </div>
      </ha-card>
    `;
	}
	selectField(e, t, n, r = !1, i = {}) {
		let a = this.commands.value(e);
		return P`
      <label class="field" id="${e}-field" ?hidden=${r}>
        <span>${t}</span>
        <select
          id=${e}
          aria-label=${t}
          ?disabled=${this.commands.structuralPending}
          @change=${(t) => this.changeSelection(e, n, t)}
        >
          ${this.state.options(n).map((e) => P`
              <option value=${e} .selected=${X(e === a)}>
                ${i[e] ?? e}
              </option>
            `)}
        </select>
      </label>
    `;
	}
	numberField(e, t) {
		let n = this.state.supports(e) && this.state.available(this.state.control(`${e}_entity`)), r = this.commands.value(e);
		return P`
      <label id="${e}-field" class="field" ?hidden=${!n}>
        <span class="range-title">
          ${t}
          <output id="${e}-value">${r ?? ""}</output>
        </span>
        <input
          id=${e}
          type="range"
          min=${0}
          max=${255}
          step=${1}
          aria-label=${t}
          .value=${X(String(r ?? 0))}
          ?disabled=${this.commands.structuralPending}
          @input=${(t) => this.previewNumber(e, t)}
          @change=${(t) => this.changeParameter(e, t)}
          @pointercancel=${() => this.commands.cancelPreview(e)}
        />
      </label>
    `;
	}
	inputNumber(e) {
		return Number(e.target.value);
	}
	previewNumber(e, t) {
		this.commands.preview(e, this.inputNumber(t));
	}
	changeBrightness(e) {
		let t = this.inputNumber(e);
		this.commands.submit("brightness", t, {
			domain: "light",
			service: "turn_on",
			data: {
				entity_id: this.state.config.entity,
				brightness_pct: t
			}
		});
	}
	togglePower() {
		let e = this.commands.value("power") === !0;
		this.commands.submit("power", !e, {
			domain: "light",
			service: e ? "turn_off" : "turn_on",
			data: { entity_id: this.state.config.entity }
		});
	}
	changeSelection(e, t, n) {
		let r = n.target.value;
		this.commands.submit(e, r, {
			domain: "select",
			service: "select_option",
			data: {
				entity_id: this.state.config[t],
				option: r
			}
		});
	}
	changeParameter(e, t) {
		let n = this.inputNumber(t);
		this.submitMode(e, n, { [e]: n });
	}
	changeColor([e, t]) {
		let n = Math.round(e * 10) / 10, r = this.state.supports("saturation") ? Math.round(t * 10) / 10 : 100;
		this.submitMode("color", [n, r], {
			hue: n,
			...this.state.supports("saturation") ? { saturation: r } : {}
		});
	}
	submitMode(e, t, n) {
		this.commands.submit(e, t, {
			domain: "gyverlamp2",
			service: "set_mode",
			data: {
				entity_id: this.state.config.entity,
				mode: this.state.read("effect"),
				...n
			}
		});
	}
}, qe = class extends J {
	constructor(...e) {
		super(...e), this.opened = !1;
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			config: { state: !0 }
		};
	}
	static {
		this.styles = Te;
	}
	render() {
		return P`
      <dialog
        aria-label="Управление GyverLamp2"
        @cancel=${this.cancel}
        @close=${this.closeDialog}
        @click=${this.closeOnBackdrop}
      >
        <div class="tools">
          <button
            type="button"
            aria-label="История лампы"
            title="История"
            @click=${() => this.moreInfo("history")}
          >
            <ha-icon icon="mdi:chart-box-outline"></ha-icon>
          </button>
          <button
            type="button"
            aria-label="Настройки сущности лампы"
            title="Настройки"
            @click=${() => this.moreInfo("settings")}
          >
            <ha-icon icon="mdi:cog-outline"></ha-icon>
          </button>
          <button
            id="close"
            type="button"
            aria-label="Закрыть управление лампой"
            title="Закрыть"
            autofocus
            @click=${this.closeDialog}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="content">
          ${this.config ? P`
                  <gyverlamp2-card .cardConfig=${this.config} .hass=${this.hass}></gyverlamp2-card>
                ` : ""}
        </div>
      </dialog>
    `;
	}
	async showDialog({ config: e }) {
		this.config = e, this.opened = !0, await this.updateComplete, this.openNative();
	}
	connectedCallback() {
		super.connectedCallback(), this.updateComplete.then(() => this.openNative());
	}
	closeDialog() {
		if (!this.opened) return !0;
		this.opened = !1;
		let e = this.renderRoot.querySelector("dialog");
		return e?.open && e.close(), this.config = void 0, this.dispatchEvent(new CustomEvent("dialog-closed", {
			bubbles: !0,
			composed: !0,
			detail: { dialog: this.localName }
		})), !0;
	}
	openNative() {
		let e = this.renderRoot.querySelector("dialog");
		this.isConnected && this.opened && e && !e.open && (e.showModal(), this.renderRoot.querySelector(".content")?.scrollTo?.(0, 0));
	}
	moreInfo(e) {
		this.dispatchEvent(new CustomEvent("hass-more-info", {
			bubbles: !0,
			composed: !0,
			detail: {
				entityId: this.config?.entity,
				view: e
			}
		}));
	}
	cancel(e) {
		e.preventDefault(), this.closeDialog();
	}
	closeOnBackdrop(e) {
		let t = e.currentTarget;
		if (e.target !== t) return;
		let n = t.getBoundingClientRect();
		(e.clientX < n.left || e.clientX > n.right || e.clientY < n.top || e.clientY > n.bottom) && this.closeDialog();
	}
}, Q = Symbol.for("gyverlamp2.popup-configs");
function Je(e) {
	if (e && !e.entity.startsWith("light.")) throw Error("Popup requires a light entity");
	let t = window;
	t[Q] || (t[Q] = /* @__PURE__ */ new Map(), window.addEventListener("hass-more-info", Ye, { capture: !0 })), e && t[Q].set(e.entity, { ...e });
}
function Ye(e) {
	let t = e.detail, n = t?.entityId;
	if (!n?.startsWith("light.") || (t.view || t.tab || "info") !== "info") return;
	let r = e.composedPath().find((e) => e instanceof HTMLElement && !!e.hass?.states[n]);
	if (!r) return;
	let i = window[Q]?.get(n), a = r.hass?.states[n]?.attributes.gyverlamp2_ui;
	(i || a?.schema === 1) && (e.preventDefault(), e.stopImmediatePropagation(), r.dispatchEvent(new CustomEvent("show-dialog", {
		bubbles: !0,
		composed: !0,
		detail: {
			dialogTag: "gyverlamp2-control-dialog",
			dialogImport: () => Promise.resolve(),
			dialogParams: { config: i ?? { entity: n } }
		}
	})));
}
// src/index.ts
for (let [e, t] of [
	["gyverlamp2-color-picker", Ve],
	["gyverlamp2-card", Ke],
	["gyverlamp2-control-dialog", qe]
]) customElements.get(e) || customElements.define(e, t);
var $ = window;
$.customCards ??= [], $.customCards.some((e) => e.type === "gyverlamp2-card") || $.customCards.push({
	type: "gyverlamp2-card",
	name: "GyverLamp2",
	description: "Эффекты, цветовой круг, палитры и параметры лампы",
	preview: !1
}), Je();
