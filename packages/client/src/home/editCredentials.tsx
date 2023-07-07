import React from 'react';
import styled from 'styled-components';
import { Box as MuiBox, Button, Chip as MuiChip } from '@mui/material';
import { LoadingButton as MuiLoadingButton } from '@mui/lab';

import { useApi } from '../data/hooks';

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
`;

const LoadingButton = styled(MuiLoadingButton)`
    background-color: #000;
    &.Mui-disabled {
        background-color: #000;
    }
`;

const EditCredentials: React.FC<{ app: any; handleClose: () => void; setAccount: any }> = ({
    app,
    handleClose,
    setAccount,
}) => {
    const [clientId, setClientId] = React.useState<string>(app.app_client_id);
    const [clientSecret, setClientSecret] = React.useState<string>(app.app_client_secret);
    const [scopes, setScopes] = React.useState<string[]>(app.scope);
    const [newScope, setNewScope] = React.useState<string>('');

    const { data, loading, status, fetch } = useApi();

    const handleAddNewScope = (e) => {
        if (e.key === 'Enter') {
            setScopes((ss) => [...ss, ...newScope.split(',').map((s) => s.trim())]);
            setNewScope('');
        }
    };

    const handleSubmit = async () => {
        await fetch({
            url: '/internal/account/credentials',
            method: 'POST',
            payload: { clientId, clientSecret, scopes, tpId: app.tp_id },
        });
    };

    React.useEffect(() => {
        if (status === 200) {
            handleClose();
            // Update account locally to avoid additional api call
            setAccount((account) => {
                return {
                    ...account,
                    apps: [...account.apps.filter((a) => a.tp_id !== app.tp_id), data],
                };
            });
        }
    }, [status, handleClose, setAccount, data, app]);

    return (
        <Box>
            <Row>
                <span className="font-bold">Client ID: </span>
                <Input
                    value={clientId}
                    onChange={(ev) => setClientId((ev.target.value || '').trim())}
                    error={!clientId}
                />
            </Row>
            <Row>
                <span className="font-bold">Client Secret: </span>
                <Input
                    value={clientSecret}
                    onChange={(ev) => setClientSecret((ev.target.value || '').trim())}
                    error={!clientSecret}
                />
            </Row>
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
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <Button onClick={handleClose} style={{ color: '#000' }}>
                    Close
                </Button>
                <LoadingButton
                    variant="contained"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={!clientId || !clientSecret}
                >
                    Submit
                </LoadingButton>
            </div>
        </Box>
    );
};

export default EditCredentials;
