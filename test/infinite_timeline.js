
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
const InfiniteTimeline = require('../infinite_timeline');

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

let req = {
  signedCookies: [],
  params: []
};

let db = {
  query: function(params, callback) {
    throw new Error('Use stub instead');
  },
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

const week = 5;

function stubSelectStory(params) {
  const updatePromise = {
    promise: function() {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  };
  return updatePromise;
}

describe('InfiniteTimeline', () => {
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
        TableName: process.env.TIME_TABLE,
        Items: [1, 2, 3, 4]
      };
      sinon.stub(db, 'query').yields(null, result);

      InfiniteTimeline.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('infinite_timeline/index');
        obj.story.should.equal(result.Items);
        done();
      });
    });
    it('should render an error on database error', (done) => {
      const error = new Error('some failure');
      sinon.stub(db, 'query').yields(error, null);

      InfiniteTimeline.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe('#new_story', () => {
    it('should render a form for a new submission', (done) => {
      InfiniteTimeline.new_story(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('infinite_timeline/new');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#create', () => {
    beforeEach(() => {
      // Stub get for _getWeek method
      const weekRes = {
        TableName: process.env.GLOBAL_TABLE,
        Item: {value: week}
      };
      const getPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(weekRes);
          });
        }
      };
      sinon.stub(db, 'get').returns(getPromise);
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

      InfiniteTimeline.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/infinite_timeline');
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

      InfiniteTimeline.create(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe('#edit', () => {
    beforeEach(() => {
      // Stub get for _getWeek method
      const weekRes = {
        TableName: process.env.GLOBAL_TABLE,
        Item: {value: week}
      };
      const getPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(weekRes);
          });
        }
      };
      sinon.stub(db, 'get').returns(getPromise);
    });
    it('should render the edit form with the database week', (done) => {
      req.signedCookies.id_token = 1;

      const result = {
        TableName: process.env.TIME_TABLE,
        Items: [{week: 1}, {week: week}, {week: 4}]
      };
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      InfiniteTimeline.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('infinite_timeline/edit');
        for (const s of obj.story) {
          s.week.should.equal(week);
        }
        obj.week.should.equal(week);
        done();
      });
    });
    it('should render the edit form with the given week', (done) => {
      const w = 3;
      req.signedCookies.id_token = 1;
      req.query.week = w;

      const result = {
        TableName: process.env.TIME_TABLE,
        Items: [{week: w}, {week: week}, {week: 4}]
      };
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      InfiniteTimeline.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('infinite_timeline/edit');
        for (const s of obj.story) {
          s.week.should.equal(w);
        }
        obj.week.should.equal(w);
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      InfiniteTimeline.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      InfiniteTimeline.edit(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#update', () => {
    it('should select the correct story', (done) => {
      req.signedCookies.id_token = 1;

      const w = 3;
      const id = 1;
      req.body.week = w;
      req.body.story = id;

      const result = {
        TableName: process.env.TIME_TABLE,
        Items: [{id: id, week: w}, {id: 2, week: w}, {id: 3, week: 4}]
      };
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);
      let spy = sinon.stub(db, 'update').callsFake(stubSelectStory);

      const expectedUpdate = {
        TableName: process.env.TIME_TABLE,
        Key: {
          id: id
        },
        UpdateExpression: 'SET selected = :val',
        ExpressionAttributeValues: {
          ':val': 'x'
        }
      };
      const expectedUpdate2 = {
        TableName: process.env.TIME_TABLE,
        Key: {
          id: 2
        },
        UpdateExpression: 'REMOVE selected'
      };

      InfiniteTimeline.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/infinite_timeline');
        should.not.exist(obj);
        spy.calledWithExactly(sinon.match(expectedUpdate)).should.be.true;
        spy.calledWithExactly(sinon.match(expectedUpdate2)).should.be.true;
        spy.calledTwice.should.be.true;
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;
      req.body.week = 1;
      req.body.story = 1;

      const error = new Error('Some error');
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      InfiniteTimeline.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      InfiniteTimeline.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#changeWeek', () => {
    it('should render a form to change the week', (done) => {
      req.signedCookies.id_token = 1;

      const weekRes = {
        TableName: process.env.GLOBAL_TABLE,
        Item: {value: week}
      };
      const getPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(weekRes);
          });
        }
      };
      sinon.stub(db, 'get').returns(getPromise);

      InfiniteTimeline.changeWeek(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('infinite_timeline/week');
        obj.week.should.equal(weekRes.Item.value);
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      const getPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'get').returns(getPromise);

      InfiniteTimeline.changeWeek(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      InfiniteTimeline.changeWeek(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#setWeek', () => {
    it('should redirect to the index on success', (done) => {
      req.signedCookies.id_token = 1;

      sinon.stub(db, 'update').yields(null, {});

      InfiniteTimeline.setWeek(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/infinite_timeline');
        should.not.exist(obj);
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      sinon.stub(db, 'update').yields(error, null);

      InfiniteTimeline.setWeek(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      InfiniteTimeline.setWeek(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#clean', () => {
    beforeEach(() => {
      const deletePromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve();
          });
        }
      };
      sinon.stub(db, 'delete').returns(deletePromise);
    });
    it('should redirect on success', (done) => {
      req.signedCookies.id_token = 1;

      const result = {
        TableName: process.env.TIME_TABLE,
        Items: [{id: 1, week: 1, selected: 'x'}, {id: 2, week: 1},
          {id: 3, week: 4}]
      };
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      InfiniteTimeline.clean(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/infinite_timeline');
        should.not.exist(obj);
        done();
      });
    });
    it('should render an error', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error('Some error');
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      InfiniteTimeline.clean(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      InfiniteTimeline.clean(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
});
