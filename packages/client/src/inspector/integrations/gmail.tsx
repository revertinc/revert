/* eslint-disable jsx-a11y/anchor-is-valid */
import useStore, { useAppStore, useNodeExecutionStore } from "../../store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
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
  DialogContentText,
  DialogProps,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ExpandIcon from "../../assets/images/expand_icon.png";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { langs } from "@uiw/codemirror-extensions-langs";
import DropDownMenu, { CaretDropDown } from "../../common/dropdown";
import { BASE_API_URL } from "../../constants";
import { useUser } from "@clerk/clerk-react";
import { javascript } from "@codemirror/lang-javascript";

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

const GmailInspector = () => {
  const { selectedNodes, updateNodeData } = useStore();
  const [gmail, setGmailData] = useState(selectedNodes[0].data.integration);
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const [isEditingLabel, setEditingLabel] = useState(false);
  const setWorkspaceData = useAppStore((state) => state.setWorkspaceData);
  const oAuthList = useAppStore((state) => {
    return state.workspaceData?.oauth?.filter((o) => o.type === "gmail") || [];
  });
  const setWorkspaceId = useAppStore((state) => state.setWorkspaceId);
  const workspaceId = useAppStore((state) => state.workspaceId);
  const { user } = useUser();
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
  const executionState = useNodeExecutionStore(
    (state) => state.data[selectedNodes[0].id]
  );

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
    setGmailData(selectedNodes[0].data.integration);
  };
  const saveData = useCallback(() => {
    updateNodeData(selectedNodes[0].id, {
      integration: gmail,
    });
  }, [selectedNodes, gmail, updateNodeData]);

  const handleLabelChange = (event) => {
    setLabel(event.target.value);
  };

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
    if (property === "emailOptions") {
      setGmailData((state) => {
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
      setGmailData((state) => {
        return { ...state, [data.key]: data.value };
      });
    }
  };

  const disabledSave = useMemo(() => {
    return gmail === selectedNodes[0].data.integration;
  }, [selectedNodes, gmail]);

  useEffect(() => {
    if (gmail && gmail.oauth) {
      handlePropertyChange("emailOptions", {
        key: "from",
        value: `${gmail.emailOptions.fromName} <${gmail.oauth.email}>`, // Sender Name <sender@server.com>
        change: "value",
      });
    }
  }, [gmail]);

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
            <div className="text-base text-[#979797]">
              Connected Gmail Account
            </div>
          </div>
          <div className="flex-1 flex justify-between items-center mb-3 bg-[#3B3B3B]">
            <div className="text-base p-2">
              {gmail.oauth ? gmail.oauth.email : "Connect a Gmail Account"}
            </div>
            <div className="flex items-center">
              {oAuthList.length > 0 && (
                <CaretDropDown
                  options={oAuthList.map((s) => s.email)}
                  handleOptionChange={(value) => {
                    const oauth = oAuthList.filter((s) => s.email === value)[0];
                    handlePropertyChange("oauth", {
                      key: "oauth",
                      value: oauth,
                    });
                  }}
                />
              )}
              <a
                onClick={() => {
                  const newWindow = window.open(
                    `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/oauth-callback/gmail&scope=https://www.googleapis.com/auth/gmail.send  https://www.googleapis.com/auth/userinfo.email&response_type=code&prompt=consent&access_type=offline&state=${workspaceId}`,
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
                title="Connect to a new Gmail account"
              >
                <img
                  src={ExpandIcon}
                  alt="expand_icon"
                  className="w-4 h-4 m-2 cursor-pointer"
                />
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Subject</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="Subject"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("emailOptions", {
                    key: "subject",
                    value: event.target.value,
                    change: "value",
                  })
                }
                value={gmail.emailOptions.subject}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">From</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="from"
                variant="outlined"
                disabled
                size="small"
                className="w-[100%]"
                value={gmail.oauth?.email}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">From Name</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="fromName"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("emailOptions", {
                    key: "fromName",
                    value: event.target.value,
                    change: "value",
                  })
                }
                value={gmail.emailOptions.fromName}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Reply to</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="replyTo"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("emailOptions", {
                    key: "replyTo",
                    value: event.target.value,
                    change: "value",
                  })
                }
                value={gmail.emailOptions.replyTo}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">To</div>
          </div>
          <div className="flex-1 flex-col justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="to"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("emailOptions", {
                    key: "to",
                    value: event.target.value,
                    change: "value",
                  })
                }
                value={gmail.emailOptions.to}
              />
            </div>
            <div className="w-[100%]">
              <TextField
                placeholder="cc"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("emailOptions", {
                    key: "cc",
                    value: event.target.value,
                    change: "value",
                  })
                }
                value={gmail.emailOptions.cc}
              />
            </div>
            <div className="w-[100%]">
              <TextField
                placeholder="bcc"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("emailOptions", {
                    key: "bcc",
                    value: event.target.value,
                    change: "value",
                  })
                }
                value={gmail.emailOptions.bcc}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Body</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <DropDownMenu
              key={"channel-menu"}
              allowedMethods={["text", "html"]}
              method={gmail.emailOptions.emailType}
              onMethodChange={(channel: string) => {
                handlePropertyChange("emailOptions", {
                  key: "emailType",
                  value: channel,
                  change: "value",
                });
                handlePropertyChange("emailOptions", {
                  key: channel === "text" ? "html" : "text",
                  value: undefined,
                  change: "value",
                });
              }}
              defaultOption={"select type from list"}
            />
          </div>
          <div className="flex-1 mt-3 mb-3">
            {gmail.emailOptions.emailType === "html" ? (
              <ReactCodeMirror
                minHeight="100px"
                maxHeight="180px"
                editable
                value={gmail.emailOptions.html}
                extensions={[evalHightlighterPlugin, langs.html()]}
                defaultValue={""}
                height="180px"
                onChange={(value) =>
                  handlePropertyChange("emailOptions", {
                    key: "html",
                    value: value,
                    change: "value",
                  })
                }
                theme={atomone}
              />
            ) : (
              <ReactCodeMirror
                minHeight="100px"
                maxHeight="180px"
                editable
                value={gmail.emailOptions.text}
                extensions={[evalHightlighterPlugin]}
                defaultValue={""}
                height="180px"
                onChange={(value) =>
                  handlePropertyChange("emailOptions", {
                    key: "text",
                    value: value,
                    change: "value",
                  })
                }
                theme={atomone}
              />
            )}
          </div>
          {/* <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Attachments</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Signature</div>
          </div> */}
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

export default GmailInspector;
