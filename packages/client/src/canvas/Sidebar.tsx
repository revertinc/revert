import React, { useState } from "react";
import cronstrue from "cronstrue";
import { isCronValid } from "../helpers/cronvalidator";
import CronIcon from "../assets/images/sidebar/cron.png";
import JsIcon from "../assets/images/sidebar/js.png";
import ApiIcon from "../assets/images/sidebar/api.png";
import WebhookIcon from "../assets/images/sidebar/webhook.png";
import PostgresIcon from "../assets/images/sidebar/pg.png";
import SlackIcon from "../assets/images/sidebar/slack.png";
import WorkflowListIcon from "../assets/images/workflow.png";
import EmailIcon from "../assets/images/sidebar/email.png";
import { nanoid } from "nanoid";

const defaultCode = `(() => { 
   // Only write code inside this IIFE. 
   // Return a value that you'd want to use in the next nodes

})()




  
`;

const defaultCronString = "15 0 10 * *";
const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen((state) => !state);
  const onDragStart = (event, nodeType, label: string, data?: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/reactflow/label", label);
    event.dataTransfer.setData(
      "application/reactflow/data",
      JSON.stringify(data)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      <aside className="w-[77px] bg-[#212121] flex flex-col justify-start items-center">
        <img
          src={WorkflowListIcon}
          alt="node_list"
          className="mt-[49px] cursor-pointer"
          onClick={toggleOpen}
          title="Open list of nodes"
        />
      </aside>
      {open && (
        <aside>
          <div className="flex flex-wrap mt-[10px] ml-[10px] mr-[10px] items-end">
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "CRON", "Monday Cron", {
                  cronString: defaultCronString,
                  timeZone: "Asia/Tokyo",
                  humanReadable: isCronValid(defaultCronString)
                    ? cronstrue.toString(defaultCronString)
                    : "Cron not valid",
                })
              }
              draggable
            >
              <img src={CronIcon} alt="cron_logo" />
            </div>
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "CODE_JS", "jsBlock1", { code: defaultCode })
              }
              draggable
            >
              <img src={JsIcon} alt="js_logo" />
            </div>
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "API", "Api", {
                  request: {
                    method: "GET",
                    url: "https://google.com",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    queryParams: {
                      id: 1,
                    },
                    body: JSON.stringify(
                      {
                        data: {
                          x: 1,
                          y: 2,
                        },
                      },
                      null,
                      2
                    ),
                    authMethod: "none",
                    authData: {
                      consumerKey: "<consumerKey>",
                      consumerSecret: "<consumerSecret>",
                      tokenKey: "<tokenKey>",
                      tokenSecret: "<tokenSecret>",
                    },
                  },
                })
              }
              draggable
            >
              <img src={ApiIcon} alt="api_logo" />
            </div>
            {/* <div
            className="w-[80px] p-2 cursor-grab"
            onDragStart={(event) => onDragStart(event, "BRANCH", "Branch")}
            draggable
          >
            Branch
          </div> */}
            {/* <div
            className="w-[80px] p-2 cursor-grab"
            onDragStart={(event) => onDragStart(event, "LOOP", "Loop")}
            draggable
          >
            Loop
          </div> */}
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "WEBHOOK", "Webhook", {
                  webhook: {
                    path: nanoid().toLowerCase(),
                    method: "POST",
                    authData: {
                      key: "x-auth-key",
                      value: "webhook-secret",
                      method: "headerAuth",
                    },
                    headers: {
                      key: "value",
                    },
                    response: JSON.stringify(
                      {
                        data: {
                          status: "ok",
                          value: "webhook trigger successful",
                        },
                      },
                      null,
                      2
                    ),
                  },
                })
              }
              draggable
            >
              <img src={WebhookIcon} alt="webhook_logo" />
            </div>
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "INTEGRATION_SLACK", "slack_1", {
                  kind: "action", // can be a trigger as well
                  functionName: "postMessage", // can be other actions supported by Slack.
                  integration: {
                    // oauth: {
                    //   team: {
                    //     name: "No Code Stuff",
                    //     id: "T029KS13VFV",
                    //   },
                    //   access_token:
                    //     "xoxb-2325171131539-4247015816837-e795Te8pewQle2iTXGHaQIGS",
                    // },
                    postMessage: {
                      text: "Hey this is a test message from Forest! :wave: ",
                      blocks: JSON.stringify(
                        [
                          {
                            type: "section",
                            text: { type: "plain_text", text: "Hello world" },
                          },
                        ],
                        null,
                        2
                      ),
                      channel: undefined,
                    },
                  },
                })
              }
              draggable
            >
              <img src={SlackIcon} alt="slack_logo" />
            </div>
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "INTEGRATION_POSTGRES", "pgSql_1", {
                  kind: "action",
                  functionName: "query",
                  integration: {
                    dbConfig: {
                      nickName: "customerDB",
                      host: "testuserdatabase.jskjanmwb.us-east-2.rds.amazonaws.com",
                      port: 5432,
                      database: "assdfsadf",
                    },
                    authData: {
                      user: "dbUser",
                      password: "verystrongpassword",
                    },
                    whitelistedIPs: ["1.0.0.1", "172.0.0.2"],
                    query: `select om.order_id, om.amount, u.user_name, u.user_email\n from  order_master as om inner join  user_master as u\n where om.refund_status='requested'\n and om. order_amount < 200.00 and u.user_id = om.user_id
                  
                  
                  
                  
                  

                  
                  `,
                  },
                })
              }
              draggable
            >
              <img src={PostgresIcon} alt="pg_logo" />
            </div>
            <div
              className="w-[80px] p-2 cursor-grab"
              onDragStart={(event) =>
                onDragStart(event, "INTEGRATION_GMAIL", "gmail_1", {
                  kind: "action",
                  functionName: "sendEmail",
                  integration: {
                    // oauth: {
                    //   // email: "sandilya.jatin@gmail.com",
                    //   // access_token:
                    //   //   "ya29.a0Aa4xrXNUhwceVuV7msVtjlsqLW-SRk8AlCkTK2dC1-0lmiAHZNxhLk0B46vyxIDsINqQI7FnBQfFdQBX5PykZM7o-C88NpkHxLic371qU1RHDWAmEex76Jk0Kj1UAspQqzKAPBVmoyNk4vBeghHcOXIRmsq9aCgYKATASARASFQEjDvL9LM9lRVaz9Zv4If-EN_ooOg0163",
                    // },
                    emailOptions: {
                      fromName: "Your name here",
                      to: "",
                      cc: "",
                      replyTo: "",
                      subject: "Hello, World! ",
                      text: "This email is sent from Forest!",
                      html: `<p>👋  &mdash; This is a <b>test email</b> from <a href="https://buildwithforest.com">Forest</a>.</p>`,
                      attachments: [],
                      textEncoding: "base64",
                      emailType: "html",
                    },
                  },
                })
              }
              draggable
            >
              <img src={EmailIcon} alt="email_logo" className="w-[40px] ml-2" />
            </div>
            {/* <div
            className="w-[80px] p-2 cursor-grab"
            onDragStart={(event) =>
              onDragStart(event, "CODE_PY", "Python code")
            }
            draggable
          >
            <img src={PyIcon} alt="py_logo" />
          </div> */}
          </div>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
