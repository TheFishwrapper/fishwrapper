/*
 * Copyright 2018 Zane Littrell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const axios = require("axios");
const querystring = require("querystring");
const { JWT, JWKS } = require("jose");

/*
 * Controller class for logging in to the website.
 */
class Login {
  /*
   * Renders the login page.
   */
  static show(req, dynamoDb, callback) {
    callback("redirect", process.env.LOGIN_URL);
  }

  /*
   * Handle the authorization code as part of OAuth and use it to get a token.
   * This token will then be used as the signed cookie id_token.
   */
  static handle_code(req, _dynamoDb, callback) {
    if (req.query.code) {
      const authStr = Buffer.from(
        process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET,
        "utf-8"
      );
      const postData = querystring.stringify({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        code: req.query.code,
        redirect_uri: process.env.TOKEN_REDIRECT
      });
      axios
        .post(process.env.TOKEN_URL, postData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + authStr.toString("base64")
          }
        })
        .then(res => {
          const id_token = res.data.id_token;
          callback("cookie", "/", {
            cookie: "id_token",
            value: id_token,
            options: { signed: true, httpOnly: true, sameSite: "strict" }
          });
        })
        .catch(error => {
          console.log("Caught error " + error);
          callback("render", "error", { error: error });
        });
    } else {
      callback("render", "error", { error: "No code provided" });
    }
  }

  /*
   * Logs out the user by unsetting the cookie and redirecting to the index
   * page.
   */
  static logout(req, dynamoDb, callback) {
    callback("cookie", "/", {
      cookie: "id_token",
      value: "",
      options: { expires: new Date() }
    });
  }

  /*
   * Verifies that the user is logged in.
   */
  static authenticate(req) {
    if (req.get("Authorization")) {
      const token = req.get("Authorization").substring(7);
      const keyStore = Login.loadKeyStore();
      console.log(keyStore);
      console.log(token);
      let threwError = false;
      try {
        const result = JWT.verify(token, keyStore, {
          audience: process.env.CLIENT_ID,
          issuer: process.env.ISSUER_URL
        });
        console.log(result);
      } catch (e) {
        threwError = true;
        console.error(e);
      }
      return !threwError;
    } else if (req.signedCookies["id_token"]) {
      return true;
    } else {
      return false;
    }
  }

  /*
   * Loads the JSON Web Key Store from the JSON for verifying JWTs.
   */
  static loadKeyStore() {
    const keys = JSON.parse(process.env.KEYS_JSON);
    return JWKS.asKeyStore(keys);
  }
}
module.exports = Login;
