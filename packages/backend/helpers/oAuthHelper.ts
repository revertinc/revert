import crypto from "crypto";
import oauth1a from "oauth-1.0a";

export function parseJwt(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
}

class OauthHelper {
  static getAuthHeaderForRequest(request: any) {
    console.log(request.authData);
    const oauth = new oauth1a({
      consumer: {
        key: request.authData.consumerKey,
        secret: request.authData.consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });

    const authorization = oauth.authorize(request, {
      key: request.authData.tokenKey,
      secret: request.authData.tokenSecret,
    });

    return oauth.toHeader(authorization);
  }
}

export { OauthHelper };
