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
const should = require("chai").should();
const sinon = require("sinon");
const dotenv = require("dotenv");
const faker = require("faker");
const Crosswords = require("../crosswords");

const result = dotenv.config({ path: process.cwd() + "/test/.env" });
if (result.error) {
  throw result.error;
}

let req = {
  signedCookies: [],
  params: []
};

let db = {
  scan: function() {
    throw new Error("Use stub instead");
  },
  get: function() {
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

describe("Crosswords", () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
  });
  afterEach(() => {
    sinon.restore();
  });
  describe("#index()", () => {
    it("should display the index page of all crosswords", done => {
      const result = {
        TableName: process.env.CROSS_TABLE,
        Items: []
      };
      sinon.stub(db, "scan").yields(null, result);

      Crosswords.index(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("crosswords/index");
        obj.should.have.property("crosswords");
        done();
      });
    });
    it("should render an error on dynamodb failure", done => {
      const error = new Error("some failure");
      sinon.stub(db, "scan").yields(error, null);

      Crosswords.index(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe("#show()", () => {
    it("should display a specific crossword", done => {
      const result = {
        TableName: process.env.CROSS_TABLE,
        Item: {
          crossId: "test-id",
          title: "Test Crossword",
          solution: "There is none"
        }
      };
      req.params.crossId = result.Item.crossId;
      sinon.stub(db, "get").yields(null, result);

      Crosswords.show(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("crosswords/show");
        obj.should.have.property("crossword");
        obj.crossword.title.should.equal(result.Item.title);
        done();
      });
    });
    it("should render an error on invalid id", done => {
      const error = new Error("invalid crossId");
      sinon.stub(db, "get").yields(error, null);

      Crosswords.show(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe("#new_cross()", () => {
    it("should render the new crossword form", done => {
      req.signedCookies.id_token = 1;

      Crosswords.new_cross(req, null, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("crosswords/new");
        should.not.exist(obj);
        done();
      });
    });
    it("should redirect to login", done => {
      Crosswords.new_cross(req, null, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
  });
  describe("#create()", () => {
    it("should redirect after successfully creating a new crossword", done => {
      req.signedCookies.id_token = 1;
      req.body = {
        title: faker.lorem.word(),
        solution: faker.lorem.word()
      };
      const expected = {
        TableName: process.env.CROSS_TABLE,
        Item: {
          crossId: req.body.title
            .toLocaleLowerCase()
            .substr(0, 20)
            .replace(/\s/g, "-"),
          title: req.body.title,
          solution: req.body.solution
        }
      };
      let spy = sinon.spy(db, "put");

      Crosswords.create(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/crosswords");
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it("should render an error on invalid input", done => {
      req.signedCookies.id_token = 1;

      Crosswords.create(req, null, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal("Title is missing");
        done();
      });
    });
    it("should require a login", done => {
      Crosswords.create(req, null, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
    it("should render an error on dynamodb failure", done => {
      req.signedCookies.id_token = 1;
      req.body.title = faker.lorem.word();
      const error = new Error("Some failure");
      sinon.stub(db, "put").yields(error, null);

      Crosswords.create(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
  });
  describe("#edit()", () => {
    it("should render the edit form", done => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.params.crossId = title.toLocaleLowerCase().substr(0, 20);
      const item = {
        TableName: process.env.CROSS_TABLE,
        Item: {
          crossId: req.params.crossId,
          title: title
        }
      };
      sinon.stub(db, "get").yields(null, item);

      Crosswords.edit(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("crosswords/edit");
        obj.crossword.title.should.equal(title);
        done();
      });
    });
    it("should render an error when crossword doesn't exist", done => {
      req.signedCookies.id_token = 1;
      const error = new Error("invalid crossId");
      sinon.stub(db, "get").yields(error, null);

      Crosswords.edit(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
    it("should require a login", done => {
      Crosswords.edit(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
  });
  describe("#update()", () => {
    it("should update a crossword", done => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.body = {
        solution: faker.lorem.word(),
        title: title,
        crossId: title.toLocaleLowerCase().substr(0, 20)
      };
      const expected = {
        TableName: process.env.CROSS_TABLE,
        Key: {
          crossId: req.body.crossId
        },
        UpdateExpression: "SET solution = :solution, title = :title",
        ExpressionAttributeValues: {
          ":solution": req.body.solution,
          ":title": req.body.title
        }
      };
      let spy = sinon.spy(db, "update");

      Crosswords.update(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/crosswords");
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it("should render an error on invalid crossword", done => {
      req.signedCookies.id_token = 1;
      const error = new Error("invalid crossId");
      sinon.stub(db, "update").yields(error, null);

      Crosswords.update(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
    it("should require a login", done => {
      Crosswords.update(req, null, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
  });
  describe("#destroy()", () => {
    it("should delete a crossword", done => {
      req.signedCookies.id_token = 1;
      let title = faker.lorem.word();
      req.params.crossId = title.toLocaleLowerCase().substr(0, 20);
      const expected = {
        TableName: process.env.CROSS_TABLE,
        Key: {
          crossId: req.params.crossId
        }
      };
      let spy = sinon.spy(db, "delete");

      Crosswords.destroy(req, db, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/crosswords");
        should.not.exist(obj);
        spy.calledWith(expected).should.be.true;
        done();
      });
    });
    it("should render an error on invalid crossword", done => {
      req.signedCookies.id_token = 1;
      const error = new Error("invalid crossId");
      sinon.stub(db, "delete").yields(error, null);

      Crosswords.destroy(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal(error);
        done();
      });
    });
    it("should require a login", done => {
      Crosswords.destroy(req, null, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal("/login");
        should.not.exist(obj);
        done();
      });
    });
  });
});
