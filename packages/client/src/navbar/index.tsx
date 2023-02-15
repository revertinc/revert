import React, { useMemo } from "react";
import Logo from "../assets/images/forest_logo.png";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { useAppStore } from "../store";
import { Link, useNavigate } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import CreateIcon from "@mui/icons-material/Create";
import ForkIcon from "../assets/icons/ForkIcon";
import { BASE_API_URL } from "../constants";
import toast from "react-hot-toast";

const Navbar = (props) => {
  const workflowId = useAppStore((state) => state.currentWorkflowId);
  const workspaceId = useAppStore((state) => state.workspaceId);
  const workflowName = useAppStore((state) => state.currentWorkflowName);
  const navigate = useNavigate();
  const currentWorkflowData = useAppStore((state) => state.currentWorkflowData);
  const isSameWorkspace = useMemo(() => {
    return (
      currentWorkflowData === undefined ||
      currentWorkflowData?.workspaceId === workspaceId
    );
  }, [workspaceId, currentWorkflowData]);

  return (
    <div id="top-navbar">
      <div className="flex">
        <Link to="/" className="flex items-center">
          <img
            src={Logo}
            alt="forest_logo"
            className="w-[187px] h-[30px] ml-[24px] cursor-pointer mt-4 mb-3"
          />
        </Link>
        <h3 className="text-[#fff] text-[20px] ml-[-37px] mb-3 mt-4 flex items-center">
          |
          <p className=" text-[16px] ml-5">
            {workflowName || "Untitled workflow"}
          </p>
        </h3>
      </div>
      <div className="flex justify-center items-center">
        {props.isManage ? (
          <Link to={{ pathname: "/workflow/" + workflowId }}>
            <div className="control-button-secondary">
              <CreateIcon
                style={{
                  fontSize: 16,
                  marginRight: 6,
                  color: "#00949D",
                }}
              />
              Editor
            </div>
          </Link>
        ) : (
          <>
            {workspaceId && currentWorkflowData && (
              <div
                title="Fork / Copy workflow into current workspace"
                className="control-button-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: isSameWorkspace ? -10 : 16,
                }}
                onClick={() => {
                  const headers = new Headers();
                  headers.append("Content-Type", "application/json");
                  const body = JSON.stringify({
                    workspaceId: workspaceId,
                    id: workflowId,
                  });
                  const requestOptions = {
                    method: "POST",
                    headers: headers,
                    body: body,
                  };
                  fetch(`${BASE_API_URL}/workflow/fork`, requestOptions)
                    .then((response) => response.json())
                    .then((result) => {
                      console.log(result);
                      if (result.newWorkflowId) {
                        toast.success("Workflow successfully forked!");
                        navigate("/workflow/" + result.newWorkflowId);
                      }
                    })
                    .catch((error) => {
                      console.log("error", error);
                      toast.error("Workflow could not be forked.");
                    });
                }}
              >
                <ForkIcon />
                <span className="ml-1">Fork</span>
              </div>
            )}
            {isSameWorkspace && (
              <Link to={{ pathname: "/manage/" + workflowId }}>
                <div className="control-button">
                  <SettingsIcon
                    style={{
                      fontSize: 16,
                      marginRight: 4,
                    }}
                  />
                  Manage
                </div>
              </Link>
            )}
          </>
        )}
        <SignedIn>
          <div className="mr-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
    </div>
  );
};

export default Navbar;
