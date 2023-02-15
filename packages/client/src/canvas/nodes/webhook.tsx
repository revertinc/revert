import React from "react";
import { Handle, Position } from "react-flow-renderer";
import WebhookBg from "../../assets/images/nodes/webhook_bg.png";

function WebhookNode({ data }) {
  return (
    <div className="text-updater-node">
      <div className="bg-[#fff] w-[155px] h-[95px]">
        <img alt="webhook_bg" src={WebhookBg} />
        <p className="absolute ml-auto mr-auto left-0 text-center right-0 text-primary text-[8px] mt-[-30px]">
          {data.label}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} id="b" />
    </div>
  );
}

export default WebhookNode;
