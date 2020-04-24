/*
 * Copyright 2020 Zane Littrell
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
const FauxAds = require('../faux_ads');

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


describe('FauxAds', () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
  });
  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });
  describe('#index()', () => {
    it('should display the index page of all faux ads', (done) => {
      const result = {
        TableName: process.env.ADS_TABLE,
        Items: []
      };
      const scanPromise = {
        promise: function() {
          return Promise.resolve(result);
        }
      };
      sinon.stub(db, 'scan').retuns(scanPromise);

      req.signedCookies.id_token = 1;

      FauxAds.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('faux_ads/index');
        obj.should.have.property('ads');
        done();
      });
    });
    it('should render an error on dynamodb failure', (done) => {
      const error = new Error('failure of some sort');
      const scanPromise = {
        promise: function() {
          return Promise.reject(error);
        }
      };
      sinon.stub(db, 'scan').returns(scanPromise);

      req.signedCookies.id_token = 1;

      FauxAds.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should redirect to login', (done) => {
      FauxAds.index(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#show()', () => {
    it('should display a specific ad', (done) => {
      const result = {
        TableName: process.env.ADS_TABLE,
        Item: {
          adId: 'test-id',
          title: 'Test Video',
          photo: 'http://example.com',
          altText: 'image description'
        }
      };
      const getPromise = {
        promise: function() {
          return Promise.resolve(result);
        }
      };
      sinon.stub(db, 'get').returns(getPromise);

      req.params.adId = result.Item.adId;
      req.signedCookies.id_token = 1;

      FauxAds.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('faux_ads/show');
        obj.should.have.property('ad');
        obj.ad.title.should.equal(result.Item.title);
        obj.ad.photo.should.equal(result.Item.photo);
        obj.ad.altText.should.equal(result.Item.altText);
        done();
      });
    });
    it('should render an error on invalid id', (done) => {
      const error = new Error('Failure');
      const getPromise = {
        promise: function() {
          return Promise.reject(error);
        }
      };
      sinon.stub(db, 'get').returns(getPromise);

      req.signedCookies.id_token = 1;

      FauxAds.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should redirect to login', (done) => {
      FauxAds.show(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#new_ad()', () => {
    it('should render the new faux ad form', (done) => {
      req.signedCookies.id_token = 1;

      FauxAds.new_ad(req, null, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('faux_ads/new');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect to login', (done) => {
      FauxAds.new_ad(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#create()', () => {
    it('should redirect after successfully creating a new faux ad',
      (done) => {
      req.signedCookies.id_token = 1;
      req.body = {
        title: faker.lorem.word(),
        photo: faker.internet.url(),
        altText: faker.lorem.sentence()
      };

      const spy = sinon.spy(db, 'put');
      const expected = {
        TableName: process.env.ADS_TABLE,
        Item: {
          adId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
          title: req.body.title,
          photo: req.body.photo,
          altText: req.body.altText
        }
      };

      FauxAds.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/faux_ads');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on dynamodb failure', (done) => {
      req.signedCookies.id_token = 1;
      req.body = {
        title: faker.lorem.word(),
        photo: faker.internet.url(),
        altText: faker.lorem.sentence()
      };

      const error = new Error('failure of some sort');
      const putPromise = {
        promise: function() {
          return Promise.reject(error);
        }
      };
      const expected = {
        TableName: process.env.ADS_TABLE,
        Item: {
          adId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
          title: req.body.title,
          photo: req.body.photo,
          altText: req.body.altText
        }
      };
      const spy = sinon.stub(db, 'put').returns(error);

      FauxAds.create(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal(error);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on invalid input', (done) => {
      req.signedCookies.id_token = 1;

      FauxAds.create(req, null, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('Missing title, photo, or altText');
        done();
      });
    });
    it('should require a login', (done) => {
      FauxAds.create(req, null, (action, page, obj) => {
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
      const title = faker.lorem.word();
      req.params.adId = title.toLocaleLowerCase().substr(0, 20);

      const item = {
        TableName: process.env.ADS_TABLE,
        Item: {
          adId: req.params.adId,
          title: title
        }
      };
      const getPromise = {
        promise: function() {
          return Promise.resolve(item);
        }
      };
      sinon.stub(db, 'get').returns(getPromise);

      FauxAds.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('faux_ads/edit');
        obj.ad.title.should.equal(title);
        done();
      });
    });
    it('should render an error when the ad doesn\'t exist', (done) => {
      req.signedCookies.id_token = 1;

      const error = new Error("Does not exist");
      const getPromise = {
        promise: function() {
          return Promise.reject(error);
        }
      };
      sinon.stub(db, 'get').returns(getPromise);

      FauxAds.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      FauxAds.edit(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#update()', () => {
    it('should update a faux ad', (done) => {
      req.signedCookies.id_token = 1;
      const title = faker.lorem.word();
      req.body = {
        adId: title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
        title: title,
        photo: faker.internet.url(),
        altText: faker.lorem.sentence()
      };

      const expected = {
        TableName: process.env.ADS_TABLE,
        Key: {
          adId: req.body.adId
        },
        UpdateExpression: 'SET title = :title, photo = :photo,'
          + ' altText = :altText',
        ExpressionAttributeValues: {
          ':title': req.body.title,
          ':photo': req.body.photo,
          ':altText': req.body.altText
        }
      };
      const spy = sinon.spy(db, 'update');

      FauxAds.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/faux_ads');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on invalid ad', (done) => {
      req.signedCookies.id_token = 1;
      const error = new Error('Invalid adId');
      const updatePromise = {
        promise: function() {
          return Promise.reject(error);
        }
      };
      sinon.stub(db, 'update').returns(updatePromise);

      FauxAds.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      FauxAds.update(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#destroy()', () => {
    it('should delete a faux ad', (done) => {
      req.signedCookies.id_token = 1;
      const title = faker.lorem.word();
      req.params.adId = title.toLocaleLowerCase().substr(0, 20)
      const expected = {
        TableName: process.env.ADS_TABLE,
        Key: {
          adId: req.params.adId
        }
      }
      const spy = sinon.spy(db, 'delete');

      FauxAds.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/faux_ads');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on invalid faux ad', (done) => {
      req.signedCookies.id_token = 1;
      const error = new Error('invalid adId');
      const deletePromise = {
        promise: function() {
          return Promise.reject(error);
        }
      };
      sinon.stub(db, 'delete').returns(deletePromise);

      FauxAds.destroy(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        obj.error.should.equal(error);
        done();
      });
    });
    it('should require a login', (done) => {
      FauxAds.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
}).timeout(200);
