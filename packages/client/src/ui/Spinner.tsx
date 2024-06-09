import React from 'react';
import { TailSpin } from 'react-loader-spinner';

function Spinner() {
    return (
        <TailSpin wrapperStyle={{ justifyContent: 'center', marginTop: '28vh' }} color="#fff" height={80} width={80} />
    );
}

export default Spinner;
