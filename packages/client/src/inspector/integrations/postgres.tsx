import React, { useEffect, useMemo, useState } from "react";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Modal,
  Typography,
  DialogContentText,
  DialogProps,
  Tab,
  Tabs,
} from "@mui/material";
import ReactCodeMirror from "@uiw/react-codemirror";
import useStore, { useNodeExecutionStore } from "../../store";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
import { sql } from "@codemirror/lang-sql";
import { atomone } from "@uiw/codemirror-theme-atomone";
import ExpandIcon from "../../assets/images/expand_icon.png";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { javascript } from "@codemirror/lang-javascript";

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 1085,
  bgcolor: "#262626",
  border: "1px solid #00949D",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  color: "#979797",
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

const PostgresInspector = () => {
  const { selectedNodes, updateNodeData } = useStore();
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const [dbData, setDbData] = useState(selectedNodes[0].data.integration);
  const [isEditingLabel, setEditingLabel] = useState(false);
  const [openModal, setOpenModal] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const executionState = useNodeExecutionStore(
    (state) => state.data[selectedNodes[0].id]
  );
  const seen = useNodeExecutionStore(
    (state) => state.seenMap[selectedNodes[0].id]
  );
  const setSeen = useNodeExecutionStore((state) => state.setSeen);
  const [value, setValue] = React.useState(0);
  const handleOpenModal = () => setOpenModal(true);
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
  const handleCloseModal = (event, reason?) => {
    event.preventDefault();
    event.stopPropagation();
    if (reason) {
      resetPostgres();
    }

    setOpenModal(false);
  };

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
    if (property === "dbConfig" || property === "authData") {
      setDbData((state) => {
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
      setDbData((state) => {
        return { ...state, [data.key]: data.value };
      });
    }
  };

  const savePostgresData = () => {
    updateNodeData(selectedNodes[0].id, {
      integration: dbData,
    });
  };

  const resetPostgres = () => {
    setDbData(selectedNodes[0].data.integration);
  };

  const disabledSave = useMemo(() => {
    return dbData === selectedNodes[0].data.integration;
  }, [selectedNodes, dbData]);

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
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Configuration</div>
          </div>
          <div className="flex-1 flex justify-between items-center mb-3 bg-[#2C3842]">
            <div className="text-base text-[#979797] p-2">
              {dbData.dbConfig.nickName}
            </div>
            <img
              onClick={handleOpenModal}
              src={ExpandIcon}
              alt="expand_icon"
              className="w-4 h-4 m-2 cursor-pointer"
            />
          </div>
          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
              <Typography
                id="modal-modal-title"
                variant="h6"
                component="h2"
                className="text-[#fff]"
              >
                Configure Postgres
              </Typography>
              <div className="flex justify-between">
                <div className="flex-1 flex-col justify-between">
                  <div className="flex-1 flex-col justify-center items-center w-[85%] h-[400px] mt-[70px] ml-[70px] mb-[70px]">
                    <div className="flex-1 flex justify-center items-center">
                      <p className="flex-1">Name</p>
                      <div className="flex-1">
                        <TextField
                          key={"name"}
                          placeholder=""
                          variant="outlined"
                          size="small"
                          className="w-[100%]"
                          value={dbData.dbConfig.nickName}
                          onChange={(evt) => {
                            handlePropertyChange("dbConfig", {
                              key: "nickName",
                              value: evt.target.value,
                              change: "value",
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1  flex justify-center items-center">
                      <p className="flex-1">Host</p>
                      <div className="flex-1">
                        <TextField
                          key={"host"}
                          placeholder=""
                          variant="outlined"
                          size="small"
                          className="w-[100%]"
                          value={dbData.dbConfig.host}
                          onChange={(evt) => {
                            handlePropertyChange("dbConfig", {
                              key: "host",
                              value: evt.target.value,
                              change: "value",
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1  flex justify-center items-center">
                      <p className="flex-1">Port</p>
                      <div className="flex-1">
                        <TextField
                          key={"Port"}
                          placeholder=""
                          variant="outlined"
                          size="small"
                          className="w-[100%]"
                          value={dbData.dbConfig.port}
                          onChange={(evt) => {
                            handlePropertyChange("dbConfig", {
                              key: "port",
                              value: evt.target.value,
                              change: "value",
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1  flex justify-center items-center">
                      <p className="flex-1">Database name</p>
                      <div className="flex-1">
                        <TextField
                          key={"database"}
                          placeholder=""
                          variant="outlined"
                          size="small"
                          className="w-[100%]"
                          value={dbData.dbConfig.database}
                          onChange={(evt) => {
                            handlePropertyChange("dbConfig", {
                              key: "database",
                              value: evt.target.value,
                              change: "value",
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1  flex justify-center items-center">
                      <p className="flex-1">User</p>
                      <div className="flex-1">
                        <TextField
                          key={"user"}
                          placeholder=""
                          variant="outlined"
                          size="small"
                          className="w-[100%]"
                          value={dbData.authData.user}
                          onChange={(evt) => {
                            handlePropertyChange("authData", {
                              key: "user",
                              value: evt.target.value,
                              change: "value",
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1  flex justify-center items-center">
                      <p className="flex-1">Password</p>
                      <div className="flex-1 flex relative">
                        <TextField
                          key={"password"}
                          type={showPassword ? "text" : "password"}
                          placeholder=""
                          variant="outlined"
                          size="small"
                          className="w-[100%]"
                          value={dbData.authData.password}
                          onChange={(evt) => {
                            handlePropertyChange("authData", {
                              key: "password",
                              value: evt.target.value,
                              change: "value",
                            });
                          }}
                        />
                        <IconButton
                          title="Show password"
                          style={{
                            position: "absolute",
                            right: -42,
                          }}
                        >
                          {!showPassword ? (
                            <VisibilityIcon
                              onClick={() => setShowPassword((state) => !state)}
                            />
                          ) : (
                            <VisibilityOffIcon
                              onClick={() => setShowPassword((state) => !state)}
                            />
                          )}
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className=" flex-col bg-[#2C3842] p-3 mb-3 text-[#D9D9D9] w-[261px] h-[192px] mt-[70px] text-[14px]">
                  Whitelist IPs <br /> <br />
                  Please whitelist our our IP addresses for Forest to access the
                  db: <br />
                  <br />
                  52.87.237.227
                </div>
              </div>
              <div className="absolute bottom-[48px] right-[48px]">
                <Button
                  variant="contained"
                  disabled={dbData === selectedNodes[0].data.integration}
                  onClick={handleCloseModal}
                >
                  Save
                </Button>
              </div>
            </Box>
          </Modal>
          <div className="flex-1 flex justify-start mb-8">
            <div className="text-base text-[#979797]">Query</div>
          </div>
          <div className="flex-1">
            <ReactCodeMirror
              maxHeight="550px"
              editable
              value={dbData.query}
              extensions={[evalHightlighterPlugin, sql()]}
              defaultValue={""}
              height="180px"
              onChange={(value) =>
                handlePropertyChange("query", {
                  key: "query",
                  value: value,
                })
              }
              theme={atomone}
            />
          </div>
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
        <Button variant="outlined" onClick={resetPostgres}>
          Reset
        </Button>
        <Button
          variant="contained"
          disabled={disabledSave}
          onClick={savePostgresData}
        >
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

export default PostgresInspector;
