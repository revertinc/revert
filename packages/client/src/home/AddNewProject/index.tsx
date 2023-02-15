import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { StyledText } from "../styles";
import { Container, ButtonContainer } from "./styles";
import { useAppStore } from "../../store";
import { TailSpin } from "react-loader-spinner";

const AddNewProject = () => {
  const inputFile = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Container>
      {isLoading ? (
        <TailSpin
          wrapperStyle={{ justifyContent: "center" }}
          color="#1C1C1C"
          height={80}
          width={80}
        />
      ) : (
        <>
          <ButtonContainer
            onClick={() => {
              if (inputFile?.current) {
                // @ts-ignore
                inputFile.current.click();
              }
            }}
          ></ButtonContainer>
          <StyledText size="1.5rem" weight="500" color="white" lHeight="1.5">
            Create a new workflow
          </StyledText>
          <StyledText
            size="1.25rem"
            weight="500"
            color="rgba(255,255,255,0.5)"
            lHeight="1.5"
            style={{
              marginTop: "0.5rem",
            }}
          >
            .glb
          </StyledText>
        </>
      )}
    </Container>
  );
};

export default AddNewProject;
