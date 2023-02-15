import styled from "@emotion/styled";

const Container = styled.div`
  /* height: 20rem; */
  width: 22.5rem;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 1rem;

  border: 2px solid #d9d9d9;
`;

const ImageContainer = styled.div`
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  text-align: center;
  margin-bottom: 12px;

  > img {
    height: 10rem;
    width: 100%;
    object-fit: cover;
  }
`;

export { Container, ImageContainer };
