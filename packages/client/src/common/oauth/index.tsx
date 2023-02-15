import React, { useEffect } from "react";
import { TailSpin } from "react-loader-spinner";
import { useParams } from "react-router-dom";
import { REVERT_BASE_API_URL } from "../../constants";

export const OAuthCallback = (props) => {
  const rootParams = useParams();
  const [called, setCalled] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [status, setStatus] = React.useState("starting...");

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (Object.keys(params).length && !rootParams.integrationId) {
      const formdata = new FormData();
      formdata.append("code", params.code!);
      formdata.append("client_id", process.env.REACT_APP_SLACK_CLIENT_ID!);
      formdata.append(
        "client_secret",
        process.env.REACT_APP_SLACK_CLIENT_SECRET!
      );
      const requestOptions = {
        method: "POST",
        body: formdata,
      };
      setIsLoading(true);
      setStatus("In progress...");
      fetch("https://slack.com/api/oauth.v2.access", requestOptions)
        .then((response) => response.json())
        .then((result) => {
          fetch(`${REVERT_BASE_API_URL}/auth/oauth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              workspaceId: String(params.state),
              oAuthData: {
                key: "slack",
                value: result,
              },
            }),
          })
            .then((data) => {
              console.log("OAuth flow succeeded", data);
              setIsLoading(false);
              setStatus("Succeeded. Please feel free to close this window.");
              window.close();
            })
            .catch((err) => {
              console.error(err);
              setIsLoading(false);
              setStatus("Errored out");
            });
        })
        .catch((error) => {
          console.log("error", error);
          setIsLoading(false);
          setStatus("Errored out");
        });
    } else {
      if (
        (rootParams.integrationId === "gsheet" ||
          rootParams.integrationId === "gmail") &&
        params.code &&
        !called
      ) {
        const requestOptions = {
          method: "POST",
        };
        const url = `https://accounts.google.com/o/oauth2/token?code=${params.code}&client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&client_secret=${process.env.REACT_APP_GOOGLE_CLIENT_SECRET}&grant_type=authorization_code&redirect_uri=${window.location.origin}/oauth-callback/${rootParams.integrationId}&access_type=offline&prompt=consent`;
        setCalled(true);
        setIsLoading(true);
        setStatus("In progress...");
        fetch(url, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            if (result && !result.error) {
              fetch(`${REVERT_BASE_API_URL}/auth/oauth`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  workspaceId: String(params.state),
                  oAuthData: {
                    key: rootParams.integrationId,
                    value: result,
                  },
                }),
              })
                .then((data) => {
                  console.log("OAuth flow succeeded", data);
                  window.close();
                  setIsLoading(false);
                  setStatus(
                    "Succeeded. Please feel free to close this window."
                  );
                })
                .catch((err) => {
                  setIsLoading(false);
                  console.error(err);
                  setStatus("Errored out");
                });
            }
          })
          .catch((error) => {
            setIsLoading(false);
            console.log("error", error);
            setStatus("Errored out");
          });
      } else if (rootParams.integrationId === "hubspot") {
        console.log("Post crm installation", rootParams.integrationId, params);
        fetch(
          `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=hubspot&code=${
            params.code
          }&t_id=${String(params.state)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((data) => {
            console.log("OAuth flow succeeded", data);
            window.close();
            setIsLoading(false);
            setStatus("Succeeded. Please feel free to close this window.");
          })
          .catch((err) => {
            setIsLoading(false);
            console.error(err);
            setStatus("Errored out");
          });
      } else if (rootParams.integrationId === "zohocrm") {
        console.log("Post crm installation", rootParams.integrationId, params);
        fetch(
          `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=zohocrm&code=${
            params.code
          }&t_id=${String(params.state)}&location=${
            params.location
          }&accountURL=${params["accounts-server"]}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((data) => {
            console.log("OAuth flow succeeded", data);
            window.close();
            setIsLoading(false);
            setStatus("Succeeded. Please feel free to close this window.");
          })
          .catch((err) => {
            setIsLoading(false);
            console.error(err);
            setStatus("Errored out");
          });
      } else if (rootParams.integrationId === "sfdc") {
        console.log("Post crm installation", rootParams.integrationId, params);
        fetch(
          `${REVERT_BASE_API_URL}/v1/crm/oauth-callback?integrationId=sfdc&code=${
            params.code
          }&t_id=${String(params.state)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((data) => {
            console.log("OAuth flow succeeded", data);
            window.close();
            setIsLoading(false);
            setStatus("Succeeded. Please feel free to close this window.");
          })
          .catch((err) => {
            setIsLoading(false);
            console.error(err);
            setStatus("Errored out");
          });
      }
    }
  }, [called, rootParams.integrationId]);

  return (
    <div>
      <h3 className="flex justify-center font-bold">
        OAuth Authorization {status}
      </h3>
      {isLoading && (
        <TailSpin
          wrapperStyle={{ justifyContent: "center", marginTop: "100px" }}
          color="#1C1C1C"
          height={80}
          width={80}
        />
      )}
    </div>
  );
};
