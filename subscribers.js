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

/*
 * Controller class for registering or deleting subscribers.
 */
class Subscribers {

  /*
   * Renders a form to create a new subscriber.
   */
  static new_subscriber(req, dynamoDb, callback) {
    callback('render', 'subscribers/new');
  }

  /*
   * Creates a new db row for a new subscriber. Then, redirect to the homepage.
   */
  static create(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.SUBSCRIBERS_TABLE,
      Item: {
        email: req.body.email,
      }
    };
    if (req.body.phone) {
      params.Item.phone = req.body.phone;
    }
    dynamoDb.put(params, function (error) {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: 'Could not create subscriber. ' +
          'Make sure a proper email is supplied.'});
      } else {
        callback('redirect', '/');
      }
    });
  }

  /*
   * Renders a form to remove a subscriber.
   */
  static delete(req, dynamoDb, callback) {
    callback('render', 'subscribers/delete');
  }

  /*
   * Deletes a subscriber if it is found. Then, redirects to the homepage.
   */
  static destroy(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.SUBSCRIBERS_TABLE,
      Key: {
        email: req.body.email
      }
    };
    dynamoDb.delete(params, function (err, data) {
      if (err) {
        console.error(err);
        callback('render', 'error', {error: 'Could not remove subscriber. ' +
          'Make sure a proper email is supplied.'});
      } else {
        callback('redirect', '/');
      }
    });
  }
}

module.exports = Subscribers;
