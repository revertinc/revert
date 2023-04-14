import { RevertConnect } from '@/lib';

const Revert = () => {
    return (
        <RevertConnect
            config={{
                revertToken: 'pk_test_Y2xlcmsuc3Ryb25nLmRlZXItNTYubGNsLmRldiQ',
                tenantId: 'testTenantId',
            }}
        />
    );
};

export default Revert;
