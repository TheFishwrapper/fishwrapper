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
const Login = require('./login');

class InstaShorts {

  static index(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.INSTA_TABLE
      }
      dynamoDb.scan(params).promise()
      .then(data => {
        callback('render', 'insta_shorts/index', {shorts: data.Items});
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  static new_short(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      callback('render','insta_shorts/new');
    } else {
      callback('redirect', '/login');
    }
  }

  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.INSTA_TABLE,
        Item: {
          instaId: req.body.content.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
          content: req.body.content
        }
      };
      dynamoDb.put(params).promise()
      .then(() => {
        callback('redirect', '/insta_shorts');
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });

    } else {
      callback('redirect', '/login');
    }
  }

  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.INSTA_TABLE,
        Key: {
          instaId: req.params.instaId
        }
      };
      dynamoDb.get(params).promise()
      .then(data => {
        callback('render', 'insta_shorts/edit', {short: data.Item});
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.INSTA_TABLE,
        Key: {
          instaId: req.body.instaId
        },
        UpdateExpression: 'SET content = :content',
        ExpressionAttributeValues: {
          ':content': req.body.content
        }
      };
      dynamoDb.update(params).promise()
      .then(() => {
        callback('redirect', '/insta_shorts');
      })
      .catch( error => {
        console.error(error);
        callback('render', 'error', {error:error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.INSTA_TABLE,
        Key: {
          instaId: req.params.instaId
        }
      };
      dynamoDb.delete(params).promise()
      .then(() => {
        callback('redirect', '/insta_shorts');
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }
}
module.exports = InstaShorts;
