var revert;

declare var __CORE_API_BASE_URL__: string;
declare var __REDIRECT_URL_BASE__: string;

var envConfig = {
    CORE_API_BASE_URL: `${__CORE_API_BASE_URL__}`,
    REDIRECT_URL_BASE: `${__REDIRECT_URL_BASE__}`,
};

const transformStyle = function (style) {
    for (let [key, value] of Object.entries(style)) {
        let new_key = toKebabCase(key);
        if (key !== new_key) {
            //@ts-ignore
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
const createViewElement = function (tag, id, style, children, innerHTML?) {
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

    const svgCloseElementCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    svgCloseElementCircle.setAttributeNS(null, 'fill', '#B79C9B');
    svgCloseElementCircle.setAttributeNS(null, 'fill-opacity', '0.33');
    svgCloseElementCircle.setAttributeNS(null, 'cx', '12');
    svgCloseElementCircle.setAttributeNS(null, 'cy', '12');
    svgCloseElementCircle.setAttributeNS(null, 'r', '12');
    svgCloseElement.appendChild(svgCloseElementCircle);
    const svgCloseElementPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgCloseElementPath.setAttributeNS(
        null,
        'd',
        'M8.24264 8.24271C7.85212 8.63324 7.85212 9.2664 8.24264 9.65692L11.0711 12.4854L8.24264 15.3138C7.85212 15.7043 7.85212 16.3375 8.24264 16.728C8.63316 17.1185 9.26633 17.1185 9.65685 16.728L12.4853 13.8996L15.3137 16.728C15.7042 17.1185 16.3374 17.1185 16.7279 16.728C17.1184 16.3375 17.1184 15.7043 16.7279 15.3138L13.8995 12.4854L16.7279 9.65692C17.1184 9.2664 17.1184 8.63323 16.7279 8.24271C16.3374 7.85219 15.7042 7.85219 15.3137 8.24271L12.4853 11.0711L9.65685 8.24271C9.26633 7.85219 8.63316 7.85219 8.24264 8.24271Z'
    );
    svgCloseElement.appendChild(svgCloseElementPath);

    var closeButton = createViewElement(
        'span',
        'fd-welcome-close-btn',
        transformStyle({
            cursor: 'pointer',
        }),
        [svgCloseElement]
    );
    return closeButton;
};

const openInNewTab = function () {
    var currentUrl = window.location.href;
    var win = window.open(
        'https://revert.dev?utm_campaign=powered&utm_medium=signin&utm_source=' + currentUrl,
        '_blank'
    );
    window.focus();
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

const createIntegrationBlock = function (self, integration) {
    const isInActive = integration.status !== 'active';
    let integrationConnect = document.createElement('div');
    integrationConnect.setAttribute('id', `integration-block-${integration.integrationId}`);
    integrationConnect.setAttribute('class', `integration-block`);
    integrationConnect.setAttribute('integrationId', integration.integrationId);
    integrationConnect.style.width = '158px';
    integrationConnect.style.height = '82px';
    integrationConnect.style.display = 'flex';
    integrationConnect.style.boxSizing = 'border-box';
    integrationConnect.style.border = '1px solid #E8E8EE33';
    integrationConnect.style.borderRadius = '8px';
    integrationConnect.style.background = `url(${integration.imageSrc})`;
    integrationConnect.style.backgroundRepeat = 'no-repeat';
    integrationConnect.style.backgroundPosition = 'center';
    integrationConnect.style.boxShadow = '0px 4px 10px 0px #272F4354';
    integrationConnect.style.position = 'relative';

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
        integrationConnect.appendChild(comingSoon);
    }
    return integrationConnect;
};

(function () {
    class Revert {
        CORE_API_BASE_URL: string;
        #API_CRM_METADATA_SUFFIX: string;
        #integrations: any[];
        #state: string;
        #REDIRECT_URL_BASE: string;
        #integrationsLoaded: boolean;
        #onClose: () => void;

        get REDIRECT_URL_BASE() {
            return this.#REDIRECT_URL_BASE;
        }

        get getIntegrationsLoaded() {
            return this.#integrationsLoaded;
        }

        constructor() {
            this.CORE_API_BASE_URL = envConfig.CORE_API_BASE_URL;
            this.#API_CRM_METADATA_SUFFIX = 'v1/metadata/crms';
            this.#integrations = [];
            this.#state = 'close';
            this.#REDIRECT_URL_BASE = envConfig.REDIRECT_URL_BASE;
            this.#integrationsLoaded = false;
        }

        loadIntegrations = function (config) {
            var requestOptions = {
                mode: 'cors' as RequestMode,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-revert-public-token': this.API_REVERT_PUBLIC_TOKEN,
                },
            };

            let fetchURL = this.CORE_API_BASE_URL + this.#API_CRM_METADATA_SUFFIX;

            fetch(fetchURL, requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    console.log('Revert crm integrations ', result);
                    this.#integrations = result.data;
                    this.#integrationsLoaded = true;
                    config.onLoad();
                })
                .catch((error) => {
                    console.log('error', error);
                    this.#integrationsLoaded = false;
                    config.onError && config.onError();
                });
        };

        init = function (config) {
            this.API_REVERT_PUBLIC_TOKEN = config.revertToken;
            this.tenantId = config.tenantId;
            this.#onClose = config.onClose;
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
                this.loadIntegrations(config);
            })();
        };

        open = function (integrationId) {
            let selectedIntegrationId;
            if (!integrationId) {
                // show every integration possible
                const signInElement = document.createElement('div');
                signInElement.setAttribute('id', 'revert-signin-container');
                signInElement.style.position = 'absolute';
                signInElement.style.top = '15%';
                signInElement.style.left = '40%';
                signInElement.style.width = '390px';
                signInElement.style.display = 'flex';
                signInElement.style.flexDirection = 'column';
                signInElement.style.justifyContent = 'center';
                signInElement.style.alignItems = 'center';
                signInElement.style.background = '#fff';
                signInElement.style.flexDirection = 'column';
                signInElement.style.padding = '32px';
                signInElement.style.boxSizing = 'border-box';
                signInElement.style.borderRadius = '10px';
                signInElement.style.gap = '24px';
                let rootElement = document.getElementById('revert-ui-root');
                if (!rootElement) {
                    console.error('Root element does not exist!');
                    return;
                }
                let closeButton = createCloseButton();
                closeButton.addEventListener('click', this.close.bind(this));
                let headerDiv = createViewElement(
                    'div',
                    'revert-signin-header',
                    transformStyle({
                        fontWeight: 'bold',
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                    }),
                    []
                );
                let headerText = createViewElement(
                    'span',
                    'revert-signin-header',
                    transformStyle({
                        fontWeight: 'bold',
                        width: '100%',
                        boxSizing: 'border-box',
                        color: '#777'
                    }),
                    [],
                    'Select CRM'
                );
                headerDiv.appendChild(headerText);
                headerDiv.appendChild(closeButton);
                signInElement.appendChild(headerDiv);
                const integrationsContainer = createViewElement(
                    'div',
                    'integrations-container',
                    transformStyle({
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: '10px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }),
                    []
                );
                signInElement.appendChild(integrationsContainer);
                for (let index = 0; index < this.#integrations.length; index++) {
                    const integration = this.#integrations[index];
                    let integrationConnectBlock = createIntegrationBlock(this, integration);
                    integrationConnectBlock.addEventListener('click', (ev) => {
                        const target = ev.target as HTMLDivElement;
                        selectedIntegrationId = target.getAttribute('integrationId');
                        (target.parentElement as HTMLDivElement).childNodes.forEach(
                            (a) => ((a as HTMLDivElement).style.border = '1px solid #E8E8EE33')
                        );
                        (ev.target as HTMLDivElement).style.border = '2px solid #2047D080';
                        (document.getElementById('connect-integration') as HTMLButtonElement).style.background =
                            '#272DC0';
                    });
                    integrationsContainer.appendChild(integrationConnectBlock);
                }
                const integrationBlockHoverCss = '.integration-block:hover { border-color: #2047D044 !important; }';
                const style = document.createElement('style') as any;
                style.setAttribute('type', 'text/css');
                if (style.styleSheet) {
                    style.styleSheet.cssText = integrationBlockHoverCss;
                } else {
                    style.appendChild(document.createTextNode(integrationBlockHoverCss));
                }
                document.getElementsByTagName('head')[0].appendChild(style);

                const button = createViewElement(
                    'div',
                    `connect-integration`,
                    transformStyle({
                        cursor: 'pointer',
                        padding: '8px 20px',
                        color: '#fff',
                        textAlign: 'center',
                        alignSelf: 'center',
                        background: '#9394c4',
                        borderRadius: 8,
                        fontSize: 20,
                        width: '100%',
                        height: '72px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }),
                    [],
                    'Connect →'
                );
                button.addEventListener('click', (ev) => {
                    const state = JSON.stringify({
                        tenantId: this.tenantId,
                        revertPublicToken: this.API_REVERT_PUBLIC_TOKEN,
                    });
                    const selectedIntegration = this.#integrations.find(
                        (int) => int.integrationId === selectedIntegrationId
                    );
                    if (selectedIntegrationId === 'hubspot') {
                        window.open(
                            `https://app.hubspot.com/oauth/authorize?client_id=${
                                selectedIntegration.clientId
                            }&redirect_uri=${this.REDIRECT_URL_BASE}/hubspot&scope=${selectedIntegration.scopes.join(
                                '%20'
                            )}&state=${state}`
                        );
                        this.close();
                    } else if (selectedIntegrationId === 'zohocrm') {
                        window.open(
                            `https://accounts.zoho.com/oauth/v2/auth?scope=${selectedIntegration.scopes.join(
                                ','
                            )}&client_id=${
                                selectedIntegration.clientId
                            }&response_type=code&access_type=offline&redirect_uri=${
                                this.REDIRECT_URL_BASE
                            }/zohocrm&state=${encodeURIComponent(state)}`
                        );
                        this.close();
                    } else if (selectedIntegrationId === 'sfdc') {
                        const queryParams = {
                            response_type: 'code',
                            client_id: selectedIntegration.clientId,
                            redirect_uri: `${this.REDIRECT_URL_BASE}/sfdc`,
                            state,
                        };
                        const urlSearchParams = new URLSearchParams(queryParams);
                        const queryString = urlSearchParams.toString();

                        window.open(
                            `https://login.salesforce.com/services/oauth2/authorize?${queryString}${
                                selectedIntegration.scopes.length
                                    ? `&scope=${selectedIntegration.scopes.join('%20')}`
                                    : ''
                            }`
                        );
                        this.close();
                    } else if (selectedIntegrationId === 'pipedrive') {
                        window.open(
                            `https://oauth.pipedrive.com/oauth/authorize?client_id=${selectedIntegration.clientId}&redirect_uri=${this.REDIRECT_URL_BASE}/pipedrive&state=${state}`
                        );
                        this.close();
                    }
                });
                signInElement.appendChild(button);
                // let poweredByBanner = createPoweredByBanner(this);
                // signInElement.appendChild(poweredByBanner);
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
                const selectedIntegration = this.#integrations.find(
                    (integration) => integration.integrationId === integrationId
                );
                if (selectedIntegration) {
                    const scopes = selectedIntegration.scopes;
                    const state = JSON.stringify({
                        tenantId: this.tenantId,
                        revertPublicToken: this.API_REVERT_PUBLIC_TOKEN,
                    });
                    if (selectedIntegration.integrationId === 'hubspot') {
                        window.open(
                            `https://app.hubspot.com/oauth/authorize?client_id=${
                                selectedIntegration.clientId
                            }&redirect_uri=${this.#REDIRECT_URL_BASE}/hubspot&scope=${scopes.join(
                                '%20'
                            )}&state=${state}`
                        );
                    } else if (selectedIntegration.integrationId === 'zohocrm') {
                        window.open(
                            `https://accounts.zoho.com/oauth/v2/auth?scope=${scopes.join(',')}&client_id=${
                                selectedIntegration.clientId
                            }&response_type=code&access_type=offline&redirect_uri=${
                                this.#REDIRECT_URL_BASE
                            }/zohocrm&state=${encodeURIComponent(state)}`
                        );
                    } else if (selectedIntegration.integrationId === 'sfdc') {
                        const queryParams = {
                            response_type: 'code',
                            client_id: selectedIntegration.clientId,
                            redirect_uri: `${this.#REDIRECT_URL_BASE}/sfdc`,
                            state,
                        };
                        const urlSearchParams = new URLSearchParams(queryParams);
                        const queryString = urlSearchParams.toString();
                        window.open(
                            `https://login.salesforce.com/services/oauth2/authorize?${queryString}${
                                scopes.length ? `&scope=${scopes.join('%20')}` : ''
                            }`
                        );
                    } else if (selectedIntegration.integrationId === 'pipedrive') {
                        window.open(
                            `https://oauth.pipedrive.com/oauth/authorize?client_id=${
                                selectedIntegration.clientId
                            }&redirect_uri=${this.#REDIRECT_URL_BASE}/pipedrive&state=${state}`
                        );
                    }
                } else {
                    console.warn('Invalid integration ID provided.');
                }
            }
        };

        close = function () {
            let rootElement = document.getElementById('revert-ui-root');

            while (rootElement?.firstChild) {
                rootElement.firstChild.remove();
            }
            this.state = 'close';
            this.#onClose();
        };
    }
    revert = new Revert();
})();
module.exports = revert;
(window as any).Revert = revert;
