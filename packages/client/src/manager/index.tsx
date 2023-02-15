import React from "react";
import Box from "@mui/material/Box";
import Navbar from "../navbar";
import { Button, Tab, Tabs, TextField, Typography } from "@mui/material";
import DropdownMenu from "../common/dropdown";
import { deployWorkflow, updateDeploymentStatus } from "../api";
import useStore, { useAppStore } from "../store";

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
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const ManageWorkflow = (props) => {
  const [value, setValue] = React.useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const setCurrentWorkflowName = useAppStore(
    (state) => state.setCurrentWorkflowName
  );
  const currentWorkflowId = useAppStore((state) => state.currentWorkflowId)!;
  const workflowName = useAppStore((state) => state.currentWorkflowName);
  const workflowData = useAppStore((state) => state.currentWorkflowData);
  const workspaceId = useAppStore((state) => state.workspaceId);

  const [env, setEnv] = React.useState(workflowData?.env);
  const { nodes, edges } = useStore();
  return (
    <>
      <Navbar isManage={true} />
      <Box
        component="div"
        sx={{
          display: "flex",
          padding: "0 2rem",
          paddingTop: "60px",
        }}
      >
        <Box
          component="div"
          style={{
            marginLeft: 104,
            marginRight: 104,
            marginTop: 53,
            width: "100%",
          }}
        >
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "#B5B5B5",
            }}
          >
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab
                label="General"
                style={{
                  color: "#000",
                  textTransform: "capitalize",
                  fontSize: 18,
                }}
              />
              <Tab
                label="Deployment"
                style={{
                  color: "#000",
                  textTransform: "capitalize",
                  fontSize: 18,
                }}
              />
              {/* 
              <Tab
                label="Analytics"
                style={{
                  color: "#000",
                  textTransform: "capitalize",
                  fontSize: 18,
                }}
              /> */}
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            <div className="relative">
              <div className="flex flex-col w-1/4 text-[#000]">
                <span className="mt-[40px] mb-[30px] text-[18px] text-[#3E3E3E]">
                  Workflow Name
                </span>
                <TextField
                  fullWidth
                  placeholder="Unique worflow name"
                  variant="outlined"
                  InputProps={{
                    style: {
                      color: "#000",
                      marginBottom: 38,
                      height: 36,
                      border: "1px solid #AAAAAA",
                    },
                  }}
                  value={workflowName}
                  onChange={(evt) => setCurrentWorkflowName(evt.target.value)}
                />
                <span className="mb-[30px] text-[18px] text-[#3E3E3E]">
                  Environment
                </span>
                <DropdownMenu
                  allowedMethods={{
                    0: "staging",
                    1: "prod",
                  }}
                  method={env}
                  onMethodChange={(env: string) => {
                    setEnv(env);
                  }}
                  color={"inherit"}
                />
              </div>
              <div
                style={{
                  textDecoration: "none",
                  position: "absolute",
                  top: 40,
                  right: 10,
                  cursor: "pointer",
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => {
                    deployWorkflow({
                      workflowName: workflowName,
                      workspaceId: workspaceId,
                      nodes: nodes,
                      edges: edges,
                      workflowId: currentWorkflowId,
                      env: env,
                      deploymentStatus:
                        workflowData?.deploymentStatus || "live",
                      successMessage: "Changes saved",
                    });
                  }}
                >
                  Deploy changes
                </Button>
              </div>
            </div>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <div className="flex flex-col text-[#000]">
              <span className="mt-[40px] text-[18px] text-[#3E3E3E]">
                Deploy with Forest Cloud
              </span>
              <span className="mb-[30px] mt-[13px]">
                Deploying means that your workflow will start executing. We
                remommend pausing the executions before making any changes to
                the workflow
              </span>
              <div
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  background: "#00949D",
                  padding: "7px 45px",
                  borderRadius: 4,
                  width: 140,
                  cursor: "pointer",
                }}
                onClick={() => {
                  updateDeploymentStatus(currentWorkflowId, "live");
                }}
              >
                Deploy
              </div>
              <span className="mt-[40px] text-[18px] text-[#3E3E3E]">
                Pause the workflow
              </span>
              <span className="mb-[30px] mt-[13px]">
                Pausing a workflow means that the workflow will not execute
                until resumed again. On resume, it will execute the most recent
                published version of the workflow. We remommend pausing the
                executions before making any changes to the workflow.
              </span>
              <div
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  background: "#D79128",
                  padding: "7px 45px",
                  borderRadius: 4,
                  width: 140,
                  cursor: "pointer",
                }}
                onClick={() => {
                  updateDeploymentStatus(currentWorkflowId, "paused");
                }}
              >
                Pause
              </div>
              <span className="mt-[40px] text-[18px] text-[#3E3E3E]">
                Archive the workflow
              </span>
              <span className="mb-[30px] mt-[13px]">
                Archiving ensure the workflow is no longer live and it doesn’t
                execute until published again. Archiving will still retain all
                excution history
              </span>
              <div
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  background: "#D72828",
                  padding: "7px 45px",
                  borderRadius: 4,
                  width: 140,
                  cursor: "pointer",
                }}
                onClick={() => {
                  updateDeploymentStatus(currentWorkflowId, "archived");
                }}
              >
                Archive
              </div>
            </div>
          </TabPanel>
          {/* 
          <TabPanel value={value} index={2}>
            Item Three
          </TabPanel> */}
        </Box>
      </Box>
    </>
  );
};

export default ManageWorkflow;
