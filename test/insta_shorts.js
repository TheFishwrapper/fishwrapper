const should = require("chai").should();
const sinon = require("sinon");
const dotenv = require("dotenv");
const faker = require("faker");
const InstaShorts = require("../insta_shorts");

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
    throw new Error("Use stub instead");
  },
  scan: function(params, callback) {
    throw new Error("Use stub instead");
  },
  get: function(params, callback) {
    throw new Error("Use stub instead");
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

function stubSelectContent(params) {
  const updatePromise = {
    promise: function() {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  };
  return updatePromise;
}

describe("InstaShorts", () => {
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
  describe("#index()", () => {
    it("should require a login", done => {
      InstaShorts.index(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
    it("should render the index page", done => {
      req.signedCookies.id_token = 1;
      const result = {
        TableName: process.env.INSTA_TABLE,
        Items: [{ instaId: faker.lorem.word() }]
      };
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      let spy = sinon.stub(db, "scan").returns(promise);

      InstaShorts.index(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("insta_shorts/index");
        obj.shorts.should.equal(result.Items);
        done();
      });
    });
    it("should render an error on database error", done => {
      req.signedCookies.id_token = 1;
      const error = new Error("some failure");
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, "scan").returns(promise);

      InstaShorts.index(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe("#new_short", () => {
    it("should require a login", done => {
      InstaShorts.new_short(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
    it("should render a form to make a new insta short", done => {
      req.signedCookies.id_token = 1;
      InstaShorts.new_short(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("insta_shorts/new");
        should.not.exist(obj);
        done();
      });
    });
  });
  describe("#create", () => {
    beforeEach(() => {
      const short = {
        TableName: process.env.INSTA_TABLE,
        Item: { instaId: faker.lorem.word() }
      };
      const getPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(short);
          });
        }
      };
      sinon.stub(db, "get").returns(getPromise);
    });
    it("should require a login", done => {
      InstaShorts.create(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });

    it("should redirect on success", done => {
      req.signedCookies.id_token = 1;
      req.body.content = faker.lorem.sentence();

      const putPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve();
          });
        }
      };
      sinon.stub(db, "put").returns(putPromise);

      InstaShorts.create(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/insta_shorts");
        should.not.exist(obj);
        done();
      });
    });
    it("should render an error when an error occurs", done => {
      req.signedCookies.id_token = 1;
      req.body.content = faker.lorem.sentence();

      const error = new Error("some failure");
      const putPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, "put").returns(putPromise);

      InstaShorts.create(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe("#edit", () => {
    it("should require a login", done => {
      InstaShorts.edit(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
    it("should render the edits page", done => {
      req.signedCookies.id_token = 1;

      const id = faker.lorem.word();
      req.params.instaId = id;

      const short = {
        TableName: process.env.INSTA_TABLE,
        Item: { instaId: id }
      };
      const getPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(short);
          });
        }
      };
      sinon.stub(db, "get").returns(getPromise);

      InstaShorts.edit(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("insta_shorts/edit");
        obj.short.should.equal(short.Item);
        done();
      });
    });

    it("should render an error", done => {
      req.signedCookies.id_token = 1;

      const error = new Error("Some error");
      const promise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, "get").returns(promise);

      InstaShorts.edit(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe("#update", () => {
    it("should require a login", done => {
      InstaShorts.update(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
    it("should change the content", done => {
      req.signedCookies.id_token = 1;
      const id = 1;
      req.body.instaId = id;
      req.body.content = faker.lorem.sentence();

      const result = {
        TableName: process.env.INSTA_TABLE,
        Item: { instaId: id }
      };
      const updatePromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      let spy = sinon.stub(db, "update").returns(updatePromise);

      const expectedUpdate = {
        TableName: process.env.INSTA_TABLE,
        Key: {
          instaId: id
        },
        UpdateExpression: "SET content = :content",
        ExpressionAttributeValues: {
          ":content": req.body.content
        }
      };

      InstaShorts.update(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/insta_shorts");
        should.not.exist(obj);
        spy.calledOnceWithExactly(sinon.match(expectedUpdate)).should.be.true;
        spy.callCount.should.equal(1);
        done();
      });
    });
    it("should render an error", done => {
      req.signedCookies.id_token = 1;
      const error = new Error("Some error");
      const updatePromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, "update").returns(updatePromise);

      InstaShorts.update(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });

  describe("#destroy", () => {
    it("should require a login", done => {
      InstaShorts.destroy(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
    it("should redirect on success", done => {
      req.signedCookies.id_token = 1;

      const result = {
        TableName: process.env.INSTA_TABLE,
        Item: {}
      };
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            resolve(result);
          });
        }
      };
      sinon.stub(db, "delete").returns(scanPromise);

      InstaShorts.destroy(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/insta_shorts");
        should.not.exist(obj);
        done();
      });
    });
    it("should render an error", done => {
      req.signedCookies.id_token = 1;

      const error = new Error("Some error");
      const scanPromise = {
        promise: function() {
          return new Promise((resolve, reject) => {
            reject(error);
          });
        }
      };
      sinon.stub(db, "delete").returns(scanPromise);

      InstaShorts.destroy(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
});
