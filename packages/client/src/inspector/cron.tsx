import React, { useEffect, useState } from "react";
import useStore from "../store";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { IconButton } from "@mui/material";
import { isCronValid } from "../helpers/cronvalidator";
import cronstrue from "cronstrue";
import ExpandIcon from "../assets/images/expand_icon.png";

export function FullWidthTextField({ label, value, setProperty, index }) {
  const [currentValue, setCurrentValue] = useState(
    index !== null ? value[index] : value
  );
  useEffect(() => {
    setCurrentValue(index !== null ? value[index] : value);
  }, [value, index]);

  const onTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      setCurrentValue(event.target.value);
      if (label === "Timezone") setProperty(event.target.value);
      else {
        setProperty(index, event.target.value);
      }
    } else {
      setCurrentValue("*");
      if (label !== "Timezone") setProperty(index, "*");
      else setProperty("Asia/Tokyo");
    }
  };
  return (
    <Box
      sx={{
        maxWidth: "100%",
        marginTop: 2,
      }}
    >
      <TextField
        onChange={onTextChange}
        fullWidth
        label={label}
        id={label}
        InputLabelProps={{
          color: "primary",
        }}
        defaultValue={value}
        value={currentValue}
      />
    </Box>
  );
}

const CronInspector = () => {
  const { selectedNodes, updateNodeData } = useStore();
  const [isEditingLabel, setEditingLabel] = useState(false);
  const [label, setLabel] = useState(selectedNodes[0].data.label);
  const [timeZone, setTimeZone] = useState(selectedNodes[0].data.timeZone);
  const [cronString, setCronString] = useState(
    selectedNodes[0].data.cronString
  );
  const [validCron, setIsValidCron] = useState(true);
  const [humanizedCron, setHumanizedCron] = useState(
    selectedNodes[0].data.humanReadable
  );
  const [cronSplit, setCronSplit] = useState(cronString.split(" "));
  const setCronIndexString = (index: number, value: string) => {
    const currentSplit = cronString.split(" ");
    currentSplit[index] = value;
    setCronString(currentSplit.join(" "));
  };

  const resetValues = () => {
    setTimeZone(selectedNodes[0].data.timeZone);
    setCronString(selectedNodes[0].data.cronString);
  };

  const updateNode = () => {
    if (validCron)
      updateNodeData(selectedNodes[0].id, {
        label: label,
        cronString: cronString,
        timeZone: timeZone,
        humanReadable: humanizedCron,
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

  useEffect(() => {
    setCronSplit(cronString.split(" "));
    setIsValidCron(isCronValid(cronString));
    setHumanizedCron(
      isCronValid(cronString)
        ? cronstrue.toString(cronString)
        : "Cron not valid"
    );
  }, [cronString]);

  return (
    <div onClick={(e) => e.preventDefault()}>
      <div className="p-5">
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
        <FullWidthTextField
          value={timeZone}
          label={"Timezone"}
          setProperty={setTimeZone}
          index={null}
        />
        <FullWidthTextField
          key={"Minutes"}
          value={cronSplit}
          label={"Minutes"}
          setProperty={setCronIndexString}
          index={0}
        />
        <FullWidthTextField
          key={"Hours"}
          value={cronSplit}
          label={"Hours"}
          setProperty={setCronIndexString}
          index={1}
        />
        <FullWidthTextField
          key={"Day of the month"}
          value={cronSplit}
          label={"Day of the month"}
          setProperty={setCronIndexString}
          index={2}
        />
        <FullWidthTextField
          key={"Month"}
          value={cronSplit}
          label={"Month"}
          setProperty={setCronIndexString}
          index={3}
        />
        <FullWidthTextField
          key={"Day of week"}
          value={cronSplit}
          label={"Day of week"}
          setProperty={setCronIndexString}
          index={4}
        />
        <br />
        <div
          style={{
            background: "#2C3842",
            textAlign: "center",
            padding: 8,
            fontSize: 14,
            color: "white",
          }}
        >
          {humanizedCron}{" "}
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
        <Button variant="outlined" onClick={resetValues}>
          Reset
        </Button>
        <Button variant="contained" disabled={!validCron} onClick={updateNode}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default CronInspector;
