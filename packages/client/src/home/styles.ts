import styled from "@emotion/styled";

const Header = styled.div`
  padding-top: 1rem;

  margin-bottom: 2rem;
`;

interface StyledTextProps {
  size?: string;
  weight?: string;
  color?: string;
  lHeight?: string;
  nowrap?: boolean;
}

const StyledText = styled.div<StyledTextProps>`
  font-size: ${({ size }) => size ?? ""};
  font-family: Inter;
  font-weight: ${({ weight }) => weight ?? ""};
  color: ${({ color }) => color ?? ""};
  line-height: ${({ lHeight }) => lHeight ?? ""};
  white-space: ${({ nowrap }) => (nowrap ? "nowrap" : "normal")};
  overflow-x: auto;
  text-overflow: ellipsis;
`;

export { Header, StyledText };
