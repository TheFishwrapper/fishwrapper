const TIME_TABLE = process.env.TIME_TABLE;
const GLOBAL_TABLE = process.env.GLOBAL_TABLE;
const Lib = require('./lib');
const Login = require('./login');

class InfiniteTimeline {

  static index(req, res, dynamoDb) {
    const params = {
      TableName: TIME_TABLE
    };
    dynamoDb.scan(params, function (err, dat) {
      if (err) {
        console.log(err);
        Lib.error(res, req, err);
      } else {
        let timeline = dat.Items.filter(x => x.selected);
        timeline.sort((a, b) => parseInt(a.week, 10) - parseInt(b.week, 10));
        Lib.render(res, req, 'infinite_timeline/index', {story: timeline});
      }
    });
  }

  static new_story(req, res, dynamoDb) {
    Lib.render(res, req, 'infinite_timeline/new');
  }

  static create(req, res, dynamoDb) {
    InfiniteTimeline.getWeek(dynamoDb).then((dat) => {
      const params = {
        TableName: TIME_TABLE,
        Item: {
          id: Date.now(),
          content: req.body.content,
          week: dat.Item.value,
          selected: false
        }
      };
      dynamoDb.put(params, function (err) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          res.redirect('/infinite_timeline');
        }
      });
    }).catch((err) => Lib.error(res, req, err));
  }

  static edit(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      InfiniteTimeline.getWeek(dynamoDb).then(w => {
        dynamoDb.scan({TableName: TIME_TABLE}, function (err, data) {
          if (err) {
            console.log(err);
            Lib.error(res, req, err);
          } else {
            let week;
            if (req.query.week && !isNaN(req.query.week)) {
              week = req.query.week;
            } else {
              week = w.Item.value;
            }
            let timeline = data.Items.filter(x => parseInt(x.week) == parseInt(week));
            Lib.render(res, req, 'infinite_timeline/edit', {story: timeline, week: week});
          }
        });
      }).catch(e => Lib.error(res, req, e));
    }
  }

  static update(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      dynamoDb.scan({TableName: TIME_TABLE}, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          let stories = data.Items.filter(x => parseInt(x.week) == parseInt(req.body.week));
          let prom = stories.map(x => InfiniteTimeline.selectStory(x.id, (x.id == req.body.story), dynamoDb));
          Promise.all(prom).then(x => res.redirect('/infinite_timeline')).catch(e => {console.log(e); Lib.error(res, req, e);});
        }
      });
    }
  }

  static selectStory(id, selected, dynamoDb) {
    const params = {
      TableName: TIME_TABLE,
      Key: {
       id: id
      },
      UpdateExpression: 'Set selected = :val',
      ExpressionAttributeValues: {
        ':val': selected
      }
    };
    return dynamoDb.update(params).promise();
  }

  static getWeek(dynamoDb) {
    const params = {
      TableName: GLOBAL_TABLE,
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
}
module.exports = InfiniteTimeline;
