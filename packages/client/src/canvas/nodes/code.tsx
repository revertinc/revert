import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Handle, Position, useNodes, useViewport } from "react-flow-renderer";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import CodeMirror from "@uiw/react-codemirror";
import JSImage from "../../assets/images/js.png";
import PgImage from "../../assets/images/nodes/pg.png";
import { evalHightlighterPlugin } from "../../common/code/evalHightlighter";
import { eclipse } from "@uiw/codemirror-theme-eclipse";
import JsBg from "../../assets/images/nodes/js_bg.png";
import PgBg from "../../assets/images/nodes/pg_bg.png";
import { Portal } from "@mui/material";
import useStore, { useAppStore } from "../../store";
import { executeNode } from "../../api";
import RunIcon from "../../assets/images/nodes/run_alternate.png";

const codeOuterStyle: CSSProperties = {
  border: "1px #00949D solid",
  borderRadius: 10,
  textAlign: "left",
  background: "#fff",
};

function CodeNode(props) {
  const language = props.language;
  const { x, y, zoom } = useViewport();
  const nodes = useNodes();

  const documentRoot = document.getElementById("root");
  const reactFlowWrapper = document.getElementsByClassName("react-flow")[0];
  const rootNodeRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: "absolute",
    left: rootNodeRef.current?.getClientRects()[0].left,
    top: rootNodeRef.current?.getClientRects()[0].top!,
    width: rootNodeRef.current?.getClientRects()[0].width,
    height: rootNodeRef.current?.getClientRects()[0].height! + 1,
    overflow: "hidden",
    border: "1px solid #00949D",
  });

  const ReactPortal = ({ code, style, id, extensions }) => {
    const codeMirrorRef = useRef<any | null>(null);
    const { isMoving } = useStore();
    const MemoizedCodeMirror = useMemo(() => {
      if (isMoving)
        return () => (
          <div
            style={{
              position: "absolute",
              overflow: "hidden",
              border: "1px solid #00949D",
              zIndex: 1,
              pointerEvents: "none",
              ...style,
            }}
          ></div>
        );
      else
        return () => (
          <CodeMirror
            ref={codeMirrorRef}
            style={{
              position: "absolute",
              overflow: "hidden",
              border: "1px solid #00949D",
              zIndex: 1,
              pointerEvents: "none",
              ...style,
            }}
            key={id}
            editable={false}
            value={code}
            extensions={extensions}
            defaultValue={code}
            theme={eclipse}
          />
        );
    }, [code, extensions, id, style, isMoving]);
    return useMemo(() => {
      return (
        <Portal container={documentRoot}>
          <div id={id} key={id}>
            <MemoizedCodeMirror />,
          </div>
        </Portal>
      );
    }, [MemoizedCodeMirror, id]);
  };

  const workspaceId = useAppStore((state) => state.workspaceId);
  const currentWorkflowData = useAppStore((state) => state.currentWorkflowData);
  const isSameWorkspace = useMemo(() => {
    return (
      currentWorkflowData === undefined ||
      currentWorkflowData?.workspaceId === workspaceId
    );
  }, [workspaceId, currentWorkflowData]);

  const isInViewport =
    rootNodeRef.current?.getClientRects()[0].left! +
      rootNodeRef.current?.getClientRects()[0].width! >=
      reactFlowWrapper.getClientRects()[0].left &&
    rootNodeRef.current?.getClientRects()[0].left! <=
      reactFlowWrapper.getClientRects()[0].left +
        reactFlowWrapper.getClientRects()[0].width &&
    rootNodeRef.current?.getClientRects()[0].top! +
      rootNodeRef.current?.getClientRects()[0].height! >=
      reactFlowWrapper.getClientRects()[0].top &&
    rootNodeRef.current?.getClientRects()[0].top! <=
      reactFlowWrapper.getClientRects()[0].top +
        reactFlowWrapper.getClientRects()[0].height;

  useEffect(() => {
    if (isInViewport) {
      setStyle({
        left: rootNodeRef.current?.getClientRects()[0].left! + 14,
        top: rootNodeRef.current?.getClientRects()[0].top! + 14 + 60,
        width: rootNodeRef.current?.getClientRects()[0].width! - 28,
        height: rootNodeRef.current?.getClientRects()[0].height! + 1 - 28 - 70,
      });
    }
  }, [x, y, zoom, props.id, nodes, isInViewport]);

  if (zoom < 3) {
    // FIXME : Revert this to 1.8 when the flashing of codemirror is fixed.
    return (
      <div className="text-updater-node">
        <Handle type="target" position={Position.Top} />
        <div className="bg-[#fff] w-[155px] h-[95px]">
          <img alt="webhook_bg" src={language === "sql" ? PgBg : JsBg} />
          <p className="absolute ml-auto mr-auto left-0 text-center right-0 text-primary text-[8px] mt-[-30px]">
            {language === "sql" ? "postgresSQL" : "Javascript"} (
            {props.data.label})
          </p>
          {isSameWorkspace && (
            <div
              className="absolute ml-auto mr-auto right-2 top-3.5"
              onClick={() => executeNode(props.id, props.data.label)}
            >
              <img
                title="Test run this node"
                alt="run_button"
                src={RunIcon}
                className="mr-2.5 cursor-pointer w-[8px] h-[10px] nodrag"
              />
            </div>
          )}
        </div>
        <Handle type="source" position={Position.Bottom} id="b" />
      </div>
    );
  }

  return (
    <div>
      <Handle type="target" position={Position.Top} />
      <div
        id={`code-node-${props.id}`}
        style={codeOuterStyle}
        ref={rootNodeRef}
      >
        <div
          style={{
            width: 400,
            height: 160,
            pointerEvents: "none",
          }}
        >
          <div className="bg-primary w-100 h-6 rounded-b-none rounded-t-lg flex items-center">
            <img
              src={language === "sql" ? PgImage : JSImage}
              alt="js-logo"
              className="w-4 h-4 mt-1 mb-1 ml-3.5"
            />
            <p className="text-[#fff] ml-2.5 text-[8px] font-bold">
              {language === "sql" ? "postgresSQL" : "Javascript"} (
              {props.data.label})
            </p>
          </div>
        </div>
        {isInViewport && (
          <ReactPortal
            id={props.id}
            code={props.data.code}
            style={style}
            extensions={[
              evalHightlighterPlugin,
              language === "sql" ? sql() : javascript({ jsx: true }),
            ]}
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
export default CodeNode;
