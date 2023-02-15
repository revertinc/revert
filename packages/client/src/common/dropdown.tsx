import * as React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Menu, { MenuProps } from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "left",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 100,
    background: theme.palette.secondary.main,
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
  },
}));

interface DropDownListProps {
  allowedMethods: Object;
  method: string;
  onMethodChange: any;
  defaultOption?: string;
  key?: string;
  color?:
    | "inherit"
    | "secondary"
    | "primary"
    | "success"
    | "error"
    | "info"
    | "warning"
    | undefined;
}
export default function DropdownMenu({
  onMethodChange,
  method,
  allowedMethods,
  defaultOption,
  key,
  color,
}: DropDownListProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [value, setValue] = React.useState(
    method || defaultOption || allowedMethods[0]
  );
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (e) => {
    if (e.target.value >= 0) {
      setValue(allowedMethods[e.target.value]);
      onMethodChange(allowedMethods[e.target.value]);
    }
    setAnchorEl(null);
  };

  return (
    <div className="w-[100%]">
      <Button
        id="demo-customized-button"
        aria-controls={open ? "demo-customized-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="contained"
        color={color ? color : "secondary"}
        disableElevation
        className="w-[105%] flex justify-between"
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {value ? value : "Options"}
      </Button>
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        color="secondary"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        className="justify-between"
      >
        {Object.entries(allowedMethods).map((obj, index) => {
          return (
            <MenuItem
              key={index}
              onClick={handleClose}
              disableRipple
              value={obj[0]}
            >
              {obj[1]}
            </MenuItem>
          );
        })}
      </StyledMenu>
    </div>
  );
}

export const CaretDropDown = ({ options, handleOptionChange }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClose = (e) => {
    if (e.target.value >= 0) {
      handleOptionChange(options[e.target.value]);
    }
    setAnchorEl(null);
  };
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  return (
    <>
      <div
        onClick={handleClick}
        className="cursor-pointer"
        title="Connect to an already connected Slack workspace"
      >
        <KeyboardArrowDownIcon />
      </div>
      <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          "aria-labelledby": "demo-customized-button",
        }}
        color="secondary"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        className="justify-between"
      >
        {options.map((o: string, index) => (
          <MenuItem
            key={index}
            onClick={handleClose}
            disableRipple
            value={index}
          >
            {o}
          </MenuItem>
        ))}
      </StyledMenu>
    </>
  );
};
