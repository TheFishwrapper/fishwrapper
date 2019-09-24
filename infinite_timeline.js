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

/*
 * Controller class for the infinite timeline.
 */
class InfiniteTimeline {

  /*
   * Renders an index page with the current selected stories.
   */
  static index(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.TIME_TABLE,
      IndexName: 'gsiSelectedTimeline',
      KeyConditionExpression: '#sel = :selVal',
      ExpressionAttributeNames: {
        '#sel': 'selected'
      },
      ExpressionAttributeValues: {
        ':selVal': 'x'
      },
      ScanIndexForward: true // Sort by week in ascending order
    };
    dynamoDb.query(params, function (err, dat) {
      if (err) {
        console.log(err);
        callback('render', 'error', {error: err});
      } else {
        callback('render', 'infinite_timeline/index', {story: dat.Items});
      }
    });
  }

  /*
   * Renders a form to create a new submission for the infinite timeline.
   */
  static new_story(req, dynamoDb, callback) {
    callback('render', 'infinite_timeline/new');
  }

  /*
   * Creates a new infinite timeline submission in the database. Redirects
   * to the infinite timline index on successful creation.
   */
  static create(req, dynamoDb, callback) {
    InfiniteTimeline._getWeek(dynamoDb)
    .then((dat) => {
      const params = {
        TableName: process.env.TIME_TABLE,
        Item: {
          id: Date.now(),
          content: req.body.content,
          week: dat.Item.value,
        }
      };
      return dynamoDb.put(params).promise();
    })
    .then(() => {
      callback('redirect', '/infinite_timeline');
    })
    .catch((err) => {
      console.error(err);
      callback('render', 'error', {error: err});
    });
  }

  /*
   * Renders a page to select a submission for the given week. Selected
   * submissions will be displayed on the index page.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      let first = InfiniteTimeline._getWeek(dynamoDb);
      const params = {
        TableName: process.env.TIME_TABLE
      };
      let second = dynamoDb.scan(params).promise();
      Promise.all([first, second])
      .then(([w, data]) => {
        let week;
        // If given a number week use that
        if (req.query.week && !isNaN(req.query.week)) {
          week = req.query.week;
        // Otherwise use the current week from the database
        } else {
          week = w.Item.value;
        }
        // Filter all timeline entries to the correct week
        let timeline = data.Items.filter(x => {
          return parseInt(x.week) === parseInt(week);
        });
        callback('render', 'infinite_timeline/edit', {story: timeline,
          week: week});
      })
      .catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates which stories are selected in the database. After successfully
   * updating, the user is redirected to the timeline index.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      dynamoDb.scan({TableName: process.env.TIME_TABLE}).promise()
      .then((data) => {
        // Get the stories from the appropriate week
        let stories = data.Items.filter(x => {
          return parseInt(x.week) === parseInt(req.body.week);
        });
        // Mark the selected story as selected and all others as unselected
        let prom = stories.map(x => {
          return InfiniteTimeline._selectStory(x.id, (x.id === req.body.story),
            dynamoDb);
        });
        return Promise.all(prom);
      }).then(x => {
        callback('redirect', '/infinite_timeline');
      }).catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }


  /*
   * Renders a form to change the week value for submissions.
   * NOTE:
   *   User must be logged in.
   */
  static changeWeek(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      InfiniteTimeline._getWeek(dynamoDb)
      .then(w => {
        callback('render', 'infinite_timeline/week', {week: w.Item.value});
      }).catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates the week value in the database. Upon successfully updating, the
   * user is redirected to the timeline index.
   * NOTE:
   *   User must be logged in.
   */
  static setWeek(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.GLOBAL_TABLE,
        Key: {
          key: 'TimelineWeek'
        },
        UpdateExpression: 'Set #value = :val',
        ExpressionAttributeNames: {
            '#value': 'value',
        },
        ExpressionAttributeValues: {
          ':val': req.body.week
        }
      };
      dynamoDb.update(params, function (error, data) {
        if (error) {
          console.error(error);
          callback('render', 'error', {error: error});
        } else {
          callback('redirect', '/infinite_timeline');
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Remove unselected storiees for the database. Redirect to the timeline
   * index on success.
   * NOTE:
   *   User must be logged in.
   */
  static clean(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      dynamoDb.scan({TableName: process.env.TIME_TABLE}).promise()
      .then(data => {
        let stories = data.Items.filter(x => !x.selected);
        stories = stories.map(x => {
          const params = {
            TableName: process.env.TIME_TABLE,
            Key: {
              id: x.id
            }
          };
          return dynamoDb.delete(params).promise();
        });
        return Promise.all(stories);
      }).then(() => {
        callback('redirect', '/infinite_timeline');
      }).catch(error => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Marks a story as selected in the database if the selected param is true.
   * Returns a promise.
   */
  static _selectStory(id, selected, dynamoDb) {
    let params;
    if (selected) {
      params = { // Mark the story as selected
        TableName: process.env.TIME_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'SET selected = :val',
        ExpressionAttributeValues: {
          ':val': 'x'
        }
      };
    } else {
      params = { // Unselect the story
        TableName: process.env.TIME_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'DELETE selected'
      };
    }
    return dynamoDb.update(params).promise();
  }

  /*
   * Gets the current week from the database. Returns a promise.
   */
  static _getWeek(dynamoDb) {
    const params = {
      TableName: process.env.GLOBAL_TABLE,
      Key: {
        key: 'TimelineWeek'
      }
    };
    return dynamoDb.get(params).promise();
  }
}
module.exports = InfiniteTimeline;
