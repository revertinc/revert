import React from 'react';
import styled from 'styled-components';

const SwitchCheckbox = styled.input`
    height: 0;
    width: 0;
    visibility: hidden;
`;

const SwitchLabel = styled.label<{ $isOn; $onColor }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    width: 80px;
    height: 40px;
    background: ${(props) => (props.$isOn ? props.$onColor : 'grey')};
    border-radius: 90px;
    position: relative;
    transition: background-color 0.2s;
`;

const SwitchButton = styled.span`
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 35px;
    height: 35px;
    border-radius: 35px;
    transition: 0.2s;
    background: #fff;
    box-shadow: 0 0 2px 0 rgba(10, 10, 10, 0.29);

    ${SwitchCheckbox}:checked + ${SwitchLabel} & {
        left: calc(100% - 2px);
        transform: translateX(-100%);
    }

    ${SwitchLabel}:active & {
        width: 50px;
    }
`;

const CustomSwitch = (props) => {
    return (
        <>
            <SwitchCheckbox checked={props.isOn} onChange={props.handleToggle} type="checkbox" id="react-switch-new" />
            <SwitchLabel $isOn={props.isOn} $onColor={props.onColor} htmlFor="react-switch-new">
                <SwitchButton />
            </SwitchLabel>
        </>
    );
};

export default CustomSwitch;
