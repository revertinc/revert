/* eslint-disable jsx-a11y/anchor-is-valid */
import ReactCodeMirror from "@uiw/react-codemirror";
import useStore, { useAppStore, useNodeExecutionStore } from "../../store";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import {
  Badge,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Typography,
  DialogContentText,
  DialogProps,
  Tab,
  Tabs,
} from "@mui/material";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
import DropDownMenu, { CaretDropDown } from "../../common/dropdown";
import { javascript } from "@codemirror/lang-javascript";
import ExpandIcon from "../../assets/images/expand_icon.png";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BASE_API_URL } from "../../constants";
import { useUser } from "@clerk/clerk-react";

const RefreshWorkspacesButton = function () {
  const [loading, setLoading] = useState(false);
  const setWorkspaceData = useAppStore((state) => state.setWorkspaceData);
  const { user } = useUser();
  return (
    <div
      title="Refresh"
      className="cursor-pointer"
      onClick={() => {
        setLoading(true);
        fetch(`${BASE_API_URL}/auth/workspace`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user?.id,
          }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.workspaceId) {
              setWorkspaceData(result.workspace);
            }
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      }}
    >
      <RefreshIcon color={!loading ? "inherit" : "disabled"} />
    </div>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: "24px 0" }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const SlackInspector = () => {
  const { selectedNodes, updateNodeData } = useStore();
  const [slackData, setSlackData] = useState(selectedNodes[0].data.integration);
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const [isEditingLabel, setEditingLabel] = useState(false);
  const workspaceId = useAppStore((state) => state.workspaceId);
  const [selectedChannel, setSelectedChannel] = useState(
    slackData.postMessage.channel || ""
  );
  const [channels, setChannels] = useState<any>([]);
  const slackOAuthList = useAppStore((state) => {
    return state.workspaceData?.oauth?.filter((o) => o.type === "slack") || [];
  });
  const setWorkspaceData = useAppStore((state) => state.setWorkspaceData);
  const setWorkspaceId = useAppStore((state) => state.setWorkspaceId);
  const { user } = useUser();

  const executionState = useNodeExecutionStore(
    (state) => state.data[selectedNodes[0].id]
  );
  const seen = useNodeExecutionStore(
    (state) => state.seenMap[selectedNodes[0].id]
  );
  const setSeen = useNodeExecutionStore((state) => state.setSeen);
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const descriptionElementRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);
  const [scroll, setScroll] = React.useState<DialogProps["scroll"]>("paper");

  const resetData = () => {
    setSlackData(selectedNodes[0].data.integration);
  };
  const saveData = useCallback(() => {
    updateNodeData(selectedNodes[0].id, {
      integration: slackData,
    });
  }, [selectedNodes, slackData, updateNodeData]);

  const handleLabelChange = (event) => {
    setLabel(event.target.value);
  };

  useEffect(() => {
    if (slackData && slackData.oauth) {
      const formdata = new FormData();
      formdata.append("token", slackData.oauth.access_token);
      formdata.append("limit", "999");
      formdata.append("team_id", slackData.oauth.team.id);
      formdata.append("types", "public_channel,private_channel");
      const requestOptions = {
        method: "POST",
        body: formdata,
      };

      fetch("https://slack.com/api/conversations.list", requestOptions)
        .then((res) => res.json())
        .then((res) => {
          // console.log(
          //   "channels",
          //   res.channels,
          //   res.channels?.filter(
          //     (c) => c.id === slackData.postMessage.channel
          //   )[0]?.name
          // );
          setChannels(res.channels);
          if (res.channels.length) {
            setSelectedChannel(
              res.channels?.filter(
                (c) => c.id === slackData.postMessage.channel
              )[0]?.name
            );
          }
        })
        .catch((err) => console.error(err));
    }
  }, [slackData]);

  const saveLabel = () => {
    if (!label) {
      setLabel(label);
    }
    updateNodeData(selectedNodes[0].id, {
      label: label,
    });
    setEditingLabel(false);
  };

  const closeEditLabel = () => {
    setLabel(selectedNodes[0].data.label);
    setEditingLabel(false);
  };

  const handlePropertyChange = (property: string, data: any) => {
    if (property === "postMessage") {
      setSlackData((state) => {
        const updated = Object.assign({}, state[property]);
        if (!updated) return state;
        if (data.change === "delete") {
          delete updated[data.key];
        } else if (data.change === "value") {
          updated[data.key] = data.value;
        } else {
          updated[data.value] = updated[data.key] || "";
          delete updated[data.key];
        }
        return { ...state, [property]: { ...updated } };
      });
    } else {
      setSlackData((state) => {
        return { ...state, [data.key]: data.value };
      });
    }
  };

  const renderChannelsAndUsers = useMemo(
    () => () => {
      if (!channels || !channels.length)
        return (
          <DropDownMenu
            key={"channel-menu-empy"}
            allowedMethods={[]}
            method={""}
            onMethodChange={null}
            defaultOption={"Select from list"}
          />
        );

      return (
        <DropDownMenu
          key={"channel-menu"}
          allowedMethods={channels?.map((c) => c.name)}
          method={selectedChannel}
          onMethodChange={(channel: string) => {
            if (channels.length) {
              handlePropertyChange("postMessage", {
                key: "channel",
                value: channels.filter((c) => c.name === channel)[0]?.id,
                change: "value",
              });
            }
          }}
          defaultOption={"Select from list"}
        />
      );
    },
    [channels, selectedChannel]
  );

  const disabledSave = useMemo(() => {
    return slackData === selectedNodes[0].data.integration;
  }, [selectedNodes, slackData]);

  return (
    <>
      <div className="p-5">
        <div className="flex justify-between items-center ml-2 mb-3">
          {isEditingLabel ? (
            <div className="w-96 flex items-center">
              <TextField
                fullWidth
                variant="outlined"
                name="projectName"
                value={label}
                onChange={handleLabelChange}
                InputProps={{
                  style: {
                    height: 30,
                  },
                }}
              />

              <div className="flex items-center ml-2">
                <IconButton color="primary" onClick={closeEditLabel}>
                  <CloseIcon
                    id="close-edit-project-name"
                    style={{
                      width: 18,
                    }}
                  />
                </IconButton>

                <div className="ml-1">
                  <IconButton color="primary" onClick={saveLabel}>
                    <CheckIcon
                      style={{
                        width: 18,
                      }}
                    />
                  </IconButton>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-primary">{label}</p>
              <IconButton onClick={() => setEditingLabel(true)}>
                <EditIcon color="primary" />
              </IconButton>
            </>
          )}
        </div>

        <div className="flex flex-col text-[#fff] p-2">
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Connection</div>
          </div>
          <div className="flex-1 flex justify-between items-center mb-3 bg-[#3B3B3B]">
            <div className="text-base p-2">
              {slackData.oauth
                ? slackData.oauth.team.name
                : "Connect a Slack Workspace"}
            </div>
            <div className="flex items-center">
              {slackOAuthList.length > 0 && (
                <CaretDropDown
                  options={slackOAuthList.map((s) => s.team.name)}
                  handleOptionChange={(value) => {
                    const oauth = slackOAuthList.filter(
                      (s) => s.team.name === value
                    )[0];
                    handlePropertyChange("oauth", {
                      key: "oauth",
                      value: oauth,
                    });
                  }}
                />
              )}
              {/* <RefreshWorkspacesButton /> */}
              <a
                onClick={() => {
                  const newWindow = window.open(
                    `https://slack.com/oauth/v2/authorize?client_id=3222467456821.3980111917857&scope=chat:write,chat:write.public,chat:write.customize,channels:read,channels:history,groups:read,groups:history,mpim:history,im:history,commands&user_scope=chat:write&state=${workspaceId}`,
                    "self",
                    "height=770, width=839"
                  );
                  if (newWindow) {
                    const timer = setInterval(function () {
                      if (newWindow.closed) {
                        clearInterval(timer);
                        console.debug("closed");
                        fetch(`${BASE_API_URL}/auth/workspace`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            id: user?.id,
                          }),
                        })
                          .then((res) => res.json())
                          .then((result) => {
                            if (result.workspaceId && result.workspace) {
                              setWorkspaceData(result.workspace);
                              setWorkspaceId(result.workspaceId);
                            }
                          })
                          .catch((e) => {
                            console.error(e);
                          });
                      }
                    }, 1000);
                    newWindow.focus();
                  }
                  return false;
                }}
                title="Connect to a new Slack workspace"
              >
                <img
                  src={ExpandIcon}
                  alt="expand_icon"
                  className="w-4 h-4 m-2 cursor-pointer"
                />
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Text</div>
          </div>
          <div className="flex-1 mb-3">
            <ReactCodeMirror
              minHeight="100px"
              maxHeight="100px"
              editable
              value={slackData.postMessage.text}
              extensions={[evalHightlighterPlugin]}
              defaultValue={""}
              height="180px"
              onChange={(value) =>
                handlePropertyChange("postMessage", {
                  key: "text",
                  value: value,
                  change: "value",
                })
              }
              theme={atomone}
            />
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Channel/User</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            {renderChannelsAndUsers()}
          </div>
          {/* <p className="text-[12px] underline cursor-pointer mb-3">
            Add channel ID
          </p> */}
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Blocks</div>
          </div>
          <div className="flex-1 mb-3">
            <ReactCodeMirror
              minHeight="280px"
              maxHeight="550px"
              editable
              value={slackData.postMessage.blocks}
              extensions={[evalHightlighterPlugin, javascript()]}
              defaultValue={slackData.postMessage.blocks}
              height="180px"
              onChange={(value) => {
                if (!value) {
                  handlePropertyChange("postMessage", {
                    key: "blocks",
                    value: value,
                    change: "delete",
                  });
                } else {
                  handlePropertyChange("postMessage", {
                    key: "blocks",
                    value: value,
                    change: "value",
                  });
                }
              }}
              theme={atomone}
            />
          </div>
          <a
            target={"_blank"}
            href="https://api.slack.com/methods/chat.postMessage"
            className="text-[12px] underline"
            rel="noreferrer"
          >
            Learn about interactive messages
          </a>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: 14,
          position: "fixed",
          bottom: 0,
          flex: 1,
          background: "#212121",
          width: 390,
        }}
      >
        <Badge color="primary" variant="dot" invisible={seen}>
          <div
            onClick={() => {
              setOpen(true);
              setSeen(selectedNodes[0].id, true);
            }}
            className="flex bg-[#3B3B3B] pl-2 pr-2 pt-1 pb-1 justify-between items-center rounded cursor-pointer"
          >
            <div className="text-[#979797]">View Response</div>
            <img src={ExpandIcon} alt="expand_icon" className="w-4 h-4 m-2 " />
          </div>
        </Badge>
        <Button variant="outlined" onClick={resetData}>
          Reset
        </Button>
        <Button variant="contained" disabled={disabledSave} onClick={saveData}>
          Save
        </Button>
        <Dialog
          open={open}
          onClose={handleClose}
          scroll={scroll}
          aria-labelledby="scroll-dialog-title"
          aria-describedby="scroll-dialog-description"
          PaperProps={{
            sx: {
              position: "absolute",
              width: "50%",
              background: "#2e2e2e",
            },
          }}
        >
          <DialogContent dividers={scroll === "paper"}>
            <DialogContentText
              id="scroll-dialog-description"
              ref={descriptionElementRef}
              tabIndex={-1}
            >
              <Tabs
                value={value}
                onChange={handleChange}
                className="response-tabs"
                aria-label="basic tabs example"
              >
                {/* <Tab
                  label="Logs"
                  style={{
                    color: "#fff",
                    textTransform: "capitalize",
                    fontSize: 18,
                  }}
                /> */}
                <Tab
                  label="Response"
                  style={{
                    color: "#fff",
                    textTransform: "capitalize",
                    fontSize: 18,
                  }}
                />
              </Tabs>
              {/* <TabPanel value={value} index={0}>
                <ReactCodeMirror
                  editable={false}
                  value={"// logs here"}
                  extensions={[
                    evalHightlighterPlugin,
                    javascript({ jsx: true }),
                  ]}
                  defaultValue={"// logs here"}
                  height="calc(100vh - 260px)"
                  width="100%"
                  theme={atomone}
                />
              </TabPanel> */}
              <TabPanel value={value} index={0}>
                <ReactCodeMirror
                  editable={false}
                  value={JSON.stringify(executionState?.response, null, 2)}
                  extensions={[evalHightlighterPlugin, javascript()]}
                  defaultValue={JSON.stringify(
                    executionState?.response,
                    null,
                    2
                  )}
                  height="calc(100vh - 260px)"
                  width="100%"
                  theme={atomone}
                />
              </TabPanel>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default SlackInspector;
