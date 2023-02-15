import React, { useEffect, useMemo, useRef, useState } from "react";
import useStore, { useNodeExecutionStore } from "../../store";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogProps,
  IconButton,
  Modal,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { atomone } from "@uiw/codemirror-theme-atomone";
import DropDownMenu from "../../common/dropdown";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
import ExpandIcon from "../../assets/images/expand_icon.png";

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

interface RequestParams {
  method: string;
  url: string;
  headers: Object;
  queryParams: Object;
  body: string | undefined;
  authMethod: string;
  authData: Object;
}

const ApiInspector = () => {
  const { selectedNodes, updateNodeData } = useStore();
  const [isEditingLabel, setEditingLabel] = useState(false);
  const [request, setRequest] = useState<RequestParams>(
    selectedNodes[0].data.request
  );
  const resetRequest = () => {
    setRequest(selectedNodes[0].data.request);
  };

  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const parentRef = useRef<any>();
  const executionState = useNodeExecutionStore(
    (state) => state.data[selectedNodes[0].id]
  );
  const seen = useNodeExecutionStore(
    (state) => state.seenMap[selectedNodes[0].id]
  );
  const setSeen = useNodeExecutionStore((state) => state.setSeen);
  const [openModal, setOpenModal] = React.useState(false);
  const [referenceFields, setReferenceFields] = React.useState(
    "{{refundAPI.response}}"
  );
  const [useStub, setUseStub] = React.useState(false);
  const [stub, setStub] = React.useState(`{
	"message": "ok",
	"response": {
		"data": {
			"arrays": [1, 2, 3]
		}
	}
}`);
  const handleOpenModal = () => setOpenModal(true);

  const handleCloseModal = (_event, reason?) => {
    if (reason) {
    }

    setOpenModal(false);
  };

  const [open, setOpen] = React.useState(false);

  const [scroll, setScroll] = React.useState<DialogProps["scroll"]>("paper");

  const handleClickOpen = (scrollType: DialogProps["scroll"]) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
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

  const saveRequest = () => {
    updateNodeData(selectedNodes[0].id, {
      request: request,
    });
  };
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const handleLabelChange = (event) => {
    setLabel(event.target.value);
  };

  useEffect(() => {
    if (!!request.queryParams && request.url) {
      try {
        const url = new URL(request.url);
        for (let key of Array.from(url.searchParams.keys())) {
          url.searchParams.delete(key);
        }
        Object.keys(request.queryParams).map((k) => {
          url.searchParams.set(k, request.queryParams[k]);
        });
        handlePropertyChange("url", {
          key: "url",
          value: decodeURI(url.toString()),
        });
      } catch (error) {}
    }
  }, [request.queryParams]);

  const handlePropertyChange = (property: string, data: any) => {
    if (
      property === "headers" ||
      property === "queryParams" ||
      property === "authData"
    ) {
      setRequest((state) => {
        let updated = state[property];
        if (!updated) updated = {};
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
      setRequest((state) => {
        return { ...state, [data.key]: data.value };
      });
    }
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

  const disabledSave = useMemo(() => {
    return request === selectedNodes[0].data.request;
  }, [selectedNodes, request]);

  const renderOAuth1Options = (keyValueObject: Object, onChange: any) => {
    return Object.entries(keyValueObject).map(
      ([key, value], index) =>
        (key !== "" || value !== undefined) && (
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-1/2">
              <TextField
                key={index}
                placeholder="Key"
                variant="outlined"
                size="small"
                disabled
                value={key}
              />
            </div>
            <div className="w-1/2 ml-2">
              <TextField
                key={index}
                placeholder="Value"
                variant="outlined"
                size="small"
                className="w-[100%]"
                value={value}
                onChange={(e) => {
                  onChange({
                    change: "value",
                    key: key,
                    value: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        )
    );
  };

  const renderKeyValuePairs = (keyValueObject: Object, onChange: any) => {
    if (!keyValueObject || Object.keys(keyValueObject).length === 0) {
      return (
        <div className="flex-1 flex justify-between mb-3">
          <div className="w-[25%]">
            <TextField
              key="empty-key"
              placeholder="Key"
              variant="outlined"
              size="small"
              onChange={(e) => {
                onChange({ change: "key", key: "", value: e.target.value });
              }}
            />
          </div>
          <div className="w-[72%]">
            <TextField
              key="empty-value"
              placeholder="Value"
              variant="outlined"
              size="small"
              className="w-[100%]"
              onChange={(e) => {
                onChange({ change: "value", key: "", value: e.target.value });
              }}
            />
          </div>
          <IconButton>
            <CloseIcon
              fontSize="small"
              onClick={() => {
                onChange({
                  change: "delete",
                  key: "",
                });
              }}
            />
          </IconButton>
        </div>
      );
    } else {
      return Object.entries(keyValueObject).map(
        ([key, value], index) =>
          (key !== "" || value !== undefined) && (
            <div className="flex-1 flex justify-between mb-3">
              <div className="w-[25%]">
                <TextField
                  key={index}
                  placeholder="Key"
                  variant="outlined"
                  size="small"
                  value={key}
                  onChange={(e) => {
                    onChange({
                      change: "key",
                      key: key,
                      value: e.target.value,
                    });
                  }}
                />
              </div>
              <div className="w-[72%]">
                <TextField
                  key={index}
                  placeholder="Value"
                  variant="outlined"
                  size="small"
                  className="w-[100%]"
                  value={value}
                  onChange={(e) => {
                    onChange({
                      change: "value",
                      key: key,
                      value: e.target.value,
                    });
                  }}
                />
              </div>
              <IconButton>
                <CloseIcon
                  fontSize="small"
                  onClick={() => {
                    onChange({
                      change: "delete",
                      key: key,
                    });
                  }}
                />
              </IconButton>
            </div>
          )
      );
    }
  };

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
          {/* <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Input</div>
          </div>
          <div className="flex-1 flex justify-between items-center mb-3 bg-[#2E2E2E]">
            <div className="text-base text-[#979797] p-2">
              {referenceFields}
            </div>
            <img
              onClick={handleOpenModal}
              src={ExpandIcon}
              alt="expand_icon"
              className="w-4 h-4 m-2 cursor-pointer"
            />
          </div> */}
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
                component="h6"
                className="text-[#fff]"
              >
                Input
              </Typography>
              <div className="flex flex-col">
                <div className="mt-3 mb-3"> Reference Fields </div>
                <TextField
                  placeholder="Reference Fields"
                  variant="outlined"
                  size="small"
                  value={referenceFields}
                />
                <div className="flex-1 mt-3 mb-3">
                  <Checkbox /> Use stub data
                </div>
                <div className="mb-3">
                  <ReactCodeMirror
                    maxHeight="550px"
                    editable
                    value={stub}
                    extensions={[
                      evalHightlighterPlugin,
                      javascript({ jsx: true }),
                    ]}
                    defaultValue={stub}
                    height="180px"
                    theme={atomone}
                  />
                </div>
                <Button
                  className="self-end"
                  variant="contained"
                  onClick={handleCloseModal}
                >
                  Save
                </Button>
              </div>
            </Box>
          </Modal>
          <div className="flex-1 flex justify-between mb-3">
            <div className="text-base text-[#979797]">Action type</div>
            <div className="text-base text-[#979797]">URL</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[25%]">
              <DropDownMenu
                allowedMethods={{
                  0: "GET",
                  1: "POST",
                  2: "PUT",
                  3: "DELETE",
                }}
                method={request.method}
                onMethodChange={(method: string) => {
                  handlePropertyChange("method", {
                    key: "method",
                    value: method,
                  });
                }}
              />
            </div>
            <div className="w-[72%]">
              <TextField
                placeholder="URL"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("url", {
                    key: "url",
                    value: event.target.value,
                  })
                }
                value={request.url}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Url Parametres</div>
          </div>
          {renderKeyValuePairs(request.queryParams, (data: any) => {
            handlePropertyChange("queryParams", data);
          })}
          <div className="flex-1 flex justify-start mt-4 mb-4">
            <div
              className="text-primary text-sm cursor-pointer"
              onClick={() => {
                handlePropertyChange("queryParams", {
                  change: "value",
                  key: "",
                  value: "",
                });
              }}
            >
              +Add new
            </div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Headers</div>
          </div>
          {renderKeyValuePairs(request.headers, (data: any) => {
            handlePropertyChange("headers", data);
          })}
          <div className="flex-1 flex justify-start mt-4 mb-4">
            <div
              className="text-primary text-sm cursor-pointer"
              onClick={() => {
                handlePropertyChange("headers", {
                  change: "value",
                  key: "",
                  value: "",
                });
              }}
            >
              +Add new
            </div>
          </div>
          <div className="flex-1 flex justify-between items-center mb-3">
            <div className="text-base text-[#979797]">Authorization</div>
            <div className="text-base text-[#979797]">
              <DropDownMenu
                allowedMethods={{
                  0: "none",
                  1: "OAuth1.0",
                }}
                method={request.authMethod}
                onMethodChange={(method: string) => {
                  handlePropertyChange("authMethod", {
                    key: "authMethod",
                    value: method,
                  });
                  if (method === "none") {
                    setRequest((state) => {
                      return {
                        ...state,
                        authData: {
                          consumerKey: "<consumerKey>",
                          consumerSecret: "<consumerSecret>",
                          tokenKey: "<tokenKey>",
                          tokenSecret: "<tokenSecret>",
                        },
                      };
                    });
                  }
                }}
              />
            </div>
          </div>
          {request.authMethod === "OAuth1.0" &&
            renderOAuth1Options(request.authData, (data: any) => {
              handlePropertyChange("authData", data);
            })}
          <div className="flex-1 flex justify-start mb-8">
            <div className="text-base text-[#979797]">Body</div>
          </div>
          <div className="flex-1 mb-8">
            <ReactCodeMirror
              maxHeight="550px"
              editable
              value={request.body}
              extensions={[evalHightlighterPlugin, javascript({ jsx: true })]}
              defaultValue={request.body}
              height="180px"
              onChange={(value) =>
                handlePropertyChange("body", {
                  key: "body",
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
        <Button variant="outlined" onClick={resetRequest}>
          Reset
        </Button>
        <Button
          variant="contained"
          disabled={disabledSave}
          onClick={saveRequest}
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
                  extensions={[
                    evalHightlighterPlugin,
                    javascript({ jsx: true }),
                  ]}
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

export default ApiInspector;
