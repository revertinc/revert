export function injectKnownValues(
  context: any,
  code: string,
  queryNames: string[]
) {
  let mergeQueryNamesIntoRegex = new RegExp(queryNames.join("|"), "gi");
  code = code.replace(mergeQueryNamesIntoRegex, function (matched) {
    return `context.${matched}`;
  });
  let expression =
    `{ let context = ` +
    JSON.stringify(context, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    ) +
    `; (${code}) }`;
  return expression;
}

export function evalWithContext(
  context: any,
  code: string,
  queryNames: string[],
  templatize: boolean = true
) {
  // NOTE: Variables do not work inside the eval block
  // so use it outside like {{ variableToEval }} + something else
  // instead of {{ variableToEval + something else }}
  // console.log("1", code, context, queryNames);
  const expression = code.replace(/\{\{(.*?)\}\}/gi, (m) => {
    let innerCode = m.substring(2, m.length - 2);
    // console.log("2", code, context, innerCode, queryNames);
    let innerExpression = injectKnownValues(context, innerCode, queryNames);
    // console.log("3", innerExpression);
    let res = eval(innerExpression);
    if (typeof res === "object") {
      return JSON.stringify(res);
    } else if (typeof res === "string") {
      res = res.replace(/\n/g, "\\n");
      if (!templatize) return res;
      res = res.replace(/\\n/g, "\\\\n");
      res = res.replace(/`/g, "\\`");
      res = res.replace(/\\"/g, '\\\\"');
      return "`" + res + "`";
    } else return res;
  });
  return eval(`(${expression})`);
}
