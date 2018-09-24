let AWS = require('aws-sdk');
let should = require('chai').should();
let dotenv = require('dotenv');
let faker = require('faker');
let Features = require('../features');

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


function createFeat(db, callback) {
  const params = {
    TableName: process.env.FEATS_TABLE,
    Item: {
      index: faker.random.number(),
      post: faker.internet.url()
    }
  };
  db.put(params, (err) => {
    if (err) {
      console.error(err);
    } else {
      callback(params.Item);
    }
  });
}

describe('Features', () => {
  beforeEach(() => {
    req.signedCookies = [];
  });
  describe('#index()', () => {
    it('should require a login', (done) => {
      Features.index(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should render the index page with all the featured posts', (done) => {
      req.signedCookies['id_token'] = 1;
      Features.index(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('features/index');
        should.exist(obj);
        obj.should.have.property('feats').that.is.a('array');
        done();
      });
    });
  });

  describe('#new_feat()', () => {
    it('should require a login', (done) => {
      Features.new_feat(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should render the new page with all the posts', (done) => {
      req.signedCookies['id_token'] = 1;
      Features.new_feat(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('features/new');
        should.exist(obj);
        obj.should.have.property('posts').that.is.a('array');
        done();
      });
    });
  });

  describe('#create()', () => {
    it('should require a login', (done) => {
      Features.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should create a new featured post', (done) => {
      req.signedCookies['id_token'] = 1;
      req.body = {
         index: faker.random.number(),
         post: faker.internet.url() 
      };
      let params = {
         TableName: process.env.FEATS_TABLE,
         Key: {
           index: req.body.index 
         },
         ReturnValues: 'ALL_OLD'
      };
      Features.create(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/features');
        should.not.exist(obj);
        db.delete(params, (err, res) => {
          should.not.exist(err);
          res.should.have.property('Attributes').that.is.a('object');
          res.Attributes.post.should.equal(req.body.post);
          done();
        });
      });
    });
    it('should send an error due to missing index', (done) => {
     req.signedCookies['id_token'] = 1;
     req.body = {
       post: faker.internet.url()
     };
     Features.create(req, db, (action, page, obj) => {
       action.should.equal('render');
       page.should.equal('error');
       done();
     });
    });
  });

  describe('#edit()', () => {
    it('should require a login', (done) => {
      Features.edit(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should render the edit form', (done) => {
      req.signedCookies['id_token'] = 1; 
      createFeat(db, (item) => {
        req.params = {index: item.index};
        Features.edit(req, db, (action, page, obj) => {
            action.should.equal('render');
            page.should.equal('features/edit');
            should.exist(obj);
            obj.should.have.property('posts').that.is.a('array');
            obj.should.have.property('feat').that.is.a('object');
            db.delete({TableName: process.env.FEATS_TABLE, Key: 
              {index: item.index}}, (err) => {
              if (err) {
                console.error(err);
              } else {
                done();
              }
            });
        });
      });
    });
    it('should render an error on missing post', (done) => {
      req.signedCookies['id_token'] = 1;
      req.params = {index: faker.random.number()};
      Features.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error').that.is.a('string');
        obj.error.should.equal('Featured article not found');
        done();
      });
    });
    it('should render an error on invalid index', (done) => {
      req.signedCookies['id_token'] = 1;
      req.params = {index: faker.internet.url()};
      Features.edit(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        obj.should.have.property('error');
        done();
      });
    });
  });

  describe('#update()', () => {
    it('should require a login', (done) => {
      Features.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should redirect on a succcessful update', (done) => {
      should.fail();
      done();
    });
  });
});
