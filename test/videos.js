let AWS = require('aws-sdk');
let should = require('chai').should();
let dotenv = require('dotenv');
let faker = require('faker');
let Videos = require('../videos');

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

describe('Videos', () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
  });
  describe('#index()', () => {
    it('should display the index page of all videos', (done) => {
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
      const params = {
        TableName: process.env.VIDEO_TABLE,
        Item: {
          videoId: 'test-id',
          title: 'Test Video',
          link: 'blank'
        }
      };
      db.put(params, (error) => {
        if (error) {
          console.error(error);
          should.fail();
        } else {
          req.params.videoId = params.Item.videoId;
          Video.show(req, db, (action, page, obj) => {
            action.should.equal('render');
            page.should.equal('videos/show');
            obj.should.have.property('video');
            obj.video.title.should.equal(params.Item.title);
            obj.video.link.should.equal(params.Item.link);
            db.delete({
              TableName: process.env.VIDEO_TABLE,
              Key: { videoId: params.Item.videoId }
              }, (err) => {
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
      Videos.new_video(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('videos/new');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect to login', (done) => {
      Videos.new_video(req, db, (action, page, obj) => {
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
      let id = req.body.title.toLocaleLowerCase().substr(0, 20)
        .replace(/\s/g, '-');
      Videos.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/videos');
        should.not.exist(obj);
        db.delete({TableName: process.env.VIDEO_TABLE, Key: {videoId: id}},
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
      Videos.create(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.error.should.equal('Title is missing');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.create(req, db, (action, page, obj) => {
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
      db.put({TableName: process.env.VIDEO_TABLE, Item: {
        videoId: req.params.videoId,
        title: title}}, (err, res) => {
        Videos.edit(req, db, (action, page, obj) => {
          action.should.equal('render');
          page.should.equal('videos/edit');
          obj.video.title.should.equal(title);
          db.delete({TableName: process.env.VIDEO_TABLE, Key: {
            videoId: req.params.videoId}}, (e) => {
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
    it('should render an error when video doesn\'t exist', (done) => {
      req.signedCookies.id_token = 1;
      Videos.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.edit(req, db, (action, page, obj) => {
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
      db.put({TableName: process.env.VIDEO_TABLE, Item: {
        videoId: req.body.videoId,
        title: title}}, (err, res) => {
        Videos.update(req, db, (action, page, obj) => {
          action.should.equal('redirect');
          page.should.equal('/videos');
          should.not.exist(obj);
          db.delete({TableName: process.env.VIDEO_TABLE, Key: {
            videoId: req.body.videoId}}, (e) => {
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
    it('should render an error on invalid video', (done) => {
      req.signedCookies.id_token = 1;
      Videos.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
    it('should require a login', (done) => {
      Videos.update(req, db, (action, page, obj) => {
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
      db.put({TableName: process.env.VIDEO_TABLE, Item: {
        videoId: req.params.videoId,
        title: title}}, (err, res) => {
        Videos.destroy(req, db, (action, page, obj) => {
          action.should.equal('redirect');
          page.should.equal('/videos');
          should.not.exist(obj);
          done();
        });
      });
    });
    it('should render an error on invalid video', (done) => {
      req.signedCookies.id_token = 1;
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
