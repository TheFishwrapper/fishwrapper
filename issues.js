/*
 * Copyright 2019 Zane Littrell
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
 * Controller class for the infinite timeline.
 */
class Issues {

  /*
   * Renders an index page with links to all the issue PDFs.
   */
  static index(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.ISSUE_TABLE,
    };
    dynamoDb.scan(params).promise()
    .then(data => {
      callback('render', 'issues/index', {issues: data.Items});
    })
    .catch(error => {
      console.error(error);
      callback('render', 'error', {error: error});
    });
  }

  /*
   * Displays the given issue.
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
      callback('render', 'issues/show', {issue: data.Item});
    })
    .catch(error => {
      console.error(error);
      callback('render', 'error', {error: error});
    });
  }

  /*
   * Renders a form to create a new issue link.
   * NOTE:
   *   User must be logged in.
   */
  static new_issue(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      callback('render', 'issues/new');
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Creates a new issue link in the database. Redirects to the issue index on
   * successful creation.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ISSUE_TABLE,
        Item: {
          issueId: parseInt(req.body.issueId, 10),
          link: req.file.location,
        }
      };
      dynamoDb.put(params).promise()
      .then(() => {
        callback('redirect', '/issues');
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
   * Renders a page to edit an issue.
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
        callback('render', 'issues/edit', {issue: data.Item});
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
   * Updates the data for the current issue. After successfully
   * updating, the user is redirected to the issue index.
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
        callback('redirect', '/issues');
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
   * Deletes the given issue and redirects to the issue index.
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
        callback('redirect', '/issues');
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
module.exports = Issues;
