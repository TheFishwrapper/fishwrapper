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
    it('should sort posts by index', (done) => {
      req.signedCookies['id_token'] = 1;
      let params = {
        TableName: process.env.FEATS_TABLE,
        Item: {
          index: faker.random.number(),
          post: faker.internet.url()
        }
      };
      let pars = {
        TableName: process.env.FEATS_TABLE,
        Key: {
          index: params.Item.index
        }
      };
      db.put(params, (err) => {
        params.Item.index += 10;
        db.put(params, (er) => {
          Features.index(req, db, (action, page, obj) => {
            action.should.equal('render');
            page.should.equal('features/index');
            should.exist(obj);
            obj.should.have.property('feats').that.is.a('array');
            obj.feats[1].index.should.be.above(obj.feats[0].index)
            db.delete(pars, (e) => {
              pars.Key.index += 10;
              db.delete(pars, () => {
                done();
              });
            });
          });
       });
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
    it('should join the posts on the feat objects', (done) => {
      req.signedCookies['id_token']  = 1;
      let params = {
        TableName: process.env.POSTS_TABLE,
        Item: {
          postId: faker.internet.url(),
          title: faker.commerce.productName()
        }
      };
      let pars = {
        TableName: process.env.FEATS_TABLE,
        Item: {
          index: faker.random.number(),
          post: params.Item.postId
        }
      };
      db.put(params, () => {
        db.put(pars, () => {
          req.params = {index: pars.Item.index};
          Features.edit(req, db, (action, page, obj) => {
            action.should.equal('render');
            page.should.equal('features/edit');
            obj.should.have.property('posts').that.is.a('array');
            obj.posts[0].title.should.equal(params.Item.title); 
            db.delete({TableName: process.env.FEATS_TABLE, Key: 
              {index: pars.Item.index}}, () => {
              db.delete({TableName: process.env.POSTS_TABLE, Key: 
                {postId: pars.Item.post}}, () => {
                done();
              });
            });
          });
        });
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
      req.signedCookies['id_token'] = 1;
      req.body = {
        index: faker.random.number(),
        post: faker.internet.url()
      };
      Features.update(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/features');
        should.not.exist(obj);
        db.delete({TableName: process.env.FEATS_TABLE, Key: 
          {index: req.body.index}}, (err) => {
          if (err) {
            console.error(err);
          } else {
            done();
          }
        });
      });
    });
    it('should render an error on invalid index', (done) => {
      req.signedCookies['id_token'] = 1;
      req.body = {
        index: faker.internet.url()
      };
      Features.update(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        should.exist(obj);
        obj.should.have.property('error');
        done();
      });
    });
  });

  describe('#destroy()', () => {
    it('should require a login', (done) => {
      Features.destroy(req, db, (action, page, obj) => {
        action.should.equal('redirect');
        page.should.equal('/login');
        should.not.exist(obj);
        done();
      });
    });
    it('should destroy a valid index and redirect', (done) => {
      req.signedCookies['id_token'] = 1;
      req.params = {
        index: faker.random.number()
      };
      let params = {
        index: req.params.index,
        post: faker.internet.url()
      };
      db.put({TableName: process.env.FEATS_TABLE, Item: params}, (err) => {
        if (err) {
          console.error(err);
          done();
        } else {
          Features.destroy(req, db, (action, page, obj) => {
            action.should.equal('redirect');
            page.should.equal('/features');
            should.not.exist(obj);
            done();
          });
        }
      });
    });
    it('should render an error on invalid index', (done) => {
      req.signedCookies['id_token'] = 1;
      req.params = {
        index: faker.internet.url()
      };
      Features.destroy(req, db, (action, page, obj) => {
        action.should.equal('render');
        page.should.equal('error');
        should.exist(obj);
        obj.should.have.property('error');
        done();
      });
    });
  });
});
