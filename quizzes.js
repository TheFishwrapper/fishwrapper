const Lib = require('./lib');
const Login = require('./login');
const markdown = require('markdown').markdown;
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

class Quizzes {

  static index(req, res, dynamoDb) {
    dynamoDb.scan({TableName: QUIZZES_TABLE}, function (err, data) {
      data.Items = data.Items.map(x => {
        x.blur = markdown.toHTML(x.blurb);
        return x;
      });
      let left = data.Items.slice(0, data.Count / 2);
      let center = data.Items.slice(data.Count / 2);
      Lib.render(res, req, 'quizzes/index', {left: left, center: center});
    });
  }

  static new(req, res, dynamoDb) {
    Lib.render(res, req, 'quizzes/new');
  }

  static create(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: QUIZZES_TABLE,
        Item: { 
          quizId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
          title: req.body.title,
          author: req.body.author,
          blurb: req.body.blurb,
          thumbnail: req.file.location,
          thumbnail_credit: req.body.thumbnail_credit
        }
      };
      dynamoDb.put(params, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          res.redirect('/quizzes'); 
        }
      });
    }
  }

  static show(req, res, dynamoDb) {
    const params = {
      TableName: QUIZZES_TABLE,
      Key: {
        quizId: req.params.quizId
      }
    };
    dynamoDb.get(params, function (err, data) {
      if (err) {
        console.log(err);
        Lib.error(res, req, err);
      } else {
        let quiz = data.Item;
        quiz.blurb = markdown.toHTML(quiz.blurb);
        Lib.render(res, req, 'quizzes/show', {quiz: quiz});
      }
    });
  }

  static edit(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: QUIZZES_TABLE,
        Key: {
          quizId: req.params.quizId
        }
      };
      dynamoDb.get(params, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          Lib.render(res, req, 'quizzes/edit', {quiz: data.Item});
        }
      });
    }
  }

  static update(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      let params = {
        TableName: QUIZZES_TABLE,
        Key: {
          quizId: req.body.quizId
        },
        UpdateExpression: 'SET title = :title, author = :author, blurb = :blurb, thumbnail_credit = :thumbnail_credit',
        ExpressionAttributeValues: {
          ':title': req.body.title,
          ':author': req.body.author,
          ':blurb': req.body.blurb,
          ':thumbnail_credit': req.body.thumbnail_credit
        }
      };
      if (req.file) {
        params.UpdateExpression += ', thumbnail = :thumbnail';
        params.ExpressionAttributeValues[':thumbnail'] = req.file.location;
      }
      dynamoDb.update(params, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          res.redirect('/quizzes');
        }
      });
    }
  }

  static destroy(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: QUIZZES_TABLE,
        Key: {
          quizId: req.params.quizId
        }
      };
      dynamoDb.delete(params, function (err, data) {
        if (err) {
          console.log(err);
          Lib.error(res, req, err);
        } else {
          res.redirect('/quizzes');
        }
      });
    }
  }
}
module.exports = Quizzes;
