import React, { useEffect, useState } from "react";
import CodeNode from "../code";

const PostgresNode = (props) => {
  const [dbData, setDbData] = useState(props.data.integration);
  useEffect(() => {
    setDbData(props.data.integration);
  }, [props.data.integration]);

  return (
    <CodeNode
      language="sql"
      data={{ code: dbData.query, ...props.data }}
      id={props.id}
    />
  );
};

export default PostgresNode;
