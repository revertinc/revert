var D = Object.defineProperty;
var j = (c, i, a) => i in c ? D(c, i, { enumerable: !0, configurable: !0, writable: !0, value: a }) : c[i] = a;
var C = (c, i, a) => (j(c, typeof i != "symbol" ? i + "" : i, a), a), U = (c, i, a) => {
  if (!i.has(c))
    throw TypeError("Cannot " + a);
};
var y = (c, i, a) => (U(c, i, "read from private field"), a ? a.call(c) : i.get(c)), w = (c, i, a) => {
  if (i.has(c))
    throw TypeError("Cannot add the same private member more than once");
  i instanceof WeakSet ? i.add(c) : i.set(c, a);
}, v = (c, i, a, _) => (U(c, i, "write to private field"), _ ? _.call(c, a) : i.set(c, a), a);
(function() {
  function c(i, a, _) {
    function I(g, f) {
      if (!a[g]) {
        if (!i[g]) {
          var A = typeof require == "function" && require;
          if (!f && A)
            return A(g, !0);
          if (h)
            return h(g, !0);
          var B = new Error("Cannot find module '" + g + "'");
          throw B.code = "MODULE_NOT_FOUND", B;
        }
        var S = a[g] = { exports: {} };
        i[g][0].call(S.exports, function(L) {
          var $ = i[g][1][L];
          return I($ || L);
        }, S, S.exports, c, i, a, _);
      }
      return a[g].exports;
    }
    for (var h = typeof require == "function" && require, R = 0; R < _.length; R++)
      I(_[R]);
    return I;
  }
  return c;
})()({ 1: [function(c, i, a) {
  var _, I = {
    CORE_API_BASE_URL: "http://localhost:4001/",
    REDIRECT_URL_BASE: "http://localhost:3000/oauth-callback"
  };
  const h = function(e) {
    for (let [t, r] of Object.entries(e)) {
      let l = g(t);
      t !== l && (Object.defineProperty(e, l, Object.getOwnPropertyDescriptor(e, t)), delete e[t]), typeof r == "number" && l !== "z-index" && (e[l] = r + "px");
    }
    return e;
  }, R = function(e) {
    const t = document.createElement("style");
    t.textContent = e, document.head.append(t);
  }, g = function(e) {
    return e.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
  }, f = function(e, t, r, l, s) {
    const d = document.createElement(e);
    d.setAttribute("id", t), Object.assign(d.style, r);
    for (let m = 0; m < l.length; m++) {
      const p = l[m];
      d.appendChild(p);
    }
    return s && (d.innerHTML = s), d;
  }, A = function() {
    let e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    e.setAttributeNS(null, "fill", "#969696"), e.setAttributeNS(null, "width", "24"), e.setAttributeNS(null, "height", "24");
    let t = document.createElementNS("http://www.w3.org/2000/svg", "path");
    t.setAttributeNS(null, "d", "M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"), e.appendChild(t);
    var r = f("span", "fd-welcome-close-btn", h({
      position: "absolute",
      top: 10,
      right: 10,
      cursor: "pointer"
    }), [e]);
    return r;
  }, B = function(e, t) {
    const r = t.status !== "active";
    let l = f("span", `connect-${t.integrationId}`, h({
      cursor: r ? "auto " : "pointer",
      padding: "8px 20px",
      color: "#fff",
      textAlign: "center",
      alignSelf: "center",
      background: r ? "#9394c4" : "#272DC0",
      borderRadius: 5,
      fontSize: 14
    }), [], "Connect");
    const s = JSON.stringify({
      tenantId: e.tenantId,
      revertPublicToken: e.API_REVERT_PUBLIC_TOKEN
    });
    if (!r) {
      if (t.integrationId === "hubspot")
        l.addEventListener("click", () => {
          window.open(`https://app.hubspot.com/oauth/authorize?client_id=${t.clientId}&redirect_uri=${e.REDIRECT_URL_BASE}/hubspot&scope=${t.scopes.join("%20")}&state=${s}`), e.close();
        });
      else if (t.integrationId === "zohocrm")
        l.addEventListener("click", () => {
          window.open(`https://accounts.zoho.com/oauth/v2/auth?scope=${t.scopes.join(",")}&client_id=${t.clientId}&response_type=code&access_type=offline&redirect_uri=${e.REDIRECT_URL_BASE}/zohocrm&state=${encodeURIComponent(s)}`), e.close();
        });
      else if (t.integrationId === "sfdc") {
        const d = {
          response_type: "code",
          client_id: t.clientId,
          redirect_uri: `${e.REDIRECT_URL_BASE}/sfdc`,
          state: s
        }, p = new URLSearchParams(d).toString();
        l.addEventListener("click", () => {
          window.open(`https://login.salesforce.com/services/oauth2/authorize?${p}${t.scopes.length ? `&scope=${t.scopes.join("%20")}` : ""}`), e.close();
        });
      }
    }
    return l;
  }, S = function(e) {
    let t = f("span", `connect-name-${e.integrationId}`, h({
      color: "grey",
      flex: 1,
      marginTop: 15,
      fontSize: 12
    }), [], e.name), r = f("img", `connect-img-${e.integrationId}`, h({
      objectFit: "none",
      alignSelf: "flex-start"
    }), []);
    return r.src = e.imageSrc, f("div", `connect-container-${e.integrationId}`, h({
      display: "flex",
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-start"
    }), [r, t]);
  }, L = function() {
    var e = window.location.href;
    window.open("https://revert.dev?utm_campaign=powered&utm_medium=signin&utm_source=" + e, "_blank"), window.focus();
  }, $ = function(e) {
    var t = document.createElement("img");
    t.setAttribute("src", "https://res.cloudinary.com/dfcnic8wq/image/upload/v1673932396/Revert/Revert_logo_x5ysgh.png"), t.style.width = "30px";
    var r = f("span", "fd-powered-by-title", h({
      fontSize: "14px",
      fontStyle: "normal",
      fontWeight: "400",
      lineHeight: "13px",
      letterSpacing: "0em"
    }), [], "Powered By"), l = f("span", "fd-powered-by-logo-img", {}, [t], null), s = f("div", "fd-powered-by", h({
      display: "flex",
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      height: 35,
      background: "#343232",
      color: "#fff"
    }), [r, l], "");
    return s.addEventListener("click", L.bind(e)), s;
  }, k = function(e, t, r) {
    const l = t.status !== "active";
    let s = document.createElement("div");
    s.style.flex = "1", s.style.width = "100%", s.style.padding = r, s.style.display = "flex", s.style.boxSizing = "border-box";
    let d = B(e, t), m = S(t), p = document.createElement("div");
    if (p.style.flex = "1", p.style.width = "100%", p.style.padding = "33px", p.style.border = "2px solid #f7f7f7", p.style.display = "flex", p.style.boxShadow = "0px 1px 1px 0px #00000063", p.style.position = "relative", p.appendChild(m), p.appendChild(d), l) {
      let o = document.createElement("span");
      o.innerHTML = "Coming Soon", o.style.fontSize = "6px", o.style.position = "absolute", o.style.fontSize = "9px", o.style.position = "absolute", o.style.right = "6px", o.style.top = "6px", o.style.padding = "2px 20px", o.style.borderRadius = "5px", o.style.background = "#d6d6d6", o.style.color = "#545151", p.appendChild(o);
    }
    return s.appendChild(p), s;
  };
  (function() {
    var t, r, l, s, d, m;
    class e {
      constructor() {
        C(this, "CORE_API_BASE_URL");
        w(this, t, void 0);
        w(this, r, void 0);
        w(this, l, void 0);
        w(this, s, void 0);
        w(this, d, void 0);
        w(this, m, void 0);
        C(this, "loadIntegrations", function(o) {
          var n = {
            mode: "cors",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-revert-public-token": this.API_REVERT_PUBLIC_TOKEN
            }
          };
          let E = this.CORE_API_BASE_URL + y(this, t);
          fetch(E, n).then((u) => u.json()).then((u) => {
            console.log("Revert crm integrations ", u), v(this, r, u.data), v(this, d, !0), o.onLoad();
          }).catch((u) => {
            console.log("error", u), v(this, d, !1), o.onError && o.onError();
          });
        });
        C(this, "init", function(o) {
          this.API_REVERT_PUBLIC_TOKEN = o.revertToken, this.tenantId = o.tenantId, v(this, m, o.onClose), R(`
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
          n || (n = document.createElement("div"), n.setAttribute("id", "revert-ui-root"), document.body.appendChild(n)), (async () => this.loadIntegrations(o))();
        });
        C(this, "open", function(o) {
          if (o) {
            const n = y(this, r).find((E) => E.integrationId === o);
            if (n) {
              const E = n.scopes, u = JSON.stringify({
                tenantId: this.tenantId,
                revertPublicToken: this.API_REVERT_PUBLIC_TOKEN
              });
              if (n.integrationId === "hubspot")
                window.open(`https://app.hubspot.com/oauth/authorize?client_id=${n.clientId}&redirect_uri=${y(this, s)}/hubspot&scope=${E.join("%20")}&state=${u}`);
              else if (n.integrationId === "zohocrm")
                window.open(`https://accounts.zoho.com/oauth/v2/auth?scope=${E.join(",")}&client_id=${n.clientId}&response_type=code&access_type=offline&redirect_uri=${y(this, s)}/zohocrm&state=${encodeURIComponent(u)}`);
              else if (n.integrationId === "sfdc") {
                const P = {
                  response_type: "code",
                  client_id: n.clientId,
                  redirect_uri: `${y(this, s)}/sfdc`,
                  state: u
                }, x = new URLSearchParams(P).toString();
                window.open(`https://login.salesforce.com/services/oauth2/authorize?${x}${E.length ? `&scope=${E.join("%20")}` : ""}`);
              }
            } else
              console.warn("Invalid integration ID provided.");
          } else {
            const n = document.createElement("div");
            n.setAttribute("id", "revert-signin-container"), n.style.position = "absolute", n.style.top = "15%", n.style.left = "40%", n.style.width = "370px", n.style.minHeight = "528px", n.style.display = "flex", n.style.flexDirection = "column", n.style.justifyContent = "center", n.style.alignItems = "center", n.style.background = "#fff", n.style.flexDirection = "column";
            let E = document.getElementById("revert-ui-root");
            if (!E) {
              console.error("Root element does not exist!");
              return;
            }
            let u = A();
            u.addEventListener("click", this.close.bind(this)), n.appendChild(u);
            let P = f("span", "revert-signin-header", h({
              fontWeight: "bold",
              width: "100%",
              padding: "33px 33px 0px 33px",
              boxSizing: "border-box"
            }), [], "Select CRM");
            n.appendChild(P);
            for (let b = 0; b < y(this, r).length; b++) {
              const z = y(this, r)[b];
              let O = k(this, z, b === y(this, r).length - 1 ? "33px" : "33px 33px 0px 33px");
              n.appendChild(O);
            }
            let T = $(this);
            n.appendChild(T);
            let x = f("div", "revert-signin-container-wrapper", h({
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
            x.style.animation = "fadein .8s forwards", x.style.transition = "color 500ms ease-in-out", x.addEventListener("click", (b) => {
              n.contains(b.target) || (x.style.animation = "fadeoout .8s forwards", x.style.transition = "color 500ms ease-in-out", this.close());
            }), E.appendChild(x), this.state = "open";
          }
        });
        C(this, "close", function() {
          let o = document.getElementById("revert-ui-root");
          for (; o != null && o.firstChild; )
            o.firstChild.remove();
          this.state = "close", y(this, m).call(this);
        });
        this.CORE_API_BASE_URL = I.CORE_API_BASE_URL, v(this, t, "v1/metadata/crms"), v(this, r, []), v(this, l, "close"), v(this, s, I.REDIRECT_URL_BASE), v(this, d, !1);
      }
      get REDIRECT_URL_BASE() {
        return y(this, s);
      }
      get getIntegrationsLoaded() {
        return y(this, d);
      }
    }
    t = new WeakMap(), r = new WeakMap(), l = new WeakMap(), s = new WeakMap(), d = new WeakMap(), m = new WeakMap(), _ = new e();
  })(), i.exports = _, window.Revert = _;
}, {}] }, {}, [1]);
