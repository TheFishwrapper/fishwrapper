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
const bcrypt = require('bcryptjs');

/*
 * Controller class for logging in to the website.
 */
class Login {

  /*
   * Renders the login page.
   */
  static show(req, dynamoDb, callback) {
    callback('render', 'login');
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
       },
    }
    dynamoDb.get(params, function (error, result) {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else if (result.Item) {
        const hash = result.Item.password;
        bcrypt.compare(req.body.password, hash, function (err, correct) {
          if (err) {
            console.error(err);
            callback('render', 'error', {error: err});
          } else if (correct) {
            callback('cookie', '/', {cookie: 'id_token', 
              value: result.Item.user, options: {signed: true, httpOnly: true,
              sameSite: 'strict'}});
          } else {
            callback('render', 'error', {error: 
              'Incorrect password or username'});
          }
        });
      } else {
        callback('render', 'error', {error: 'User not found'});
      }
    });
  }

  /*
   * Logs out the user by unsetting the cookie and redirecting to the index
   * page.
   */
  static logout(req, dynamoDb, callback) {
    callback('cookie', '/', {cookie: 'id_token', value: '', options: {expires: new Date()}});
  }

  /*
   * Verifies that the user is logged in.
   * 
   * DEPRECATED: use authenticate(req)
   */
  static authenticate(req, res) {
    if (!req.signedCookies['id_token']) {
      res.redirect('/login');
      return false;
    } else {
      return true;
    }
  }

  /*
   * Verifies that the user is logged in.
   */
  static authenticate(req) {
    if (!req.signedCookies['id_token']) {
      return false;
    } else {
      return true;
    }
  }
}
module.exports = Login;
