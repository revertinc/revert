import React, { useMemo, useState } from "react";
import useStore from "../../store";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { atomone } from "@uiw/codemirror-theme-atomone";
import DropDownMenu from "../../common/dropdown";
import ExpandIcon from "../../assets/images/expand_icon.png";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
interface WebhookParams {
  path: string;
  method: string;
  authData: {
    method: string;
    key?: string;
    value?: string;
    userName?: string;
    password?: string;
  };
  headers: Object;
  response: string;
}

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

const WebhookInspector = () => {
  const { selectedNodes, updateNodeData } = useStore();
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const [isEditingLabel, setEditingLabel] = useState(false);
  const [webhook, setWebhook] = useState<WebhookParams>(
    selectedNodes[0].data.webhook
  );
  const [openModal, setOpenModal] = React.useState(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = (_event, reason?) => {
    console.log("Close reason", reason);
    if (reason) {
      resetWebhook();
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
    if (property === "headers" || property === "authData") {
      setWebhook((state) => {
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
      setWebhook((state) => {
        return { ...state, [data.key]: data.value };
      });
    }
  };

  const renderKeyValuePairs = (keyValueObject: Object, onChange: any) => {
    if (!keyValueObject || Object.keys(keyValueObject).length === 0) {
      return (
        <div className="flex-1 flex justify-between mb-3">
          <div className="w-[25%]">
            <TextField
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

  const saveWebhook = () => {
    updateNodeData(selectedNodes[0].id, {
      webhook: webhook,
    });
  };

  const resetWebhook = () => {
    setWebhook(selectedNodes[0].data.webhook);
  };

  const disabledSave = useMemo(() => {
    return webhook === selectedNodes[0].data.webhook;
  }, [selectedNodes, webhook]);

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
            <div className="text-base text-[#979797]">URL</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="URL"
                variant="outlined"
                size="small"
                disabled
                className="w-[100%]"
                value={
                  "https://api.buildwithforest.com/workflow/trigger/" +
                  webhook.path
                }
              />
            </div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Path</div>
          </div>
          <div className="flex-1 flex justify-between mb-3">
            <div className="w-[100%]">
              <TextField
                placeholder="URL"
                variant="outlined"
                size="small"
                className="w-[100%]"
                onChange={(event) =>
                  handlePropertyChange("path", {
                    key: "path",
                    value: event.target.value,
                  })
                }
                value={webhook.path}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Authentication</div>
          </div>
          <div className="flex-1 flex justify-between items-center mb-3 bg-[#2E2E2E]">
            <div className="text-base text-[#979797] p-2">
              {webhook.authData.method === "headerAuth"
                ? "Header authentication"
                : "None"}
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
                Configure Authentication
              </Typography>
              <div className="flex flex-col justify-between">
                <div className="flex-1 flex-col justify-center items-center w-[80%] h-[400px] m-[70px]">
                  <div className="flex-1 flex justify-between items-center">
                    <p className="flex-1">Type</p>
                    <div className="flex-1">
                      <DropDownMenu
                        allowedMethods={{
                          0: "None",
                          1: "headerAuth",
                        }}
                        method={webhook.authData.method}
                        onMethodChange={(method: string) => {
                          console.log("Method chaned to", method);
                          handlePropertyChange("authData", {
                            key: "method",
                            value: method,
                            change: "value",
                          });
                        }}
                      />
                    </div>
                  </div>
                  {webhook.authData.method === "headerAuth" && (
                    <>
                      <div className="flex-1 flex justify-center items-center">
                        <p className="flex-1">Key</p>
                        <div className="flex-1">
                          <TextField
                            key={"key"}
                            placeholder="Value"
                            variant="outlined"
                            size="small"
                            className="w-[100%]"
                            value={webhook.authData.key}
                            onChange={(evt) => {
                              handlePropertyChange("authData", {
                                key: "key",
                                value: evt.target.value,
                                change: "value",
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1  flex justify-center items-center">
                        <p className="flex-1">Value</p>
                        <div className="flex-1">
                          <TextField
                            key={"value"}
                            placeholder="Value"
                            variant="outlined"
                            size="small"
                            className="w-[100%]"
                            value={webhook.authData.value}
                            onChange={(evt) => {
                              handlePropertyChange("authData", {
                                key: "value",
                                value: evt.target.value,
                                change: "value",
                              });
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  className="self-end"
                  variant="contained"
                  disabled={webhook === selectedNodes[0].data.webhook}
                  onClick={handleCloseModal}
                >
                  Save
                </Button>
              </div>
            </Box>
          </Modal>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">HTTP Method</div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="w-[25%]">
              <DropDownMenu
                allowedMethods={{
                  0: "GET",
                  1: "POST",
                }}
                method={webhook.method}
                onMethodChange={(method: string) => {
                  handlePropertyChange("method", {
                    key: "method",
                    value: method,
                  });
                }}
              />
            </div>
          </div>
          <div className="flex-1 flex justify-start mb-3">
            <div className="text-base text-[#979797]">Response Headers</div>
          </div>
          {renderKeyValuePairs(webhook.headers, (data: any) => {
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
          <div className="flex-1 flex justify-start mb-8">
            <div className="text-base text-[#979797]">Response Body</div>
          </div>
          <div className="flex-1">
            <ReactCodeMirror
              maxHeight="550px"
              editable
              value={webhook.response}
              extensions={[evalHightlighterPlugin, javascript({ jsx: true })]}
              defaultValue={""}
              height="180px"
              onChange={(value) =>
                handlePropertyChange("response", {
                  key: "response",
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
        <Button variant="outlined" onClick={resetWebhook}>
          Reset
        </Button>
        <Button
          variant="contained"
          disabled={disabledSave}
          onClick={saveWebhook}
        >
          Save
        </Button>
      </div>
    </>
  );
};

export default WebhookInspector;
