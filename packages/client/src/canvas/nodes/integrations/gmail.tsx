import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { executeNode } from "../../../api";
import GmailIcon from "../../../assets/images/nodes/gmail.png";
import RunIcon from "../../../assets/images/nodes/run.png";
import ExpandIcon from "../../../assets/images/expand_icon.png";
import { useAppStore } from "../../../store";

const codeOuterStyle: CSSProperties = {
  border: "1px #00949D solid",
  borderRadius: 10,
  textAlign: "left",
  background: "#fff",
};

function GmailNode(props) {
  const [gmailData, setGmailData] = useState(props.data.integration);

  const workspaceId = useAppStore((state) => state.workspaceId);
  const currentWorkflowData = useAppStore((state) => state.currentWorkflowData);
  const isSameWorkspace = useMemo(() => {
    return (
      currentWorkflowData === undefined ||
      currentWorkflowData?.workspaceId === workspaceId
    );
  }, [workspaceId, currentWorkflowData]);

  useEffect(() => {
    setGmailData(props.data.integration);
  }, [props.data.integration]);

  return (
    <div>
      <Handle type="target" position={Position.Top} />
      <div style={codeOuterStyle}>
        <div
          style={{
            width: 310,
            height: 80,
          }}
        >
          <div className="bg-primary w-100 h-6 rounded-b-none rounded-t-lg flex items-center">
            <img
              src={GmailIcon}
              alt="js-logo"
              className="w-3 h-2 mt-1 mb-1 ml-3.5"
            />
            <p className="text-[#fff] ml-2.5 text-[8px] font-bold flex-1">
              Gmail - {props.data.label}
            </p>
            {isSameWorkspace && (
              <div onClick={() => executeNode(props.id, props.data.label)}>
                <img
                  title="Test run this node"
                  alt="run_button"
                  src={RunIcon}
                  className="mr-2.5 cursor-pointer w-[8px] h-[10px] nodrag"
                />
              </div>
            )}
            <img
              title="Expand node details"
              alt="expand_node_button"
              src={ExpandIcon}
              className="mr-2 cursor-pointer w-[10px] h-[10px] nodrag pointer-events-none"
            />
          </div>
          <div className="pl-3 pr-3 pt-2 text-[8px]">
            <div className="flex-1 flex mb-2 font-bold">
              <div className=" w-[25%] mr-4 text-[#2D99F9]">Action type</div>
              <div className="flex-1 text-[#2D99F9]">Subject</div>
            </div>
            <div className="flex-1 flex justify-between text-[6px]">
              <div className=" w-[25%] mr-4 border border-[#00949D] p-[2px] rounded-sm">
                {"sendEmail"}
              </div>
              <div className="flex-1 border border-[#00949D] p-[2px] rounded-sm text-ellipsis">
                {gmailData.emailOptions.subject}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
export default GmailNode;
