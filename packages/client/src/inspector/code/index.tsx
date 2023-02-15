import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import useStore, { useNodeExecutionStore } from "../../store";
import React, { useMemo, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import {
  IconButton,
  DialogProps,
  Badge,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
  DialogContentText,
  Tab,
  Tabs,
} from "@mui/material";
import { atomone } from "@uiw/codemirror-theme-atomone";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
import ExpandIcon from "../../assets/images/expand_icon.png";

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

const CodeInspector = ({ language }) => {
  const { selectedNodes, updateNodeData } = useStore();
  const [code, setCode] = useState(selectedNodes[0].data.code);
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const [isEditingLabel, setEditingLabel] = useState(false);
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
  const onChange = (value: string) => {
    setCode(value);
  };
  const resetCode = () => {
    setCode(selectedNodes[0].data.code);
  };
  const saveCode = () => {
    updateNodeData(selectedNodes[0].id, {
      code: code,
    });
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

  const disabledSave = useMemo(() => {
    return code === selectedNodes[0].data.code;
  }, [selectedNodes, code]);

  if (language === "JS") {
    return (
      <>
        <div>
          <div className="pt-5 pl-5 pr-5">
            <div className="flex justify-between items-center mb-10">
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
          </div>
          <div
            style={{
              background: "#2C3842",
              padding: 8,
              fontSize: 14,
            }}
          >
            <p className="ml-5 text-[#C5C4C4]">Code</p>
          </div>
          <ReactCodeMirror
            maxHeight="550px"
            className="m-5"
            editable
            value={code}
            extensions={[evalHightlighterPlugin, javascript({ jsx: true })]}
            defaultValue={code}
            onChange={onChange}
            theme={atomone}
          />
          {/* <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            padding: 14,
          }}
        >
          <Button variant="outlined" onClick={resetCode}>
            Reset
          </Button>
          <Button
            variant="contained"
            disabled={code === selectedNodes[0].data.code}
            onClick={saveCode}
          >
            Save
          </Button>
        </div> */}
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
              <img
                src={ExpandIcon}
                alt="expand_icon"
                className="w-4 h-4 m-2 "
              />
            </div>
          </Badge>
          <Button variant="outlined" onClick={resetCode}>
            Reset
          </Button>
          <Button
            variant="contained"
            disabled={disabledSave}
            onClick={saveCode}
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
  } else {
    return <div>Unrecognised language</div>;
  }
};

export default CodeInspector;
