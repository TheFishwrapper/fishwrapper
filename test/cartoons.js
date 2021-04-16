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
const should = require('chai').should();
const sinon = require('sinon');
const dotenv = require('dotenv');
const faker = require('faker');
const Cartoons = require('../cartoons');

const result = dotenv.config(
  { path: process.cwd() + '/test/.env' });
if (result.error) {
  throw result.error;
}

let req = {
  signedCookies: [],
  params: [],
  file: []
};

let db = {
  scan: function(params, callback) {
    throw new Error('Use stub instead');
  },
  get: function(params, callback) {
    throw new Error('Use stub instead');
  },
  put: function(params, callback) {
    callback(null); // no error
  },
  update: function(params, callback) {
    callback(null); // no error
  },
  delete: function(params, callback) {
    callback(null); // no error
  }
};

describe('Cartoons', () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
    req.query = [];
  });
  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });
  describe('#index()', () => {
    it('should render the index page', (done) => {
      const result = {
        TableName: process.env.ISSUE_TABLE,
        Items: [1, 2, 3, 4]
      };
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      Cartoons.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('cartoons/index');
        obj.issues.should.equal(result.Items);
        done();
      });
    });
    it('should render an error on database error', (done) => {
      const error = new Error('some failure');
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      Cartoons.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe('#show()', () => {
    it('should display a specific cartoon', (done) => {
      const result = {
        TableName: process.env.ISSUE_TABLE,
        Item: {
          issueId: 1,
          link: 'blank'
        }
      };
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      req.params.issueId = result.Item.issueId;
      sinon.stub(db, 'get').returns(promise);

      Cartoons.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('cartoons/show');
        obj.should.have.property('issue');
        obj.issue.issueId.should.equal(result.Item.issueId);
        obj.issue.link.should.equal(result.Item.link);
        done();
      });
    });
    it('should render an error on some error', (done) => {
      const error = new Error('some error');
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      req.params.issueId = 'test-id';
      sinon.stub(db, 'get').returns(promise);

      Cartoons.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe('#new_cartoon()', () => {
    it('should require a login', (done) => {
      Cartoons.new_cartoon(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should render a form for a new submission', (done) => {
      req.signedCookies.id_token = 1;

      Cartoons.new_cartoon(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('cartoons/new');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#create()', () => {
    it('should require a login', (done) => {
      Cartoons.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect on success', (done) => {
      const putPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve();
          });
        }
      };
      sinon.stub(db, 'put').returns(putPromise);

      req.file.location = '/dev/null/';
      req.signedCookies.id_token = 1;

      Cartoons.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/cartoons');
        should.not.exist(obj);
        done();
      });
    });
    it('should render an error when an error occurs', (done) => {
      const error = new Error('some failure');
      const putPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'put').returns(putPromise);

      req.file.location = '/dev/null/';
      req.signedCookies.id_token = 1;

      Cartoons.create(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe('#edit()', () => {
    it('should render the edit form', (done) => {
      req.signedCookies.id_token = 1;

      const result = {
        TableName: process.env.ISSUE_TABLE,
        Item: {
          issueId: 'test-id',
          link: '/dev/null'
        }
      };
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, 'get').returns(promise);

      Cartoons.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('cartoons/edit');
        obj.issue.should.equal(result.Item);
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'get').returns(promise);

      Cartoons.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      Cartoons.edit(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#update()', () => {
    it('should update the cartoon', (done) => {
      req.signedCookies.id_token = 1;
      req.body.issueId = 'fake-id';
      req.file.location = '/dev/null/';

      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve();
          });
        }
      };
      let spy = sinon.stub(db, 'update').returns(promise);

      const expectedUpdate = {
        TableName: process.env.ISSUE_TABLE,
        Key: {
          issueId: req.body.issueId,
        },
        UpdateExpression: 'SET link = :link',
        ExpressionAttributeValues: {
          ':link': req.file.location,
        }
      };

      Cartoons.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/cartoons');
        should.not.exist(obj);
        spy.calledOnceWithExactly(sinon.match(expectedUpdate)).should.be.true;
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'update').returns(promise);

      Cartoons.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      Cartoons.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#destroy()', () => {
    it('should require a login', (done) => {
      Cartoons.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect on success', (done) => {
      req.signedCookies.id_token = 1;

      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve();
          });
        }
      };
      sinon.stub(db, 'delete').returns(promise);

      Cartoons.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/cartoons');
        should.not.exist(obj);
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'delete').returns(promise);

      Cartoons.destroy(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
  });
});
