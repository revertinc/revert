var $ = Object.defineProperty;
var z = (s, n, c) => (n in s ? $(s, n, { enumerable: !0, configurable: !0, writable: !0, value: c }) : (s[n] = c));
var S = (s, n, c) => (z(s, typeof n != 'symbol' ? n + '' : n, c), c),
    N = (s, n, c) => {
        if (!n.has(s)) throw TypeError('Cannot ' + c);
    };
var m = (s, n, c) => (N(s, n, 'read from private field'), c ? c.call(s) : n.get(s)),
    E = (s, n, c) => {
        if (n.has(s)) throw TypeError('Cannot add the same private member more than once');
        n instanceof WeakSet ? n.add(s) : n.set(s, c);
    },
    b = (s, n, c, w) => (N(s, n, 'write to private field'), w ? w.call(s, c) : n.set(s, c), c);
(function () {
    function s(n, c, w) {
        function I(y, _) {
            if (!c[y]) {
                if (!n[y]) {
                    var L = typeof require == 'function' && require;
                    if (!_ && L) return L(y, !0);
                    if (f) return f(y, !0);
                    var T = new Error("Cannot find module '" + y + "'");
                    throw ((T.code = 'MODULE_NOT_FOUND'), T);
                }
                var R = (c[y] = { exports: {} });
                n[y][0].call(
                    R.exports,
                    function (A) {
                        var j = n[y][1][A];
                        return I(j || A);
                    },
                    R,
                    R.exports,
                    s,
                    n,
                    c,
                    w
                );
            }
            return c[y].exports;
        }
        for (var f = typeof require == 'function' && require, x = 0; x < w.length; x++) I(w[x]);
        return I;
    }
    return s;
})()(
    {
        1: [
            function (s, n, c) {
                var w,
                    I = {
                        CORE_API_BASE_URL: 'http://localhost:4001/',
                        HUBSPOT_CLIENT_ID: '7e5a712e-79a8-4cdb-87c2-5c0435e6ee5c',
                        REDIRECT_URL_BASE: 'https://88f7-202-168-86-71.ngrok-free.app/oauth-callback',
                        ZOHOCRM_CLIENT_ID: '1000.J6XYQN1AOUWTQPRIZVJZ9AKNQXRL1D',
                        SFDC_CLIENT_ID:
                            '3MVG9wt4IL4O5wvLTKcZbquKwooK7O7sHQxv0Lb3_OW790aL5Rh_NL1CJ8uWxw8XXRGGsZd7iOAfqIAgLdphS',
                    };
                const f = function (e) {
                        for (let [t, i] of Object.entries(e)) {
                            let r = y(t);
                            t !== r &&
                                (Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(e, t)), delete e[t]),
                                typeof i == 'number' && r !== 'z-index' && (e[r] = i + 'px');
                        }
                        return e;
                    },
                    x = function (e) {
                        const t = document.createElement('style');
                        (t.textContent = e), document.head.append(t);
                    },
                    y = function (e) {
                        return e.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                    },
                    _ = function (e, t, i, r, a) {
                        const p = document.createElement(e);
                        p.setAttribute('id', t), Object.assign(p.style, i);
                        for (let h = 0; h < r.length; h++) {
                            const l = r[h];
                            p.appendChild(l);
                        }
                        return a && (p.innerHTML = a), p;
                    },
                    L = function () {
                        let e = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        e.setAttributeNS(null, 'fill', '#969696'),
                            e.setAttributeNS(null, 'width', '24'),
                            e.setAttributeNS(null, 'height', '24');
                        let t = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        t.setAttributeNS(
                            null,
                            'd',
                            'M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'
                        ),
                            e.appendChild(t);
                        var i = _(
                            'span',
                            'fd-welcome-close-btn',
                            f({
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                cursor: 'pointer',
                            }),
                            [e]
                        );
                        return i;
                    },
                    T = function (e, t) {
                        const i = t.status !== 'active';
                        let r = _(
                            'span',
                            `connect-${t.integrationId}`,
                            f({
                                cursor: i ? 'auto ' : 'pointer',
                                padding: '8px 20px',
                                color: '#fff',
                                textAlign: 'center',
                                alignSelf: 'center',
                                background: i ? '#9394c4' : '#272DC0',
                                borderRadius: 5,
                                fontSize: 14,
                            }),
                            [],
                            'Connect'
                        );
                        const a = JSON.stringify({
                            tenantId: e.tenantId,
                            revertPublicToken: e.API_REVERT_PUBLIC_TOKEN,
                        });
                        if (!i) {
                            if (t.integrationId === 'hubspot')
                                r.addEventListener('click', () => {
                                    window.open(
                                        `https://app.hubspot.com/oauth/authorize?client_id=${e.HUBSPOT_CLIENT_ID}&redirect_uri=${e.REDIRECT_URL_BASE}/hubspot&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.marketing_events.read%20crm.objects.marketing_events.write%20crm.schemas.custom.read%20crm.objects.custom.read%20crm.objects.custom.write%20crm.objects.companies.write%20crm.schemas.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.deals.write%20crm.schemas.companies.read%20crm.schemas.companies.write%20crm.schemas.contacts.write%20crm.schemas.deals.read%20crm.schemas.deals.write%20crm.objects.owners.read%20crm.objects.quotes.write%20crm.objects.quotes.read%20crm.schemas.quotes.read%20crm.objects.line_items.read%20crm.objects.line_items.write%20crm.schemas.line_items.read&state=${a}`
                                    ),
                                        e.close();
                                });
                            else if (t.integrationId === 'zohocrm')
                                r.addEventListener('click', () => {
                                    window.open(
                                        `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ,AaaServer.profile.READ&client_id=${
                                            e.ZOHOCRM_CLIENT_ID
                                        }&response_type=code&access_type=offline&redirect_uri=${
                                            e.REDIRECT_URL_BASE
                                        }/zohocrm&state=${encodeURIComponent(a)}`
                                    ),
                                        e.close();
                                });
                            else if (t.integrationId === 'sfdc') {
                                const p = {
                                        response_type: 'code',
                                        client_id: e.SFDC_CLIENT_ID,
                                        redirect_uri: `${e.REDIRECT_URL_BASE}/sfdc`,
                                        state: a,
                                    },
                                    l = new URLSearchParams(p).toString();
                                r.addEventListener('click', () => {
                                    window.open(`https://login.salesforce.com/services/oauth2/authorize?${l}`),
                                        e.close();
                                });
                            }
                        }
                        return r;
                    },
                    R = function (e) {
                        let t = _(
                                'span',
                                `connect-name-${e.integrationId}`,
                                f({
                                    color: 'grey',
                                    flex: 1,
                                    marginTop: 15,
                                    fontSize: 12,
                                }),
                                [],
                                e.name
                            ),
                            i = _(
                                'img',
                                `connect-img-${e.integrationId}`,
                                f({
                                    objectFit: 'none',
                                    alignSelf: 'flex-start',
                                }),
                                []
                            );
                        return (
                            (i.src = e.imageSrc),
                            _(
                                'div',
                                `connect-container-${e.integrationId}`,
                                f({
                                    display: 'flex',
                                    flex: 1,
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start',
                                }),
                                [i, t]
                            )
                        );
                    },
                    A = function () {
                        var e = window.location.href;
                        window.open(
                            'https://revert.dev?utm_campaign=powered&utm_medium=signin&utm_source=' + e,
                            '_blank'
                        ),
                            window.focus();
                    },
                    j = function (e) {
                        var t = document.createElement('img');
                        t.setAttribute(
                            'src',
                            'https://res.cloudinary.com/dfcnic8wq/image/upload/v1673932396/Revert/Revert_logo_x5ysgh.png'
                        ),
                            (t.style.width = '30px');
                        var i = _(
                                'span',
                                'fd-powered-by-title',
                                f({
                                    fontSize: '14px',
                                    fontStyle: 'normal',
                                    fontWeight: '400',
                                    lineHeight: '13px',
                                    letterSpacing: '0em',
                                }),
                                [],
                                'Powered By'
                            ),
                            r = _('span', 'fd-powered-by-logo-img', {}, [t], null),
                            a = _(
                                'div',
                                'fd-powered-by',
                                f({
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    height: 35,
                                    background: '#343232',
                                    color: '#fff',
                                }),
                                [i, r],
                                ''
                            );
                        return a.addEventListener('click', A.bind(e)), a;
                    },
                    P = function (e, t, i) {
                        const r = t.status !== 'active';
                        let a = document.createElement('div');
                        (a.style.flex = '1'),
                            (a.style.width = '100%'),
                            (a.style.padding = i),
                            (a.style.display = 'flex'),
                            (a.style.boxSizing = 'border-box');
                        let p = T(e, t),
                            h = R(t),
                            l = document.createElement('div');
                        if (
                            ((l.style.flex = '1'),
                            (l.style.width = '100%'),
                            (l.style.padding = '33px'),
                            (l.style.border = '2px solid #f7f7f7'),
                            (l.style.display = 'flex'),
                            (l.style.boxShadow = '0px 1px 1px 0px #00000063'),
                            (l.style.position = 'relative'),
                            l.appendChild(h),
                            l.appendChild(p),
                            r)
                        ) {
                            let d = document.createElement('span');
                            (d.innerHTML = 'Coming Soon'),
                                (d.style.fontSize = '6px'),
                                (d.style.position = 'absolute'),
                                (d.style.fontSize = '9px'),
                                (d.style.position = 'absolute'),
                                (d.style.right = '6px'),
                                (d.style.top = '6px'),
                                (d.style.padding = '2px 20px'),
                                (d.style.borderRadius = '5px'),
                                (d.style.background = '#d6d6d6'),
                                (d.style.color = '#545151'),
                                l.appendChild(d);
                        }
                        return a.appendChild(l), a;
                    };
                (function () {
                    var t, i, r, a, p, h, l, d;
                    class e {
                        constructor() {
                            E(this, t, void 0);
                            E(this, i, void 0);
                            E(this, r, void 0);
                            E(this, a, void 0);
                            E(this, p, void 0);
                            E(this, h, void 0);
                            E(this, l, void 0);
                            E(this, d, void 0);
                            S(this, 'loadIntegrations', function () {
                                var g = {
                                    mode: 'cors',
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'x-revert-public-token': this.API_REVERT_PUBLIC_TOKEN,
                                    },
                                };
                                let o = m(this, t) + m(this, i);
                                fetch(o, g)
                                    .then((u) => u.json())
                                    .then((u) => {
                                        console.log('Revert crm integrations ', u), b(this, r, u.data);
                                    })
                                    .catch((u) => {
                                        console.log('error', u);
                                    });
                            });
                            S(this, 'init', function (g) {
                                (this.API_REVERT_PUBLIC_TOKEN = g.revertToken),
                                    (this.tenantId = g.tenantId),
                                    x(`
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
                                var o = document.getElementById('revert-ui-root');
                                o ||
                                    ((o = document.createElement('div')),
                                    o.setAttribute('id', 'revert-ui-root'),
                                    document.body.appendChild(o)),
                                    (async () => this.loadIntegrations())();
                            });
                            S(this, 'open', function (g) {
                                if (g) {
                                    const o = m(this, r).find((u) => u.integrationId === g);
                                    if (o) {
                                        const u = JSON.stringify({
                                            tenantId: this.tenantId,
                                            revertPublicToken: this.API_REVERT_PUBLIC_TOKEN,
                                        });
                                        if (o.integrationId === 'hubspot')
                                            window.open(
                                                `https://app.hubspot.com/oauth/authorize?client_id=${m(
                                                    this,
                                                    p
                                                )}&redirect_uri=${m(
                                                    this,
                                                    d
                                                )}/hubspot&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.marketing_events.read%20crm.objects.marketing_events.write%20crm.schemas.custom.read%20crm.objects.custom.read%20crm.objects.custom.write%20crm.objects.companies.write%20crm.schemas.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.deals.write%20crm.schemas.companies.read%20crm.schemas.companies.write%20crm.schemas.contacts.write%20crm.schemas.deals.read%20crm.schemas.deals.write%20crm.objects.owners.read%20crm.objects.quotes.write%20crm.objects.quotes.read%20crm.schemas.quotes.read%20crm.objects.line_items.read%20crm.objects.line_items.write%20crm.schemas.line_items.read&state=${u}`
                                            );
                                        else if (o.integrationId === 'zohocrm')
                                            window.open(
                                                `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ,AaaServer.profile.READ&client_id=${m(
                                                    this,
                                                    h
                                                )}&response_type=code&access_type=offline&redirect_uri=${m(
                                                    this,
                                                    d
                                                )}/zohocrm&state=${encodeURIComponent(u)}`
                                            );
                                        else if (o.integrationId === 'sfdc') {
                                            const D = {
                                                    response_type: 'code',
                                                    client_id: m(this, l),
                                                    redirect_uri: `${m(this, d)}/sfdc`,
                                                    state: u,
                                                },
                                                B = new URLSearchParams(D).toString();
                                            window.open(`https://login.salesforce.com/services/oauth2/authorize?${B}`);
                                        }
                                    } else console.warn('Invalid integration ID provided.');
                                } else {
                                    const o = document.createElement('div');
                                    o.setAttribute('id', 'revert-signin-container'),
                                        (o.style.position = 'absolute'),
                                        (o.style.top = '15%'),
                                        (o.style.left = '40%'),
                                        (o.style.width = '370px'),
                                        (o.style.minHeight = '528px'),
                                        (o.style.display = 'flex'),
                                        (o.style.flexDirection = 'column'),
                                        (o.style.justifyContent = 'center'),
                                        (o.style.alignItems = 'center'),
                                        (o.style.background = '#fff'),
                                        (o.style.flexDirection = 'column');
                                    let u = document.getElementById('revert-ui-root');
                                    if (!u) {
                                        console.error('Root element does not exist!');
                                        return;
                                    }
                                    let D = L();
                                    D.addEventListener('click', this.close.bind(this)), o.appendChild(D);
                                    let O = _(
                                        'span',
                                        'revert-signin-header',
                                        f({
                                            fontWeight: 'bold',
                                            width: '100%',
                                            padding: '33px 33px 0px 33px',
                                            boxSizing: 'border-box',
                                        }),
                                        [],
                                        'Select CRM'
                                    );
                                    o.appendChild(O);
                                    for (let v = 0; v < m(this, r).length; v++) {
                                        const U = m(this, r)[v];
                                        let k = P(this, U, v === m(this, r).length - 1 ? '33px' : '33px 33px 0px 33px');
                                        o.appendChild(k);
                                    }
                                    let B = j(this);
                                    o.appendChild(B);
                                    let C = _(
                                        'div',
                                        'revert-signin-container-wrapper',
                                        f({
                                            position: 'absolute',
                                            'z-index': 99999999,
                                            display: 'flex',
                                            'justify-content': 'center',
                                            'align-items': 'flex-start',
                                            background: 'rgba(54, 54, 54, 0.4)',
                                            width: '100%',
                                            height: '100%',
                                            left: 0,
                                            top: 0,
                                        }),
                                        [o]
                                    );
                                    (C.style.animation = 'fadein .8s forwards'),
                                        (C.style.transition = 'color 500ms ease-in-out'),
                                        C.addEventListener('click', (v) => {
                                            o.contains(v.target) ||
                                                ((C.style.animation = 'fadeoout .8s forwards'),
                                                (C.style.transition = 'color 500ms ease-in-out'),
                                                this.close());
                                        }),
                                        u.appendChild(C),
                                        (this.state = 'open');
                                }
                            });
                            S(this, 'close', function () {
                                let g = document.getElementById('revert-ui-root');
                                for (; g != null && g.firstChild; ) g.firstChild.remove();
                                this.state = 'close';
                            });
                            b(this, t, I.CORE_API_BASE_URL),
                                b(this, i, 'v1/metadata/crms'),
                                b(this, r, []),
                                b(this, a, 'close'),
                                b(this, p, I.HUBSPOT_CLIENT_ID),
                                b(this, h, I.ZOHOCRM_CLIENT_ID),
                                b(this, l, I.SFDC_CLIENT_ID),
                                b(this, d, I.REDIRECT_URL_BASE);
                        }
                        get SFDC_CLIENT_ID() {
                            return m(this, l);
                        }
                        get ZOHOCRM_CLIENT_ID() {
                            return m(this, h);
                        }
                        get HUBSPOT_CLIENT_ID() {
                            return m(this, p);
                        }
                        get REDIRECT_URL_BASE() {
                            return m(this, d);
                        }
                    }
                    (t = new WeakMap()),
                        (i = new WeakMap()),
                        (r = new WeakMap()),
                        (a = new WeakMap()),
                        (p = new WeakMap()),
                        (h = new WeakMap()),
                        (l = new WeakMap()),
                        (d = new WeakMap()),
                        (w = new e());
                })(),
                    (n.exports = w),
                    (window.Revert = w);
            },
            {},
        ],
    },
    {},
    [1]
);
