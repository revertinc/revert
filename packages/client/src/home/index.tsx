import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { TailSpin } from "react-loader-spinner";

import WorkflowList from "./workflowList";
import { StyledText } from "./styles";
import { BASE_API_URL } from "../constants";
import { useAppStore } from "../store";
import Navbar from "./navbar";

const Home = () => {
  const [projects, setProjects] = useState([]);
  const workspaceId = useAppStore((state: any) => state.workspaceId);
  const setWorkspaceId = useAppStore((state: any) => state.setWorkspaceId);
  const [isLoading, setIsLoading] = useState(true);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setWorkspaceData = useAppStore((state) => state.setWorkspaceData);
  const [isWaitlisted, setWaitlisted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true);
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
            setWaitlisted(false);
            setIsLoading(false);
          } else if (result.error === "waitlist_error") {
            setWaitlisted(true);
            setIsLoading(false);
          }
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (workspaceId) {
      setIsLoading(true);
      fetch(`${BASE_API_URL}/workflow/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          setProjects(result.data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [workspaceId]);

  return (
    <>
      <Navbar />
      <Box
        component="div"
        sx={{
          display: "flex",
          padding: "0 2rem",
          paddingTop: "60px",
        }}
      >
        {isLoading ? (
          <div className="mt-10">
            <TailSpin
              wrapperStyle={{ justifyContent: "center" }}
              color="#1C1C1C"
              height={80}
              width={80}
            />
          </div>
        ) : !isWaitlisted ? (
          <Box
            component="div"
            style={{
              marginLeft: 104,
              marginRight: 104,
              marginTop: 53,
              width: "100%",
            }}
          >
            <>
              <div className="flex justify-between items-center">
                <StyledText size="1.2rem">Workflows</StyledText>
                <Link
                  to={`/workflow/new`}
                  style={{
                    textDecoration: "none",
                    color: "#fff",
                    background: "#00949D",
                    padding: "7px 35px",
                    borderRadius: 4,
                  }}
                >
                  + Create new workflow
                </Link>
              </div>
              <Box
                component="div"
                style={{
                  display: "flex",
                  gap: "2.5rem",
                  marginTop: "2.5rem",
                  marginBottom: "2.5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {isLoading ? (
                  <div className="mt-10">
                    <TailSpin
                      wrapperStyle={{ justifyContent: "center" }}
                      color="#1C1C1C"
                      height={80}
                      width={80}
                    />
                  </div>
                ) : (
                  <>
                    {projects.length > 0 ? (
                      <WorkflowList workflows={projects} />
                    ) : (
                      <span>
                        No workflows created so far. Create your first flow to
                        see it here.
                      </span>
                    )}
                  </>
                )}
              </Box>
            </>
          </Box>
        ) : (
          <Box
            component="div"
            style={{
              marginLeft: 104,
              marginRight: 104,
              marginTop: 53,
              width: "100%",
            }}
            className="text-lg"
          >
            <h1 className="text-3xl font-bold">You are on our waitlist!</h1>
            <span>
              You will soon recieve an email from us once you make it to the top
              of the list.
            </span>
            <br />
            <br />
            <br />
            <h1 className="text-3xl font-bold">
              Pssst! Want to skip the waitlist?
            </h1>
            <span>
              Fill{" "}
              <a
                target="_blank"
                rel="noreferrer"
                className="text-[#00949D] font-bold"
                href="https://tally.so/r/3q5DYY"
              >
                this
              </a>{" "}
              form or setup a{" "}
              <a
                target="_blank"
                rel="noreferrer"
                className="text-[#00949D] font-bold"
                href="https://calendly.com/aditiatforest/20min"
              >
                quick discovery call{" "}
              </a>
              and let us know how you will use Forest.
            </span>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Home;
