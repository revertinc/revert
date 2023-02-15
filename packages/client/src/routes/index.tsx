import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignUp,
  ClerkProvider,
  useUser,
} from "@clerk/clerk-react";
import React, { useEffect, useMemo } from "react";
import Flow from "../canvas";
import Inspector from "../inspector";
import Navbar from "../navbar";
import Home from "../home";
import { BASE_API_URL } from "../constants";
import useStore, { useAppStore } from "../store";
import { OAuthCallback } from "../common/oauth";
import { nanoid } from "nanoid";
import ManageWorkflow from "../manager";
import { Toaster } from "react-hot-toast";

const App = () => {
  const params = useParams();
  const navigate = useNavigate();
  const workspaceId = useAppStore((state) => state.workspaceId);
  const setCurrentWorkflowId = useAppStore(
    (state) => state.setCurrentWorkflowId
  );
  const { initGraph } = useStore();
  const setCurrentWorkflowName = useAppStore(
    (state) => state.setCurrentWorkflowName
  );
  const setCurrentWorkflowData = useAppStore(
    (state) => state.setCurrentWorkflowData
  );
  const currentWorkflowData = useAppStore((state) => state.currentWorkflowData);
  const { user } = useUser();
  const setWorkspaceData = useAppStore((state) => state.setWorkspaceData);
  const setWorkspaceId = useAppStore((state: any) => state.setWorkspaceId);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const isSameWorkspace = useMemo(() => {
    return (
      currentWorkflowData === undefined ||
      currentWorkflowData?.workspaceId === workspaceId
    );
  }, [workspaceId, currentWorkflowData]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
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
            setWorkspaceId(result.workspaceId);
          } else if (result.error === "waitlist_error") {
          }
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (params.workflowId !== "new") {
      fetch(`${BASE_API_URL}/workflow/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: String(params.workflowId),
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          // console.log("workflow data", result);
          setCurrentWorkflowName(result.data.name);
          setCurrentWorkflowId(String(params.workflowId));
          initGraph(result.data.nodesUi, result.data.edges);
          setCurrentWorkflowData(result.data);
        })
        .catch((err) => console.error(err));
    } else {
      const newWorkflowId = `ui-${workspaceId}-` + nanoid();
      setCurrentWorkflowId(newWorkflowId);
      const workflowName = "Untitled Workflow";
      setCurrentWorkflowName(workflowName);
      initGraph([], []);
      setCurrentWorkflowData(undefined);
      navigate("/workflow/" + newWorkflowId);
    }
  }, [params.workflowId, setCurrentWorkflowId, workspaceId]);

  return (
    <div className="App">
      <Navbar />
      <div id="canvas">
        <Flow />
      </div>
      {isSameWorkspace && <Inspector />}
    </div>
  );
};

export function RouterComponent() {
  const navigate = useNavigate();
  const frontendApi = process.env.REACT_APP_CLERK_API_URL;
  return (
    <ClerkProvider frontendApi={frontendApi} navigate={(to) => navigate(to)}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          success: {
            style: {
              background: "#00949D",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#00949D",
            },
          },
          error: {
            style: {
              background: "#D72828",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#D72828",
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedOut>
                <div className="flex items-center justify-center h-[100%]">
                  <SignUp
                    afterSignUpUrl={"/"}
                    appearance={{
                      elements: {
                        formButtonPrimary: "bg-[#00949D]",
                      },
                    }}
                  />
                </div>
              </SignedOut>
              <SignedIn>
                <Home />
              </SignedIn>
            </>
          }
        />
        <Route
          path="/sign-up"
          element={
            <div className="mt-10">
              <SignUp afterSignUpUrl={"/"} />
            </div>
          }
        />
        <Route
          path="/"
          element={
            <div className="mt-10">
              <Home />
            </div>
          }
        />
        <Route
          path="/oauth-callback/:integrationId"
          element={
            <div className="mt-10">
              <OAuthCallback />
            </div>
          }
        />
        <Route
          path="/oauth-callback"
          element={
            <div className="mt-10">
              <OAuthCallback />
            </div>
          }
        />
        <Route path="workflow" element={<App />}>
          <Route path=":workflowId" element={<App />} />
        </Route>
        <Route path="manage" element={<ManageWorkflow />}>
          <Route path=":workflowId" element={<ManageWorkflow />} />
        </Route>
      </Routes>
    </ClerkProvider>
  );
}
