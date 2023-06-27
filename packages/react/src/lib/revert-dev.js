var j = Object.defineProperty;
var H = (c, o, a) => o in c ? j(c, o, { enumerable: !0, configurable: !0, writable: !0, value: a }) : c[o] = a;
var b = (c, o, a) => (H(c, typeof o != "symbol" ? o + "" : o, a), a), N = (c, o, a) => {
  if (!o.has(c))
    throw TypeError("Cannot " + a);
};
var p = (c, o, a) => (N(c, o, "read from private field"), a ? a.call(c) : o.get(c)), v = (c, o, a) => {
  if (o.has(c))
    throw TypeError("Cannot add the same private member more than once");
  o instanceof WeakSet ? o.add(c) : o.set(c, a);
}, _ = (c, o, a, C) => (N(c, o, "write to private field"), C ? C.call(c, a) : o.set(c, a), a);
(function() {
  function c(o, a, C) {
    function x(E, g) {
      if (!a[E]) {
        if (!o[E]) {
          var D = typeof require == "function" && require;
          if (!g && D)
            return D(E, !0);
          if (y)
            return y(E, !0);
          var A = new Error("Cannot find module '" + E + "'");
          throw A.code = "MODULE_NOT_FOUND", A;
        }
        var T = a[E] = { exports: {} };
        o[E][0].call(T.exports, function(B) {
          var O = o[E][1][B];
          return x(O || B);
        }, T, T.exports, c, o, a, C);
      }
      return a[E].exports;
    }
    for (var y = typeof require == "function" && require, R = 0; R < C.length; R++)
      x(C[R]);
    return x;
  }
  return c;
})()({ 1: [function(c, o, a) {
  var C, x = {
    CORE_API_BASE_URL: "http://localhost:4001/",
    HUBSPOT_CLIENT_ID: "98c4040c-fc8c-4e36-872f-1afe30a7ed35",
    REDIRECT_URL_BASE: "http://localhost:3000/oauth-callback",
    ZOHOCRM_CLIENT_ID: "1000.J6XYQN1AOUWTQPRIZVJZ9AKNQXRL1D",
    SFDC_CLIENT_ID: "3MVG9n_HvETGhr3DqXEaT8BJkxX0ubyKWtbaQb.AnYrpdb8cxsXN2JOwD71T8gPyd8gE.jFgar02Y29Leu7dC"
  };
  const y = function(e) {
    for (let [t, i] of Object.entries(e)) {
      let l = E(t);
      t !== l && (Object.defineProperty(e, l, Object.getOwnPropertyDescriptor(e, t)), delete e[t]), typeof i == "number" && l !== "z-index" && (e[l] = i + "px");
    }
    return e;
  }, R = function(e) {
    const t = document.createElement("style");
    t.textContent = e, document.head.append(t);
  }, E = function(e) {
    return e.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
  }, g = function(e, t, i, l, r) {
    const u = document.createElement(e);
    u.setAttribute("id", t), Object.assign(u.style, i);
    for (let f = 0; f < l.length; f++) {
      const s = l[f];
      u.appendChild(s);
    }
    return r && (u.innerHTML = r), u;
  }, D = function() {
    let e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    e.setAttributeNS(null, "fill", "#969696"), e.setAttributeNS(null, "width", "24"), e.setAttributeNS(null, "height", "24");
    let t = document.createElementNS("http://www.w3.org/2000/svg", "path");
    t.setAttributeNS(null, "d", "M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"), e.appendChild(t);
    var i = g("span", "fd-welcome-close-btn", y({
      position: "absolute",
      top: 10,
      right: 10,
      cursor: "pointer"
    }), [e]);
    return i;
  }, A = function(e, t) {
    const i = t.status !== "active";
    let l = g("span", `connect-${t.integrationId}`, y({
      cursor: i ? "auto " : "pointer",
      padding: "8px 20px",
      color: "#fff",
      textAlign: "center",
      alignSelf: "center",
      background: i ? "#9394c4" : "#272DC0",
      borderRadius: 5,
      fontSize: 14
    }), [], "Connect");
    const r = JSON.stringify({
      tenantId: e.tenantId,
      revertPublicToken: e.API_REVERT_PUBLIC_TOKEN
    });
    if (!i) {
      if (t.integrationId === "hubspot")
        l.addEventListener("click", () => {
          window.open(`https://app.hubspot.com/oauth/authorize?client_id=${e.HUBSPOT_CLIENT_ID}&redirect_uri=${e.REDIRECT_URL_BASE}/hubspot&scope=${t.scopes.join("%20")}&state=${r}`), e.close();
        });
      else if (t.integrationId === "zohocrm")
        l.addEventListener("click", () => {
          window.open(`https://accounts.zoho.com/oauth/v2/auth?scope=${t.scopes.join(",")}&client_id=${e.ZOHOCRM_CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${e.REDIRECT_URL_BASE}/zohocrm&state=${encodeURIComponent(r)}`), e.close();
        });
      else if (t.integrationId === "sfdc") {
        const u = {
          response_type: "code",
          client_id: e.SFDC_CLIENT_ID,
          redirect_uri: `${e.REDIRECT_URL_BASE}/sfdc`,
          state: r
        }, s = new URLSearchParams(u).toString();
        l.addEventListener("click", () => {
          window.open(`https://login.salesforce.com/services/oauth2/authorize?${s}${t.scopes.length ? `&scope=${t.scopes.join("%20")}` : ""}`), e.close();
        });
      }
    }
    return l;
  }, T = function(e) {
    let t = g("span", `connect-name-${e.integrationId}`, y({
      color: "grey",
      flex: 1,
      marginTop: 15,
      fontSize: 12
    }), [], e.name), i = g("img", `connect-img-${e.integrationId}`, y({
      objectFit: "none",
      alignSelf: "flex-start"
    }), []);
    return i.src = e.imageSrc, g("div", `connect-container-${e.integrationId}`, y({
      display: "flex",
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-start"
    }), [i, t]);
  }, B = function() {
    var e = window.location.href;
    window.open("https://revert.dev?utm_campaign=powered&utm_medium=signin&utm_source=" + e, "_blank"), window.focus();
  }, O = function(e) {
    var t = document.createElement("img");
    t.setAttribute("src", "https://res.cloudinary.com/dfcnic8wq/image/upload/v1673932396/Revert/Revert_logo_x5ysgh.png"), t.style.width = "30px";
    var i = g("span", "fd-powered-by-title", y({
      fontSize: "14px",
      fontStyle: "normal",
      fontWeight: "400",
      lineHeight: "13px",
      letterSpacing: "0em"
    }), [], "Powered By"), l = g("span", "fd-powered-by-logo-img", {}, [t], null), r = g("div", "fd-powered-by", y({
      display: "flex",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      height: 35,
      background: "#343232",
      color: "#fff"
    }), [i, l], "");
    return r.addEventListener("click", B.bind(e)), r;
  }, U = function(e, t, i) {
    const l = t.status !== "active";
    let r = document.createElement("div");
    r.style.flex = "1", r.style.width = "100%", r.style.padding = i, r.style.display = "flex", r.style.boxSizing = "border-box";
    let u = A(e, t), f = T(t), s = document.createElement("div");
    if (s.style.flex = "1", s.style.width = "100%", s.style.padding = "33px", s.style.border = "2px solid #f7f7f7", s.style.display = "flex", s.style.boxShadow = "0px 1px 1px 0px #00000063", s.style.position = "relative", s.appendChild(f), s.appendChild(u), l) {
      let d = document.createElement("span");
      d.innerHTML = "Coming Soon", d.style.fontSize = "6px", d.style.position = "absolute", d.style.fontSize = "9px", d.style.position = "absolute", d.style.right = "6px", d.style.top = "6px", d.style.padding = "2px 20px", d.style.borderRadius = "5px", d.style.background = "#d6d6d6", d.style.color = "#545151", s.appendChild(d);
    }
    return r.appendChild(s), r;
  };
  (function() {
    var t, i, l, r, u, f, s, d, L;
    class e {
      constructor() {
        b(this, "CORE_API_BASE_URL");
        v(this, t, void 0);
        v(this, i, void 0);
        v(this, l, void 0);
        v(this, r, void 0);
        v(this, u, void 0);
        v(this, f, void 0);
        v(this, s, void 0);
        v(this, d, void 0);
        v(this, L, void 0);
        b(this, "loadIntegrations", function(h) {
          var n = {
            mode: "cors",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-revert-public-token": this.API_REVERT_PUBLIC_TOKEN
            }
          };
          let I = this.CORE_API_BASE_URL + p(this, t);
          fetch(I, n).then((m) => m.json()).then((m) => {
            console.log("Revert crm integrations ", m), _(this, i, m.data), _(this, d, !0), h.onLoad();
          }).catch((m) => {
            console.log("error", m), _(this, d, !1), h.onError && h.onError();
          });
        });
        b(this, "init", function(h) {
          this.API_REVERT_PUBLIC_TOKEN = h.revertToken, this.tenantId = h.tenantId, _(this, L, h.onClose), R(`
        @font-face {
            font-family: 'DM Sans';
            font-style: normal;
            font-weight: 700;
        }
        @keyframes fadein {
            from {
                opacity:0;
            }
            to {
                opacity:1;
            }
        }
        @keyframes fadeout {
            from {
                opacity:1;
            }
            to {
                opacity:0;
            }
        }
      `);
          var n = document.getElementById("revert-ui-root");
          n || (n = document.createElement("div"), n.setAttribute("id", "revert-ui-root"), document.body.appendChild(n)), (async () => this.loadIntegrations(h))();
        });
        b(this, "open", function(h) {
          if (h) {
            const n = p(this, i).find((I) => I.integrationId === h);
            if (n) {
              const I = n.scopes, m = JSON.stringify({
                tenantId: this.tenantId,
                revertPublicToken: this.API_REVERT_PUBLIC_TOKEN
              });
              if (n.integrationId === "hubspot")
                window.open(`https://app.hubspot.com/oauth/authorize?client_id=${p(this, r)}&redirect_uri=${p(this, s)}/hubspot&scope=${I.join("%20")}&state=${m}`);
              else if (n.integrationId === "zohocrm")
                window.open(`https://accounts.zoho.com/oauth/v2/auth?scope=${I.join(",")}&client_id=${p(this, u)}&response_type=code&access_type=offline&redirect_uri=${p(this, s)}/zohocrm&state=${encodeURIComponent(m)}`);
              else if (n.integrationId === "sfdc") {
                const P = {
                  response_type: "code",
                  client_id: p(this, f),
                  redirect_uri: `${p(this, s)}/sfdc`,
                  state: m
                }, w = new URLSearchParams(P).toString();
                window.open(`https://login.salesforce.com/services/oauth2/authorize?${w}${I.length ? `&scope=${I.join("%20")}` : ""}`);
              }
            } else
              console.warn("Invalid integration ID provided.");
          } else {
            const n = document.createElement("div");
            n.setAttribute("id", "revert-signin-container"), n.style.position = "absolute", n.style.top = "15%", n.style.left = "40%", n.style.width = "370px", n.style.minHeight = "528px", n.style.display = "flex", n.style.flexDirection = "column", n.style.justifyContent = "center", n.style.alignItems = "center", n.style.background = "#fff", n.style.flexDirection = "column";
            let I = document.getElementById("revert-ui-root");
            if (!I) {
              console.error("Root element does not exist!");
              return;
            }
            let m = D();
            m.addEventListener("click", this.close.bind(this)), n.appendChild(m);
            let P = g("span", "revert-signin-header", y({
              fontWeight: "bold",
              width: "100%",
              padding: "33px 33px 0px 33px",
              boxSizing: "border-box"
            }), [], "Select CRM");
            n.appendChild(P);
            for (let S = 0; S < p(this, i).length; S++) {
              const k = p(this, i)[S];
              let z = U(this, k, S === p(this, i).length - 1 ? "33px" : "33px 33px 0px 33px");
              n.appendChild(z);
            }
            let $ = O(this);
            n.appendChild($);
            let w = g("div", "revert-signin-container-wrapper", y({
              position: "absolute",
              "z-index": 99999999,
              display: "flex",
              "justify-content": "center",
              "align-items": "flex-start",
              background: "rgba(54, 54, 54, 0.4)",
              width: "100%",
              height: "100%",
              left: 0,
              top: 0
            }), [n]);
            w.style.animation = "fadein .8s forwards", w.style.transition = "color 500ms ease-in-out", w.addEventListener("click", (S) => {
              n.contains(S.target) || (w.style.animation = "fadeoout .8s forwards", w.style.transition = "color 500ms ease-in-out", this.close());
            }), I.appendChild(w), this.state = "open";
          }
        });
        b(this, "close", function() {
          let h = document.getElementById("revert-ui-root");
          for (; h != null && h.firstChild; )
            h.firstChild.remove();
          this.state = "close", p(this, L).call(this);
        });
        this.CORE_API_BASE_URL = x.CORE_API_BASE_URL, _(this, t, "v1/metadata/crms"), _(this, i, []), _(this, l, "close"), _(this, r, x.HUBSPOT_CLIENT_ID), _(this, u, x.ZOHOCRM_CLIENT_ID), _(this, f, x.SFDC_CLIENT_ID), _(this, s, x.REDIRECT_URL_BASE), _(this, d, !1);
      }
      get SFDC_CLIENT_ID() {
        return p(this, f);
      }
      get ZOHOCRM_CLIENT_ID() {
        return p(this, u);
      }
      get HUBSPOT_CLIENT_ID() {
        return p(this, r);
      }
      get REDIRECT_URL_BASE() {
        return p(this, s);
      }
      get getIntegrationsLoaded() {
        return p(this, d);
      }
    }
    t = new WeakMap(), i = new WeakMap(), l = new WeakMap(), r = new WeakMap(), u = new WeakMap(), f = new WeakMap(), s = new WeakMap(), d = new WeakMap(), L = new WeakMap(), C = new e();
  })(), o.exports = C, window.Revert = C;
}, {}] }, {}, [1]);
