let AWS = require('aws-sdk');
let should = require('chai').should();
let dotenv = require('dotenv');
let faker = require('faker');
let Crosswords = require('../crosswords');

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

let db = new AWS.DynamoDB.DocumentClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000'
});
let req = {
  signedCookies: [],
  params: []
};

describe('Crosswords', () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
  });
  describe('#index()', () => {
    it('should display the index page of all crosswords', (done) => {
      Crosswords.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('crosswords/index');
        obj.should.have.property('crosswords');
        done();
      });
    });
  });
  describe('#show()', () => {
    it('should display a specific crossword', (done) => {
      const params = {
        TableName: process.env.CROSS_TABLE,
        Item: {
          crossId: "test-id",
          title: "Test Crossword",
          solution: "There is none"
        }
      };
      db.put(params, (error) => {
        if (error) {
          console.error(error);
          should.fail();
        } else {
          req.params.crossId = params.Item.crossId;
          Crosswords.show(req, db, (action, page, obj) => {
            action.should.equal('render');
            page.should.equal('crosswords/show');
            obj.should.have.property('crossword');
            obj.crossword.title.should.equal(params.Item.title);
            obj.crossword.solution.should.equal(params.Item.solution);
            db.delete({TableName: process.env.CROSS_TABLE, Key: 
              {crossId: params.Item.crossId}}, (err) => {
              if (err) {
                console.error(err);
                should.fail();
              } else {
                done();
              }
            });
          });
        }
      });
    });
    it('should render an error on invalid id', (done) => {
      Crosswords.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
  });
  describe('#new_cross()', () => {
    it('should render the new crossword form', (done) => {
      req.signedCookies.id_token = 1;
      Crosswords.new_cross(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('crosswords/new');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect to login', (done) => {
      Crosswords.new_cross(req, db, (action, page, obj) => {
        action.should.equal('redirect'); 
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#create()', () => {
    it('should redirect after successfully creating a new crossword', 
      (done) => {
      req.signedCookies.id_token = 1;
      req.body = {
        title: faker.lorem.word(),
        solution: faker.lorem.word()
      };
      let id = req.body.title.toLocaleLowerCase().substr(0, 20)
        .replace(/\s/g, '-');
      Crosswords.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/crosswords');
        should.not.exist(obj);
        db.delete({TableName: process.env.CROSS_TABLE, Key: {crossId: id}},
          (e) => {
          if (e) {
            console.error(e);
            should.fail();
          } else {
            done();
          }
        });
      });
    });
    it('should render an error on invalid input', (done) => {
      req.signedCookies.id_token = 1;
      Crosswords.create(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('Title is missing');
        done();
      });
    });
    it('should require a login', (done) => {
      Crosswords.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#edit()', () => {
    it('should render the edit form', (done) => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.params.crossId = title.toLocaleLowerCase().substr(0, 20);
      db.put({TableName: process.env.CROSS_TABLE, Item: {
        crossId: req.params.crossId,
        title: title}}, (err, res) => {
        Crosswords.edit(req, db, (action, page, obj) => {
          action.should.equal('render');
          page.should.equal('crosswords/edit');
          obj.crossword.title.should.equal(title);
          db.delete({TableName: process.env.CROSS_TABLE, Key: {
            crossId: req.params.crossId}}, (e) => {
            if (e) {
              console.error(e);
              should.fail();
            } else {
              done();
            }
          });
        });
      });
    });
    it('should render an error when crossword doesn\'t exist', (done) => {
      req.signedCookies.id_token = 1;
      Crosswords.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Crosswords.edit(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#update()', () => {
    it('should update a crossword', (done) => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.body = {
        solution: faker.lorem.word(),
        title: title,
        crossId: title.toLocaleLowerCase().substr(0, 20)
      };
      db.put({TableName: process.env.CROSS_TABLE, Item: {
        crossId: req.body.crossId,
        title: title}}, (err, res) => {
        Crosswords.update(req, db, (action, page, obj) => {
          action.should.equal('redirect');
          page.should.equal('/crosswords');
          should.not.exist(obj);
          db.delete({TableName: process.env.CROSS_TABLE, Key: {
            crossId: req.body.crossId}}, (e) => {
            if (e) {
              console.error(e);
              should.fail();
            } else {
              done();
            }
          });
        });
      });

    });
    it('should render an error on invalid crossword', (done) => {
      req.signedCookies.id_token = 1;
      Crosswords.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Crosswords.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#destroy()', () => {
    it('should delete a crossword', (done) => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.params.crossId = title.toLocaleLowerCase().substr(0, 20)
      db.put({TableName: process.env.CROSS_TABLE, Item: {
        crossId: req.params.crossId,
        title: title}}, (err, res) => {
        Crosswords.destroy(req, db, (action, page, obj) => {
          action.should.equal('redirect');
          page.should.equal('/crosswords');
          should.not.exist(obj);
          done();
        });
      });
    });
    it('should render an error on invalid crossword', (done) => {
      req.signedCookies.id_token = 1;
      Crosswords.destroy(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Crosswords.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
});
