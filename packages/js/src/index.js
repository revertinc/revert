var revert;
//TODO:further improve this when prod and staging environments are ready. And control the env form script in package.json
var env = process.env.NODE_ENV || 'dev';
var envConfig = {
    CORE_API_BASE_URL: env === 'dev' ? 'http://localhost:4001/' : 'https://api.revert.dev/',
    HUBSPOT_CLIENT_ID: env === 'dev' ? '7e5a712e-79a8-4cdb-87c2-5c0435e6ee5c' : '98c4040c-fc8c-4e36-872f-1afe30a7ed35',
    REDIRECT_URL_BASE: env === 'dev' ? 'http://localhost:3000/oauth-callback' : 'https://app.revert.dev/oauth-callback',
    ZOHOCRM_CLIENT_ID: env === 'dev' ? '1000.7IWVVHZBEWSWC31L12OEVJH4L3DOHJ' : '1000.J6XYQN1AOUWTQPRIZVJZ9AKNQXRL1D',
    SFDC_CLIENT_ID:
        env === 'dev'
            ? '3MVG9n_HvETGhr3DqXEaT8BJkxX0ubyKWtbaQb.AnYrpdb8cxsXN2JOwD71T8gPyd8gE.jFgar02Y29Leu7dC'
            : '3MVG9n_HvETGhr3DqXEaT8BJkxX0ubyKWtbaQb.AnYrpdb8cxsXN2JOwD71T8gPyd8gE.jFgar02Y29Leu7dC',
};

const transformStyle = function (style) {
    for (let [key, value] of Object.entries(style)) {
        let new_key = toKebabCase(key);
        if (key !== new_key) {
            Object.defineProperty(style, new_key, Object.getOwnPropertyDescriptor(style, key));
            delete style[key];
        }
        if (typeof value === 'number' && new_key !== 'z-index') {
            style[new_key] = value + 'px';
        }
    }
    return style;
};

const addStyle = function (styleString) {
    const style = document.createElement('style');
    style.textContent = styleString;
    document.head.append(style);
};

const toKebabCase = function (string) {
    return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};
