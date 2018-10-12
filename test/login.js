let AWS = require('aws-sdk');
let should = require('chai').should();
let dotenv = require('dotenv');
let faker = require('faker');
let bcrypt = require('bcryptjs');
let Login = require('../login');

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

let db = new AWS.DynamoDB.DocumentClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000'
});
let req = {
  signedCookies: []
};

describe('Login', () => {
  describe('#show()', () => {
    it('should display the login page', (done) => {
      Login.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#attempt()', () => {
    it('should redirect and set a cookie on success', (done) => {
      req.body = {
        username: faker.internet.userName(), 
        password: faker.internet.password()
      };
      const params = {
        TableName: process.env.USERS_TABLE,
        Item: {
          user: req.body.username,
          password: bcrypt.hashSync(req.body.password)
        }
      };
      db.put(params, (err) => {
        Login.attempt(req, db, (action, page, obj) => {
          action.should.equal('cookie');
          page.should.equal('/');
          obj.cookie.should.equal('id_token');
          obj.should.have.property('value');
          obj.options.signed.should.equal(true);
          obj.options.httpOnly.should.equal(true);
          obj.options.sameSite.should.equal('strict');
          db.delete({TableName: process.env.USERS_TABLE, Key: {user:
            req.body.username}}, (e) => {
            done();
          });
        });
      });
    });
    it('should render an error on invalid password', (done) => {
      req.body = {
        username: faker.internet.userName(), 
        password: faker.internet.password()
      };
      const params = {
        TableName: process.env.USERS_TABLE,
        Item: {
          user: req.body.username,
          password: bcrypt.hashSync(faker.internet.password())
        }
      };
      db.put(params, (err) => {
        Login.attempt(req, db, (action, page, obj) => {
          action.should.equal('render');
          page.should.equal('error');
          obj.error.should.equal('Incorrect password or username');
          db.delete({TableName: process.env.USERS_TABLE, Key: {user:
            req.body.username}}, (e) => {
            done();
          });
        });
      });
    });
    it('should render an error on invalid username', (done) => {
      req.body = {
        username: faker.internet.userName(), 
        password: faker.internet.password()
      };
      Login.attempt(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('User not found');
        done();
      });
    });
    it('should render an error on invalid params', (done) => {
      req.body = {
        username: faker.random.number(), 
        password: faker.internet.password()
      };
      Login.attempt(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
  });
  describe('#logout()', () => {
    it('should clear id_token and redirect to index', (done) => {
      Login.logout(req, db, (action, page, obj) => {
        action.should.equal('cookie');
        page.should.equal('/');
        obj.cookie.should.equal('id_token');
        obj.value.should.equal('');
        obj.options.should.have.property('expires');
        done();
      });
    });
  });
});
