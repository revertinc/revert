import styled from "@emotion/styled";
import MuiAddIcon from "@mui/icons-material/Add";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  min-height: 14.5rem;
  width: 22.5rem;

  background-color: #1c1c1c;
  border: 2px solid #d9d9d9;
  border-radius: 24px;
`;

const ButtonContainer = styled.div`
  cursor: pointer;

  border-radius: 50%;
`;

const AddIcon = styled(MuiAddIcon)`
  fill: white;
`;

export { Container, ButtonContainer, AddIcon };
