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
const should = require('chai').should();
const sinon = require('sinon');
const dotenv = require('dotenv');
const faker = require('faker');
const Subscribers = require('../subscribers');

const result = dotenv.config(
  { path: process.cwd() + '/test/.env' });
if (result.error) {
  throw result.error;
}

let req = {
  signedCookies: [],
  params: []
};

let db = {
  put: function(params, callback) {
    callback(null); // no error
  },
  delete: function(params, callback) {
    callback(null); // no error
  }
};

describe('Subscribers', () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
  });
  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });
  describe('#new_subscriber', () => {
    it('should render a form to create a new subscriber', (done) => {
      Subscribers.new_subscriber(req, null, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('subscribers/new');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#create', () => {
    it('should create a new subscriber with an email and phone number',
      (done) => {
      req.body.email = faker.internet.email();
      req.body.phone = faker.phone.phoneNumber();
      const expected = {
        TableName: process.env.SUBSCRIBERS_TABLE,
        Item: {
          email: req.body.email,
          phone: req.body.phone
        }
      };
      let spy = sinon.spy(db, 'put');

      Subscribers.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should create a new subscriber with an email', (done) => {
      req.body.email = faker.internet.email();
      const expected = {
        TableName: process.env.SUBSCRIBERS_TABLE,
        Item: {
          email: req.body.email
        }
      };
      let spy = sinon.spy(db, 'put');

      Subscribers.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should fail to create a new subscriber without an email', (done) => {
      let error = new Error('No email');
      sinon.stub(db, 'put').yields(error, null);

      Subscribers.create(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('Could not create subscriber. ' +
          'Make sure a proper email is supplied.');
        done();
      });
    });
  });
  describe('#delete', () => {
    it('should render a form to delete a user', (done) => {
      Subscribers.delete(req, null, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('subscribers/delete');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#destroy', () => {
    it('should delete a subscriber with an email', (done) => {
      req.body.email = faker.internet.email();
      const expected = {
        TableName: process.env.SUBSCRIBERS_TABLE,
        Key: {
          email: req.body.email
        }
      };
      let spy = sinon.spy(db, 'delete');

      Subscribers.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/');
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should fail to delete without an email', (done) => {
      let error = new Error('No email');
      sinon.stub(db, 'delete').yields(error, null);

      Subscribers.destroy(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('Could not remove subscriber. ' +
          'Make sure a proper email is supplied.');
        done();
      });
    });
  });
});
