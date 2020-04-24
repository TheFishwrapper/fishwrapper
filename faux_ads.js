/*
 * Copyright 2020 Zane Littrell
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
const Login = require('./login');

/*
 * Controller class for faux ad objects.
 */
class FauxAds {

  /*
   * Renders an index page with all the faux ad objects.
   * NOTE:
   *   User must be logged in.
   */
  static index(req, dynamoDb, callback) {
    // The DynamoDB table name is in process.env.ADS_TABLE
  }

  /*
   * Renders a faux ad object.
   * NOTE:
   *   User must be logged in.
   */
  static show(req, dynamoDb, callback) {
  }

  /*
   * Renders a form to create a new faux ad object.
   * NOTE:
   *   User must be logged in.
   */
  static new_ad(req, dyanmoDb, callback) {
  }

  /*
   * Creates a new faux ad object and redirects to the faux ad index on success.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
  }

  /*
   * Renders a form to edit a pre-existing faux ad object.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
  }

  /*
   * Updates a faux ad object and redirects to the faux ad index on success.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
  }

  /*
   * Deletes a faux ad object and redirects to the faux ad index on success.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
  }
}
module.exports = FauxAds;