const createViewElement = function (tag, id, style, children, innerHTML) {
    const element = document.createElement(tag);
    element.setAttribute('id', id);
    Object.assign(element.style, style);
    for (let index = 0; index < children.length; index++) {
        const e = children[index];
        element.appendChild(e);
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
};

const createCloseButton = function () {
    let svgCloseElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgCloseElement.setAttributeNS(null, 'fill', '#969696');
    svgCloseElement.setAttributeNS(null, 'width', '24');
    svgCloseElement.setAttributeNS(null, 'height', '24');

    let svgCloseElementPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgCloseElementPath.setAttributeNS(
        null,
        'd',
        'M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'
    );
    svgCloseElement.appendChild(svgCloseElementPath);

    var closeButton = createViewElement(
        'span',
        'fd-welcome-close-btn',
        transformStyle({
            position: 'absolute',
            top: 10,
            right: 10,
            cursor: 'pointer',
        }),
        [svgCloseElement]
    );
    return closeButton;
};

const createConnectButton = function (self, integration) {
    const isInActive = integration.status !== 'active';
    let button = createViewElement(
        'span',
        `connect-${integration.integrationId}`,
        transformStyle({
            cursor: isInActive ? 'auto ' : 'pointer',
            padding: '8px 20px',
            color: '#fff',
            textAlign: 'center',
            alignSelf: 'center',
            background: isInActive ? '#9394c4' : '#272DC0',
            borderRadius: 5,
            fontSize: 14,
        }),
        [],
        'Connect'
    );
    const state = JSON.stringify({
        tenantId: self.tenantId,
        revertPublicToken: self.API_REVERT_PUBLIC_TOKEN,
    });
    if (!isInActive) {
        if (integration.integrationId === 'hubspot') {
            button.addEventListener('click', () => {
                window.open(
                    `https://app.hubspot.com/oauth/authorize?client_id=${self.HUBSPOT_CLIENT_ID}&redirect_uri=${self.REDIRECT_URL_BASE}/hubspot&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.marketing_events.read%20crm.objects.marketing_events.write%20crm.schemas.custom.read%20crm.objects.custom.read%20crm.objects.custom.write%20crm.objects.companies.write%20crm.schemas.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.deals.write%20crm.schemas.companies.read%20crm.schemas.companies.write%20crm.schemas.contacts.write%20crm.schemas.deals.read%20crm.schemas.deals.write%20crm.objects.owners.read%20crm.objects.quotes.write%20crm.objects.quotes.read%20crm.schemas.quotes.read%20crm.objects.line_items.read%20crm.objects.line_items.write%20crm.schemas.line_items.read&state=${state}`
                );
                self.close();
            });
        } else if (integration.integrationId === 'zohocrm') {
            button.addEventListener('click', () => {
                window.open(
                    `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ,AaaServer.profile.READ&client_id=${
                        self.ZOHOCRM_CLIENT_ID
                    }&response_type=code&access_type=offline&redirect_uri=${
                        self.REDIRECT_URL_BASE
                    }/zohocrm&state=${encodeURIComponent(state)}`
                );
                self.close();
            });
        } else if (integration.integrationId === 'sfdc') {
            button.addEventListener('click', () => {
                window.open(
                    `https://revert2-dev-ed.develop.my.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${self.SFDC_CLIENT_ID}&redirect_uri=${self.REDIRECT_URL_BASE}/sfdc&scope=offline_access+api+refresh_token&state=${state}`
                );
                self.close();
            });
        }
    }
    return button;
};

const createIntegraionDisplay = function (integration) {
    let name = createViewElement(
        'span',
        `connect-name-${integration.integrationId}`,
        transformStyle({
            color: 'grey',
            flex: 1,
            marginTop: 15,
            fontSize: 12,
        }),
        [],
        integration.name
    );
    let img = createViewElement(
        'img',
        `connect-img-${integration.integrationId}`,
        transformStyle({
            objectFit: 'none',
            alignSelf: 'flex-start',
        }),
        []
    );
    img.src = integration.imageSrc;

    let container = createViewElement(
        'div',
        `connect-container-${integration.integrationId}`,
        transformStyle({
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-start',
        }),
        [img, name]
    );
    return container;
};

const openInNewTab = function () {
    var currentUrl = window.location.href;
    var win = window.open(
        'https://revert.dev?utm_campaign=powered&utm_medium=signin&utm_source=' + currentUrl,
        '_blank'
    );
    win.focus();
};

const createPoweredByBanner = function (self) {
    var poweredByLogo = document.createElement('img');
    poweredByLogo.setAttribute(
        'src',
        'https://res.cloudinary.com/dfcnic8wq/image/upload/v1673932396/Revert/Revert_logo_x5ysgh.png'
    );
    poweredByLogo.style.width = '30px';

    var poweredBySpan1 = createViewElement(
        'span',
        'fd-powered-by-title',
        transformStyle({
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '13px',
            letterSpacing: '0em',
        }),
        [],
        'Powered By'
    );
    var poweredBySpan3 = createViewElement('span', 'fd-powered-by-logo-img', {}, [poweredByLogo], null);

    var poweredBy = createViewElement(
        'div',
        'fd-powered-by',
        transformStyle({
            display: 'flex',
            width: '100%',
            color: 'rgba(40, 30, 65,0.62)',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            height: 35,
            background: '#343232',
            color: '#fff',
        }),
        [poweredBySpan1, poweredBySpan3],
        ''
    );

    poweredBy.addEventListener('click', openInNewTab.bind(self));
    return poweredBy;
};

const createIntegrationBlock = function (self, integration, padding) {
    const isInActive = integration.status !== 'active';
    let integrationConnect = document.createElement('div');
    integrationConnect.style.flex = 1;
    integrationConnect.style.width = '100%';
    integrationConnect.style.padding = padding;
    integrationConnect.style.display = 'flex';
    integrationConnect.style.boxSizing = 'border-box';
    let connectButton = createConnectButton(self, integration);
    let integrationDisplay = createIntegraionDisplay(integration);
    let container = document.createElement('div');
    container.style.flex = 1;
    container.style.width = '100%';
    container.style.padding = '33px';
    container.style.border = '2px solid #f7f7f7';
    container.style.display = 'flex';
    container.style.boxShadow = '0px 1px 1px 0px #00000063';
    container.style.position = 'relative';
    container.appendChild(integrationDisplay);
    container.appendChild(connectButton);
    if (isInActive) {
        let comingSoon = document.createElement('span');
        comingSoon.innerHTML = 'Coming Soon';
        comingSoon.style.fontSize = '6px';
        comingSoon.style.position = 'absolute';
        comingSoon.style.fontSize = '9px';
        comingSoon.style.position = 'absolute';
        comingSoon.style.right = '6px';
        comingSoon.style.top = '6px';
        comingSoon.style.padding = '2px 20px';
        comingSoon.style.borderRadius = '5px';
        comingSoon.style.background = '#d6d6d6';
        comingSoon.style.color = '#545151';
        container.appendChild(comingSoon);
    }
    integrationConnect.appendChild(container);
    return integrationConnect;
};

(function () {
    class Revert {
        constructor() {
            this.CORE_API_BASE_URL = envConfig.CORE_API_BASE_URL;
            this.API_CRM_PREFIX = 'v1/crm/';
            this.API_CRM_METADATA_SUFFIX = 'v1/metadata/crms';
            this.integrations = [];
            this.state = 'close';
            this.HUBSPOT_CLIENT_ID = envConfig.HUBSPOT_CLIENT_ID;
            this.ZOHOCRM_CLIENT_ID = envConfig.ZOHOCRM_CLIENT_ID;
            this.SFDC_CLIENT_ID = envConfig.SFDC_CLIENT_ID;
            this.REDIRECT_URL_BASE = envConfig.REDIRECT_URL_BASE;
        }

        loadIntegrations = function () {
            var requestOptions = {
                mode: 'cors',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-revert-public-token': this.API_REVERT_PUBLIC_TOKEN,
                },
            };

            let fetchURL = this.CORE_API_BASE_URL + this.API_CRM_METADATA_SUFFIX;

            fetch(fetchURL, requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    console.log('Revert crm integrations ', result);
                    this.integrations = result.data;
                })
                .catch((error) => {
                    console.log('error', error);
                });
        };

        init = function (config) {
            this.API_REVERT_PUBLIC_TOKEN = config.revertToken;
            this.tenantId = config.tenantId;
            addStyle(`
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
            var rootElement = document.getElementById('revert-ui-root');
            if (!rootElement) {
                rootElement = document.createElement('div');
                rootElement.setAttribute('id', 'revert-ui-root');
                document.body.appendChild(rootElement);
            }

            (async () => {
                this.loadIntegrations();
            })();
        };

        open = function (integrationId) {
            if (!integrationId) {
                // show every integration possible
                const signInElement = document.createElement('div');
                signInElement.setAttribute('id', 'revert-signin-container');
                signInElement.style.position = 'absolute';
                signInElement.style.top = '15%';
                signInElement.style.left = '40%';
                signInElement.style.width = '370px';
                signInElement.style.minHeight = '528px';
                signInElement.style.display = 'flex';
                signInElement.style.flexSirection = 'column';
                signInElement.style.justifyContent = 'center';
                signInElement.style.alignItems = 'center';
                signInElement.style.background = '#fff';
                signInElement.style.flexDirection = 'column';
                let rootElement = document.getElementById('revert-ui-root');
                let closeButton = createCloseButton();
                closeButton.addEventListener('click', this.close.bind(this));
                signInElement.appendChild(closeButton);
                let headerText = createViewElement(
                    'span',
                    'revert-signin-header',
                    transformStyle({
                        fontWeight: 'bold',
                        width: '100%',
                        padding: '33px 33px 0px 33px',
                        boxSizing: 'border-box',
                    }),
                    [],
                    'Select CRM'
                );
                signInElement.appendChild(headerText);
                for (let index = 0; index < this.integrations.length; index++) {
                    const integration = this.integrations[index];
                    let integrationConnectBlock = createIntegrationBlock(
                        this,
                        integration,
                        index === this.integrations.length - 1 ? '33px' : '33px 33px 0px 33px'
                    );
                    signInElement.appendChild(integrationConnectBlock);
                }
                let poweredByBanner = createPoweredByBanner(this);
                signInElement.appendChild(poweredByBanner);
                let signInElementWrapper = createViewElement(
                    'div',
                    'revert-signin-container-wrapper',
                    transformStyle({
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
                    [signInElement]
                );
                signInElementWrapper.style.animation = 'fadein .8s forwards';
                signInElementWrapper.style.transition = 'color 500ms ease-in-out';
                signInElementWrapper.addEventListener('click', (event) => {
                    if (!signInElement.contains(event.target)) {
                        signInElementWrapper.style.animation = 'fadeoout .8s forwards';
                        signInElementWrapper.style.transition = 'color 500ms ease-in-out';
                        this.close();
                    }
                });
                rootElement.appendChild(signInElementWrapper);
                this.state = 'open';
            } else {
                const selectedIntegration = this.integrations.find(
                    (integration) => integration.integrationId === integrationId
                );
                if (selectedIntegration) {
                    const state = JSON.stringify({
                        tenantId: this.tenantId,
                        revertPublicToken: this.API_REVERT_PUBLIC_TOKEN,
                    });
                    if (selectedIntegration.integrationId === 'hubspot') {
                        window.open(
                            `https://app.hubspot.com/oauth/authorize?client_id=${this.HUBSPOT_CLIENT_ID}&redirect_uri=${this.REDIRECT_URL_BASE}/hubspot&scope=crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.marketing_events.read%20crm.objects.marketing_events.write%20crm.schemas.custom.read%20crm.objects.custom.read%20crm.objects.custom.write%20crm.objects.companies.write%20crm.schemas.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.deals.write%20crm.schemas.companies.read%20crm.schemas.companies.write%20crm.schemas.contacts.write%20crm.schemas.deals.read%20crm.schemas.deals.write%20crm.objects.owners.read%20crm.objects.quotes.write%20crm.objects.quotes.read%20crm.schemas.quotes.read%20crm.objects.line_items.read%20crm.objects.line_items.write%20crm.schemas.line_items.read&state=${state}`
                        );
                    } else if (selectedIntegration.integrationId === 'zohocrm') {
                        window.open(
                            `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ,AaaServer.profile.READ&client_id=${
                                this.ZOHOCRM_CLIENT_ID
                            }&response_type=code&access_type=offline&redirect_uri=${
                                this.REDIRECT_URL_BASE
                            }/zohocrm&state=${encodeURIComponent(state)}`
                        );
                    } else if (selectedIntegration.integrationId === 'sfdc') {
                        window.open(
                            `https://revert2-dev-ed.develop.my.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${this.SFDC_CLIENT_ID}&redirect_uri=${this.REDIRECT_URL_BASE}/sfdc&scope=offline_access+api+refresh_token&state=${state}`
                        );
                    }
                } else {
                    console.warn('Invalid integration ID provided.');
                }
            }
        };

        close = function () {
            let rootElement = document.getElementById('revert-ui-root');

            while (rootElement.firstChild) {
                rootElement.firstChild.remove();
            }
            this.state = 'close';
        };
    }
    revert = new Revert();
})();
module.exports = revert;
window.Revert = revert;
