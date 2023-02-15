import React from "react";
import { StyledText } from "../styles";
import { Container } from "./styles";

const ExistingProjectCard = ({ project }: ExistingProjectCardProps) => {
  return (
    <Container>
      <div style={{ width: "100%" }}>
        <StyledText lHeight="1.5" weight="600" nowrap>
          {project.name || project.id}
        </StyledText>
      </div>
    </Container>
  );
};

interface ExistingProjectCardProps {
  project: any;
}

export default ExistingProjectCard;
