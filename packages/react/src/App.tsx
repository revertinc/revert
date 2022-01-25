import styled from 'styled-components';
import RevertConnect from './lib/RevertConnect';

function App() {
    return (
        <Wrapper>
            <RevertConnect />
        </Wrapper>
    );
}

const Wrapper = styled.div`
    margin: 2rem;
    display: flex;
    justify-content: center;
`;

export default App;
