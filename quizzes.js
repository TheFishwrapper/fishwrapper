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
const Lib = require('./lib');
const Login = require('./login');
const MarkdownIt = require('markdown-it');
const markdown = new MarkdownIt({html: true});
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

class Quizzes {

  static index(req, res, dynamoDb) {
    dynamoDb.scan({TableName: QUIZZES_TABLE}, function (err, data) {
      data.Items = data.Items.map(x => {
        x.blur = markdown.render(x.blurb);
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
          thumbnail_credit: req.body.thumbnail_credit,
          questions: Quizzes.parseQuestions(req.body),
          results: Quizzes.parseResults(req.body)
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
        quiz.blurb = markdown.render(quiz.blurb);
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
      Quizzes.updateResults(req.body, dynamoDb);
      let params = {
        TableName: QUIZZES_TABLE,
        Key: {
          quizId: req.body.quizId
        },
        UpdateExpression: 'SET title = :title, author = :author, blurb = :blurb, thumbnail_credit = :thumbnail_credit, questions = :questions',
        ExpressionAttributeValues: {
          ':title': req.body.title,
          ':author': req.body.author,
          ':blurb': req.body.blurb,
          ':thumbnail_credit': req.body.thumbnail_credit,
          ':questions': Quizzes.parseQuestions(req.body),
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

  static parseQuestions(body) {
    let qids = Object.keys(body).filter(x => x.startsWith('qContent-q')).map(x => x.substring(9));
    let qs = [];
    for (var i = 0; i < qids.length; i++) {
      if (qids[i] && body['qContent-' + qids[i]]) {
      let q = { qId: qids[i], qContent: body['qContent-' + qids[i]] };
      let ans = Object.keys(body).filter(x => x.endsWith(qids[i]) && x.startsWith('aContent-a'));
      q.answers = ans.map(x => {
        let aId = x.substring(9);
        let aContent = body[x];
        let a = null;
        if (aId && aContent) {
          a = { aId: aId, aContent: aContent, aResult: body[`aResult-${aId}`] };
        }
        return a;
      });
      q.answers = q.answers.filter(x => x);
      qs.push(q);
      }
    }
    return qs;
  }

  static parseResults(body) {
    let res = Object.keys(body).filter(x => x.startsWith('rContent-r')).map(x => x.substring(9));
    let rs = [];
    for (var i = 0; i < res.length; i++) {
      if (res[i] && body['rContent-' + res[i]]) {
        let r = { rId: res[i], rContent: body['rContent-' + res[i]] };
        if (body['rThumbnailCredit-' + res[i]]) {
          r.thumbnail_credit = body['rThumbnailCredit-' + res[i]];
        }
        rs.push(r);
      }
    }
    return rs;
  }

  static updateResults(body, dynamoDb) {
    const params = {
      TableName: QUIZZES_TABLE,
      Key: {
        quizId: body.quizId
      }
    };
    dynamoDb.get(params, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        let results = data.Item.results;
        let res = Quizzes.parseResults(body);
        let final = res.map(rNew => {
          for (let rOld of results) {
            if (rNew.rId == rOld.rId) {
              return Quizzes.updateResult(rNew, rOld);
            }
          }
          return rNew;
        });
        const par = {
          TableName: QUIZZES_TABLE,
          Key: {
            quizId: body.quizId
          },
          UpdateExpression: 'SET results = :results',
          ExpressionAttributeValues: {
            ':results': final
          }
        };
        dynamoDb.update(par, function (err) {
          if (err) {
            console.log(err);
          }
        });
      }
    });
  }

  static updateResult(rNew, rOld) {
    let r = rOld;
    if (rNew.rContent != rOld.rContent) {
      r.rContent = rNew.rContent;
    }
    if (rNew.thumbnail_credit && rNew.thumbnail_credit != rOld.thumbnail_credit) {
      r.thumbnail_credit = rNew.thumbnail_credit;
    }
    return r;
  }

  static grade(req, res, dynamoDb) {
     const params = {
      TableName: QUIZZES_TABLE,
      Key: {
        quizId: req.params.quizId
      }
    };
    dynamoDb.get(params, function (err, data) {
      let quiz = data.Item;
      let ques = Object.keys(req.body);
      let resul = [];
      for (let i = 0; i < ques.length; i++) {
        let q;
        for (let j = 0; j < quiz.questions.length; j++) {
          if (quiz.questions[j].qId == ques[i]) {
            q = quiz.questions[j];
          }
        }
        let res;
        for (let j = 0; j < quiz.results.length; j++) {
          if (req.body[ques[i]] == quiz.results[j].rId) {
            res = quiz.results[j];
            res.rContent = markdown.renderInline(res.rContent);
          }
        }
        resul.push({ q: q, r: res });
      }
      let result = new Map();
      for (let i = 0; i < resul.length; i++) {
        if (!result.has(resul[i].r)) {
          result.set(resul[i].r, 1);
        } else {
          result.set(resul[i].r, result.get(resul[i].r) + 1);
        }
      }
      Lib.render(res, req, 'quizzes/grade', {quiz: quiz, result: Quizzes.maxOfMap(result)});
    });
  }

  static maxOfMap(map) {
    let max = { k: null, v: -1 };
    for (let [key, value] of  map) {
      if (value > max.v) {
        max = { k: key, v: value };
      }
    }
    return max.k;
  }

}
module.exports = Quizzes;
