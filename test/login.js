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
const should = require("chai").should();
const faker = require("faker");
const sinon = require("sinon");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const Login = require("../login");

const result = dotenv.config({ path: process.cwd() + "/test/.env" });
if (result.error) {
  throw result.error;
}

let req = {
  signedCookies: []
};

let db = {
  get: function(params, callback) {
    throw new Error("Use stub instead");
  }
};

describe("Login", () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
  });
  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
  });
  describe("#show()", () => {
    it("should display the login page", done => {
      Login.show(req, null, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("login");
        should.not.exist(obj);
        done();
      });
    });
  });
  describe("#attempt()", () => {
    it("should redirect and set a cookie on success", done => {
      req.body = {
        username: faker.internet.userName(),
        password: faker.internet.password()
      };

      const result = {
        TableName: process.env.USERS_TABLE,
        Item: {
          user: req.body.username,
          password: bcrypt.hashSync(req.body.password)
        }
      };
      sinon.stub(db, "get").yields(null, result);

      Login.attempt(req, db, (action, page, obj) => {
        action.should.equal("cookie");
        page.should.equal("/");
        obj.cookie.should.equal("id_token");
        obj.should.have.property("value");
        obj.options.signed.should.equal(true);
        obj.options.httpOnly.should.equal(true);
        obj.options.sameSite.should.equal("strict");
        done();
      });
    });
    it("should render an error on invalid password", done => {
      req.body = {
        username: faker.internet.userName(),
        password: faker.internet.password()
      };

      const result = {
        TableName: process.env.USERS_TABLE,
        Item: {
          user: req.body.username,
          password: bcrypt.hashSync(faker.internet.password())
        }
      };
      sinon.stub(db, "get").yields(null, result);

      Login.attempt(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal("Incorrect password or username");
        done();
      });
    });
    it("should render an error on invalid username", done => {
      req.body = {
        username: faker.internet.userName(),
        password: faker.internet.password()
      };

      sinon.stub(db, "get").yields(null, {});

      Login.attempt(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal("User not found");
        done();
      });
    });
    it("should render an error on invalid params", done => {
      req.body = {
        username: faker.random.number(),
        password: faker.internet.password()
      };

      sinon.stub(db, "get").yields(new Error(), null);

      Login.attempt(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.should.have.property("error");
        done();
      });
    });
  });
  describe("#logout()", () => {
    it("should clear id_token and redirect to index", done => {
      Login.logout(req, null, (action, page, obj) => {
        action.should.equal("cookie");
        page.should.equal("/");
        obj.cookie.should.equal("id_token");
        obj.value.should.equal("");
        obj.options.should.have.property("expires");
        done();
      });
    });
  });
});
