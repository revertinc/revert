import React from 'react';
import styled from 'styled-components';
import { Box as MuiBox, Button, Chip as MuiChip } from '@mui/material';

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

const Input = styled.input`
    color: #444;
    width: 60%;
    border-bottom: 1px solid #444;
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

const EditCredentials: React.FC<{ app: any; handleClose: () => void }> = ({ app, handleClose }) => {
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
            // refetch apps or optimistic update?
        }
    }, [status, handleClose]);

    return (
        <Box>
            <Row>
                <span className="font-bold">Client ID: </span>
                <Input value={clientId} onChange={(ev) => setClientId((ev.target.value || '').trim())} />
            </Row>
            <Row>
                <span className="font-bold">Client Secret: </span>
                <Input value={clientSecret} onChange={(ev) => setClientSecret((ev.target.value || '').trim())} />
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
                <Button onClick={handleClose}>Close</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    Submit
                </Button>
            </div>
        </Box>
    );
};

export default EditCredentials;
