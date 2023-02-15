import * as React from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import { HamburgerIcon, OverviewIcon, FeedbackIcon } from "../../assets/icons";

const drawerWidth = 200;

const openedMixin = (theme: Theme): CSSObject => ({
  // background: "#1e1e2c",
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  // background: "#1e1e2c",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: theme.spacing(0, 1.5),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": { ...openedMixin(theme), background: "#262626" },
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": { ...closedMixin(theme), background: "#262626" },
  }),
}));

const StyledListItemText = styled(ListItemText)`
  & .MuiListItemText-primary {
    font-weight: 700;
  }
`;

const StyledListItemButton = styled(ListItemButton)<{ isActive?: boolean }>`
  ${({ isActive }) =>
    isActive
      ? "background: black; color: white; width:80%; margin: 0 auto; border-radius: 12px;"
      : ""}
`;

export default function MiniDrawer() {
  const [open, setOpen] = React.useState(false);
  const toggleMenu = () => {
    setOpen((bool) => !bool);
  };

  const menuItems = {
    top: [
      {
        name: "Overview",
        link: ["/", "/home"],
        icon: ({ isActive }: any) => <OverviewIcon isActive={isActive} />,
      },
    ],
    bottom: [
      {
        name: "Profile",
        link: ["/profile"],
        icon: () => (
          <SignedIn>
            <div className={open ? "mr-4" : ""}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        ),
      },
    ],
  };

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <IconButton
          onClick={toggleMenu}
          style={{ backgroundColor: "transparent" }}
        >
          <HamburgerIcon />
        </IconButton>
      </DrawerHeader>
      <Box
        component="div"
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          paddingBottom: "2rem",
        }}
      >
        <List>
          {menuItems.top.map((item) => (
            <ListItem
              key={item.name}
              disablePadding
              sx={{
                display: "block",
                marginBottom: "1rem",
              }}
            >
              <StyledListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                  width: "80%",
                  margin: "0 auto",
                  ":hover": {
                    background: item.link.includes(window.location.pathname)
                      ? "black"
                      : "",
                  },
                }}
                isActive={item.link.includes(window.location.pathname)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  <item.icon
                    isActive={item.link.includes(window.location.pathname)}
                  />
                </ListItemIcon>
                <StyledListItemText
                  primary={item.name}
                  sx={{
                    opacity: open ? 1 : 0,
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                  }}
                />
              </StyledListItemButton>
            </ListItem>
          ))}
        </List>
        <List>
          {menuItems.bottom.map((item) => (
            <ListItem key={item.name} disablePadding sx={{ display: "block" }}>
              <StyledListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                  width: "80%",
                  margin: "0 auto",
                  ":hover": {
                    background: item.link.includes(window.location.pathname)
                      ? "black"
                      : "",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: item.name !== "Profile" && open ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  <item.icon />
                </ListItemIcon>
                <StyledListItemText
                  primary={item.name}
                  sx={{
                    opacity: open ? 1 : 0,
                    fontSize: "1.5rem",
                    fontWeight: "600",
                  }}
                />
              </StyledListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
