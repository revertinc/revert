import React from 'react';
import styled from 'styled-components';
import { Box as MuiBox, Button, Chip as MuiChip, Switch } from '@mui/material';
import { LoadingButton as MuiLoadingButton } from '@mui/lab';

import { useApi } from '../../data/hooks';

const Chip = styled(MuiChip)`
    cursor: pointer;

    &:hover {
        border-color: #000;
    }
`;

const Row = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    padding: 10px;
`;

const Input = styled.input<{ error?: boolean }>`
    color: #444;
    width: 60%;
    border-bottom: 1px solid ${(props) => (!!props.error ? 'red' : '#444')};
    outline: none;
`;

const Box = styled(MuiBox)`
    display: flex;
    flex-direction: column;
    background-color: #fff;
    width: 500px;
    border-radius: 20px;
    color: #444;
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 24px;
    padding: 15px;
`;

const ScopesContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 70%;
`;

const Stack = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 5px;
    flex-wrap: wrap;
    max-height: 200px;
    overflow-y: auto;
`;

const LoadingButton = styled(MuiLoadingButton)`
    background-color: #000;
    &.Mui-disabled {
        background-color: #000;
    }
`;

interface AppConfig {
    bot_token?: string;
    org_url?: string;
}

// Todo: Refactor this and make the styling more usable, also solve the errors in console which were to note were already there
const EditCredentials: React.FC<{
    app: any;
    handleClose: ({ refetchOnClose }: { refetchOnClose?: boolean | undefined }) => Promise<void>;
}> = ({ app, handleClose }) => {
    const [clientId, setClientId] = React.useState<string>(app.app_client_id);
    const [clientSecret, setClientSecret] = React.useState<string>(app.app_client_secret);
    const [botToken, setBotToken] = React.useState<string>(app.app_bot_token);
    const [appConfig, setAppConfig] = React.useState<AppConfig>({});
    const [scopes, setScopes] = React.useState<string[]>(app.scope);
    const [newScope, setNewScope] = React.useState<string>('');
    const [isRevertApp, setIsRevertApp] = React.useState(app.is_revert_app);

    const { loading, status, fetch } = useApi();

    const handleAddNewScope = (e) => {
        if (e.key === 'Enter') {
            setScopes((ss) => [...ss, ...newScope.split(',').map((s) => s.trim())]);
            setNewScope('');
        }
    };

    const handleSubmit = async () => {
        const payload = {
            appId: app.id,
            tpId: app.tp_id,
            isRevertApp,
            ...(!isRevertApp && { clientId, clientSecret, scopes, appConfig }),
        };
        await fetch({
            url: '/internal/account/credentials',
            method: 'POST',
            payload,
        });
    };

    const handleAppConfigFieldChange = (ev) => {
        const val = (ev.target.value || '').trim();
        if (app.tp_id === 'discord') {
            setAppConfig({ bot_token: val });
        } else if (app.tp_id === 'ms_dynamics_365_sales') {
            setAppConfig({ org_url: val });
        }
    };

    React.useEffect(() => {
        if (status === 200) {
            handleClose({ refetchOnClose: true });
        }
    }, [status, handleClose]);

    return (
        <Box style={{ background: '#181d28', color: '#fff' }}>
            <Row>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="font-bold">Use default revert app</span>
                    <span style={{ fontSize: '14px', marginBottom: 20 }}>
                        (uncheck to use your own app credentials)
                    </span>
                    <span className="text-xs align-right font-bold mb-4"> AppId: {app.id}</span>
                </span>
                <Switch
                    style={{ color: '#fff' }}
                    checked={isRevertApp}
                    value={isRevertApp}
                    onChange={(ev) => setIsRevertApp(ev.target.checked)}
                />
            </Row>
            {!isRevertApp && (
                <>
                    <Row>
                        <span className="font-bold">Client ID: </span>
                        <Input
                            className="app_client_id"
                            value={clientId}
                            onChange={(ev) => setClientId((ev.target.value || '').trim())}
                            error={!clientId}
                        />
                    </Row>
                    <Row>
                        <span className="font-bold">Client Secret: </span>
                        <Input
                            className="app_client_secret"
                            value={clientSecret}
                            onChange={(ev) => setClientSecret((ev.target.value || '').trim())}
                            error={!clientSecret}
                        />
                    </Row>
                    {app.tp_id === 'discord' && (
                        <Row>
                            <span className="font-bold">Bot Token: </span>
                            <Input
                                className="app_bot_token"
                                value={app?.app_config?.bot_token}
                                onChange={handleAppConfigFieldChange}
                                error={!app?.app_config?.bot_token}
                            />
                        </Row>
                    )}
                    {app.tp_id === 'ms_dynamics_365_sales' && (
                        <Row>
                            <span className="font-bold">Organisation URL: </span>
                            <Input
                                className="app_org_url"
                                value={app?.app_config?.org_url}
                                onChange={handleAppConfigFieldChange}
                                error={!app?.app_config?.org_url}
                            />
                        </Row>
                    )}
                    {!(app.tp_id === 'closecrm' || app.tp_id === 'pipedrive' || app.tp_id === 'clickup') && (
                        <Row>
                            <span className="font-bold">Scopes: </span>
                            {/* <p className="break-words">{scopes}</p> */}
                            <ScopesContainer>
                                <Stack>
                                    {scopes.map((scope, i) => (
                                        <Chip
                                            label={scope}
                                            key={i}
                                            variant="outlined"
                                            color="primary"
                                            style={{ color: '#fff', background: '#000' }}
                                            onDelete={(ev) => setScopes((ss) => [...ss.filter((s) => s !== scope)])}
                                        />
                                    ))}
                                </Stack>
                                <Input
                                    value={newScope}
                                    onChange={(ev) => setNewScope((ev.target.value || '').trim())}
                                    onKeyDown={handleAddNewScope}
                                />
                            </ScopesContainer>
                        </Row>
                    )}
                </>
            )}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <Button onClick={() => handleClose({ refetchOnClose: false })} style={{ color: '#fff' }}>
                    Close
                </Button>
                <LoadingButton
                    style={{ background: '#293347' }}
                    variant="contained"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={
                        isRevertApp
                            ? false
                            : app.tp_id === 'discord'
                            ? !clientId || !clientSecret || !appConfig.bot_token
                            : !clientId || !clientSecret
                    }
                >
                    Submit
                </LoadingButton>
            </div>
        </Box>
    );
};

export default EditCredentials;
