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
let should = require('chai').should();
let sinon = require('sinon');
let dotenv = require('dotenv');
let faker = require('faker');
let Videos = require('../videos');

const result = dotenv.config();
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


describe('Videos', () => {
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
    it('should display the index page of all videos', (done) => {
      const result = {
        TableName: process.env.VIDEOS_TABLE,
        Items: []
      };
      sinon.stub(db, 'scan').yields(null, result);

      Videos.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('videos/index');
        obj.should.have.property('videos');
        done();
      });
    });
  });
  describe('#show()', () => {
    it('should display a specific video', (done) => {
      const result = {
        TableName: process.env.VIDEO_TABLE,
        Item: {
          videoId: 'test-id',
          title: 'Test Video',
          link: 'blank'
        }
      };
      req.params.videoId = result.Item.videoId;
      sinon.stub(db, 'get').yields(null, result);

      Videos.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('videos/show');
        obj.should.have.property('video');
        obj.video.title.should.equal(result.Item.title);
        obj.video.link.should.equal(result.Item.link);
        done();
      });
    });
    it('should render an error on invalid id', (done) => {
      sinon.stub(db, 'get').yields(new Error(), null);

      Videos.show(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
  });
  describe('#new_video()', () => {
    it('should render the new video form', (done) => {
      req.signedCookies.id_token = 1;

      Videos.new_video(req, null, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('videos/new');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect to login', (done) => {
      Videos.new_video(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#create()', () => {
    it('should redirect after successfully creating a new video',
      (done) => {
      req.signedCookies.id_token = 1;
      req.body = {
        title: faker.lorem.word(),
        link: faker.lorem.word()
      };
      let spy = sinon.spy(db, 'put');
      // Object expected to be sent to the database
      const expected = {
        TableName: process.env.VIDEO_TABLE,
        Item: {
          videoId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
          title: req.body.title,
          link: req.body.link
        }
      };

      Videos.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/videos');
        should.not.exist(obj);
        // Check if the database was given the correct object
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on invalid input', (done) => {
      req.signedCookies.id_token = 1;

      Videos.create(req, null, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('Missing title or link');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.create(req, null, (action, page, obj) => {
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
      req.params.videoId = title.toLocaleLowerCase().substr(0, 20);
      const item = {
        TableName: process.env.VIDEO_TABLE,
        Item: {
          videoId: req.params.videoId,
          title: title
        }
      };
      sinon.stub(db, 'get').yields(null, item);

      Videos.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('videos/edit');
        obj.video.title.should.equal(title);
        done();
      });
    });
    it('should render an error when video doesn\'t exist', (done) => {
      req.signedCookies.id_token = 1;
      // No videoId provided so the db.get will fail
      sinon.stub(db, 'get').yields(new Error("Does not exist"), null);

      Videos.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.edit(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#update()', () => {
    it('should update a video', (done) => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.body = {
        link: faker.lorem.word(),
        title: title,
        videoId: title.toLocaleLowerCase().substr(0, 20)
      };
      const expected = {
        TableName: process.env.VIDEO_TABLE,
        Key: {
          videoId: req.body.videoId
        },
        UpdateExpression: 'SET link = :link, title = :title',
        ExpressionAttributeValues: {
          ':link': req.body.link,
          ':title': req.body.title
        }
      };
      let spy = sinon.spy(db, 'update');

      Videos.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/videos');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on invalid video', (done) => {
      req.signedCookies.id_token = 1;
      sinon.stub(db, 'update').yields(new Error('invalid videoid'), null);

      Videos.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.update(req, null, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
  describe('#destroy()', () => {
    it('should delete a video', (done) => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.params.videoId = title.toLocaleLowerCase().substr(0, 20)
      const expected = {
        TableName: process.env.VIDEO_TABLE,
        Key: {
          videoId: req.params.videoId
        }
      }
      let spy = sinon.spy(db, 'delete');

      Videos.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/videos');
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it('should render an error on invalid video', (done) => {
      req.signedCookies.id_token = 1;
      sinon.stub(db, 'delete').yields(new Error('invalid videoid'), null);

      Videos.destroy(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
  });
});
