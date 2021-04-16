/*
 * Copyright 2020 Zane Littrell, Nora Fossenier
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
 * Controller class for the cartoons tab.
 */
class Cartoons {

  /*
   * Renders an index page with links to all the cartoon jpgs.
   */
  static index(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.ISSUE_TABLE,
    };
    dynamoDb.scan(params).promise()
    .then(data => {
      callback('render', 'cartoons/index', {issues: data.Items});
    })
    .catch(error => {
      console.error(error);
      callback('render', 'error', {error: error});
    });
  }

  /*
   * Displays the given cartoon.
   */
  static show(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.ISSUE_TABLE,
      Key: {
        issueId: Number(req.params.issueId)
      }
    };
    dynamoDb.get(params).promise()
    .then(data => {
      callback('render', 'cartoons/show', {issue: data.Item});
    })
    .catch(error => {
      console.error(error);
      callback('render', 'error', {error: error});
    });
  }

  /*
   * Renders a form to create a new cartoon link.
   * NOTE:
   *   User must be logged in.
   */
  static new_cartoon(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      callback('render', 'cartoons/new');
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Creates a new cartoon link in the database. Redirects to the cartoons index on
   * successful creation.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ISSUE_TABLE,
        Item: {
          issueId: Number(req.body.issueId),
          link: req.file.location,
        }
      };
      dynamoDb.put(params).promise()
      .then(() => {
        callback('redirect', '/cartoons');
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a page to edit a cartoon.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ISSUE_TABLE,
        Key: {
          issueId: req.params.issueId
        }
      };
      dynamoDb.get(params).promise()
      .then(data => {
        callback('render', 'cartoons/edit', {issue: data.Item});
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates the data for the current cartoon. After successfully
   * updating, the user is redirected to the cartoon index.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ISSUE_TABLE,
        Key: {
          issueId: req.body.issueId,
        },
        UpdateExpression: 'SET link = :link',
        ExpressionAttributeValues: {
          ':link': req.file.location,
        }
      };
      console.log(params);
      dynamoDb.update(params).promise()
      .then(() => {
        callback('redirect', '/cartoons');
      })
      .catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Deletes the given cartoon and redirects to the cartoon index.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ISSUE_TABLE,
        Key: {
          issueId: req.params.issueId
        }
      };
      dynamoDb.delete(params).promise()
      .then(() => {
        callback('redirect', '/cartoons');
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
module.exports = Cartoons;
