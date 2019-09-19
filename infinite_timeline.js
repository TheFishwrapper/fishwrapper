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

class InfiniteTimeline {

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

  static new_story(req, dynamoDb, callback) {
    callback('render', 'infinite_timeline/new');
  }

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

  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      let first = InfiniteTimeline.getWeek(dynamoDb)
      const params = {
        TableName: process.env.TIME_TABLE
      };
      let second = dynamoDb.scan(params).promise();
      Promise.all([first, second])
      .then(([w, data]) => {
        let week
        if (req.query.week && !isNaN(req.query.week)) {
          week = req.query.week;
        } else {
          week = w.Item.value;
        }
        // Filter all timeline entries to the correct week
        let timeline = data.Items.filter(x => {
          return parseInt(x.week) == parseInt(week)
        });
        callback('render', 'infinite_timeline/edit', {story: timeline,
          week: week});
      })
      .catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    }
  }

  static update(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      dynamoDb.scan({TableName: TIME_TABLE}, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          let stories = data.Items.filter(x => parseInt(x.week) === parseInt(req.body.week));
          let prom = stories.map(x => InfiniteTimeline._selectStory(x.id, (x.id === req.body.story), dynamoDb));
          Promise.all(prom).then(x => res.redirect('/infinite_timeline')).catch(e => {console.log(e); Lib.error(res, req, e);});
        }
      });
    }
  }

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
        TableName: process.env.TIME_TABLE
        Key: {
          id: id
        },
        UpdateExpression: 'DELETE selected'
      };
    }
    return dynamoDb.update(params).promise();
  }

  static _getWeek(dynamoDb) {
    const params = {
      TableName: process.env.GLOBAL_TABLE,
      Key: {
        key: 'TimelineWeek'
      }
    };
    return dynamoDb.get(params).promise();
  }

  static changeWeek(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      InfiniteTimeline.getWeek(dynamoDb).then(w => {
        Lib.render(res, req, 'infinite_timeline/week', {week: w.Item.value});
      }).catch(e => Lib.error(res, req, e));
    }
  }

  static setWeek(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: GLOBAL_TABLE,
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
      dynamoDb.update(params, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          res.redirect('/infinite_timeline');
        }
      });
    }
  }

  static clean(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      dynamoDb.scan({TableName: TIME_TABLE}, function (err, data) {
        let stories = data.Items.filter(x => !x.selected);
        stories = stories.map(x => {
          const params = {
            TableName: TIME_TABLE,
            Key: {
              id: x.id
            }
          };
          return dynamoDb.delete(params).promise();
        });
        Promise.all(stories).then(x => res.redirect('/infinite_timeline')).catch(e => Lib.error(res, req, e));
      });
    }
  }
}
module.exports = InfiniteTimeline;
