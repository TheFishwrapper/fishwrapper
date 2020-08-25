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
const bcrypt = require("bcryptjs");
const axios = require("axios");
const querystring = require("querystring");

/*
 * Controller class for logging in to the website.
 */
class Login {
  /*
   * Renders the login page.
   */
  static show(req, dynamoDb, callback) {
    callback("render", "login");
  }

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
          // const id_token = res.data.id_token;
          const access_token = res.data.access_token;
          callback("cookie", "/", {
            cookie: "access_token",
            value: access_token,
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
   * Attempts to login the user with the given username and password. The user
   * is redirected to the index page on success.
   */
  static attempt(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: {
        user: req.body.username
      }
    };
    dynamoDb.get(params, function(error, result) {
      if (error) {
        console.error(error);
        callback("render", "error", { error: error });
      } else if (result.Item) {
        const hash = result.Item.password;
        bcrypt.compare(req.body.password, hash, function(err, correct) {
          if (err) {
            console.error(err);
            callback("render", "error", { error: err });
          } else if (correct) {
            callback("cookie", "/", {
              cookie: "id_token",
              value: result.Item.user,
              options: { signed: true, httpOnly: true, sameSite: "strict" }
            });
          } else {
            callback("render", "error", {
              error: "Incorrect password or username"
            });
          }
        });
      } else {
        callback("render", "error", { error: "User not found" });
      }
    });
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
    if (!req.signedCookies["id_token"]) {
      return false;
    } else {
      return true;
    }
  }
}
module.exports = Login;
