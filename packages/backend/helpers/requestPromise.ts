const https = require("follow-redirects").https;
const http = require("follow-redirects").http;
import url from "url";
import { OauthHelper } from "./oAuthHelper";

export const requestPromise = (request: any) =>
  new Promise((resolve, reject) => {
    let options = request;
    let parsedUrl = url.parse(options.url);
    console.log("Request", JSON.stringify(options));
    options.hostname = parsedUrl.hostname;
    options.path = parsedUrl.path;
    if (request.authMethod === "OAuth1.0") {
      options.headers = {
        ...options.headers,
        ...OauthHelper.getAuthHeaderForRequest(request),
      };
    }
    const protocol = parsedUrl!.protocol!.includes("https") ? https : http;
    const isPostWithData = !!options.body;
    const body: any = [];
    const req = protocol.request(options, (res: any) => {
      res.on("data", (chunk: any) => {
        body.push(chunk);
      });
      res.on("end", () => {
        res.body = Buffer.concat(body);
        let result;
        try {
          result = JSON.parse(res.body.toString());
        } catch (error) {
          console.log("requestParsingError", error);
          reject(error);
        }
        resolve(result);
      });
    });

    req.on("error", (e: any) => {
      console.log("requestError", e);
      reject(e);
    });

    if (isPostWithData) {
      req.write(options.body);
    }
    req.end();
  });
