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
const querystring = require("querystring");
const faker = require("faker");
const sinon = require("sinon");
const dotenv = require("dotenv");
const rewire = require("rewire");
const Login = rewire("../login");

const result = dotenv.config({ path: process.cwd() + "/test/.env" });
if (result.error) {
  throw result.error;
}

let req = {
  signedCookies: []
};

let db = {
  get: function() {
    throw new Error("Use stub instead");
  }
};

let axios = {
  post: function(_url, _data, _obj) {
    throw new Error("use stub");
  }
};
Login.__set__("axios", axios);

let JWKS = {
  asKeyStore: function(_keys) {
    throw new Error("use stub");
  }
};
Login.__set__("JWKS", JWKS);

let JWT = {
  verify: function(_token, _keyStore, _opts) {
    throw new Error("use stub");
  }
};
Login.__set__("JWT", JWT);

describe("Login", () => {
  beforeEach(() => {
    req.signedCookies = [];
    req.params = [];
    req.body = [];
    req.query = [];
  });
  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore();
    Login.__set__("axios", axios);
  });
  describe("#show()", () => {
    it("should display the login page", done => {
      Login.show(req, null, (action, page, obj) => {
        action.should.equal("redirect");
        page.should.equal(process.env.LOGIN_URL);
        should.not.exist(obj);
        done();
      });
    });
  });
  describe("#handle_code()", () => {
    it("should redirect and set a cookie on success", done => {
      req.query = {
        code: faker.internet.userName()
      };

      const id_token = "fake.Auth.Token";
      const postData = querystring.stringify({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        code: req.query.code,
        redirect_uri: process.env.TOKEN_REDIRECT
      });
      const authStr = Buffer.from(
        process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET,
        "utf-8"
      );
      const headers = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + authStr.toString("base64")
        }
      };

      const betterAxios = {
        post: function(url, data, obj) {
          url.should.equal(process.env.TOKEN_URL);
          data.should.equal(postData);
          const objStr = JSON.stringify(obj);
          objStr.should.equal(JSON.stringify(headers));
          return Promise.resolve({
            data: { id_token: id_token }
          });
        }
      };
      Login.__set__("axios", betterAxios);

      Login.handle_code(req, db, (action, page, obj) => {
        action.should.equal("cookie");
        page.should.equal("/");
        obj.cookie.should.equal("id_token");
        obj.value.should.equal(id_token);
        obj.options.signed.should.equal(true);
        obj.options.httpOnly.should.equal(true);
        obj.options.sameSite.should.equal("strict");
        done();
      });
    });
    it("should render an error on invalid code", done => {
      const betterAxios = {
        post: function(_url, _data, _obj) {
          return Promise.reject("Shouldn't be called");
        }
      };
      Login.__set__("axios", betterAxios);

      Login.handle_code(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.error.should.equal("No code provided");
        done();
      });
    });
    it("should render an error on axios error", done => {
      req.query = {
        code: faker.internet.userName()
      };

      const errorMsg = "Error Message";
      const betterAxios = {
        post: function(_url, _data, _obj) {
          return Promise.reject(errorMsg);
        }
      };
      Login.__set__("axios", betterAxios);

      Login.handle_code(req, db, (action, page, obj) => {
        action.should.equal("render");
        page.should.equal("error");
        obj.should.have.property("error");
        obj.error.should.equal(errorMsg);
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
  describe("#authenticate()", () => {
    it("should return true when a user provides correct Authorization", () => {
      const betterJWKS = {
        asKeyStore: function(_keys) {
          return "Mock keystore";
        }
      };
      Login.__set__("JWKS", betterJWKS);
      const expectedOpts = {
        audience: process.env.CLIENT_ID,
        issuer: process.env.ISSUER_URL
      };
      const betterJWT = {
        verify: function(token, keyStore, opts) {
          token.should.equal("fake.jwt.token");
          keyStore.should.equal("Mock keystore");
          const optString = JSON.stringify(opts);
          optString.should.equal(JSON.stringify(expectedOpts));
          return "Mock token";
        }
      };
      Login.__set__("JWT", betterJWT);

      const req = {
        get: function(key) {
          return key === "Authorization" ? "Token: fake.jwt.token" : undefined;
        }
      };
      Login.authenticate(req).should.be.true;
    });
    it("should return false when a user provides incorrect Authorization", () => {
      const betterJWKS = {
        asKeyStore: function(_keys) {
          return "Mock keystore";
        }
      };
      Login.__set__("JWKS", betterJWKS);
      const expectedOpts = {
        audience: process.env.CLIENT_ID,
        issuer: process.env.ISSUER_URL
      };
      const betterJWT = {
        verify: function(token, keyStore, opts) {
          token.should.equal("fake.jwt.token");
          keyStore.should.equal("Mock keystore");
          const optString = JSON.stringify(opts);
          optString.should.equal(JSON.stringify(expectedOpts));
          throw new Error("Error verifying token");
        }
      };
      Login.__set__("JWT", betterJWT);

      const req = {
        get: function(key) {
          return key === "Authorization" ? "Token: fake.jwt.token" : undefined;
        }
      };
      Login.authenticate(req).should.be.false;
    });
    it("should return true when a user provides correct id_token", () => {
      const betterJWKS = {
        asKeyStore: function(_keys) {
          return "Mock keystore";
        }
      };
      Login.__set__("JWKS", betterJWKS);
      const expectedOpts = {
        audience: process.env.CLIENT_ID,
        issuer: process.env.ISSUER_URL
      };
      const betterJWT = {
        verify: function(token, keyStore, opts) {
          token.should.equal("fake.jwt.token");
          keyStore.should.equal("Mock keystore");
          const optString = JSON.stringify(opts);
          optString.should.equal(JSON.stringify(expectedOpts));
          return "Mock token";
        }
      };
      Login.__set__("JWT", betterJWT);

      const req = {
        get: function(_key) {
          return undefined;
        },
        signedCookies: {
          id_token: "fake.jwt.token"
        }
      };
      Login.authenticate(req).should.be.true;
    });
    it("should return false when a user provides incorrect id_token", () => {
      const betterJWKS = {
        asKeyStore: function(_keys) {
          return "Mock keystore";
        }
      };
      Login.__set__("JWKS", betterJWKS);
      const expectedOpts = {
        audience: process.env.CLIENT_ID,
        issuer: process.env.ISSUER_URL
      };
      const betterJWT = {
        verify: function(token, keyStore, opts) {
          token.should.equal("fake.jwt.token");
          keyStore.should.equal("Mock keystore");
          const optString = JSON.stringify(opts);
          optString.should.equal(JSON.stringify(expectedOpts));
          throw new Error("Error verifying token");
        }
      };
      Login.__set__("JWT", betterJWT);

      const req = {
        get: function(_key) {
          return undefined;
        },
        signedCookies: {
          id_token: "fake.jwt.token"
        }
      };
      Login.authenticate(req).should.be.false;
    });
    it("should return false when there is no token", () => {
      const req = {
        get: function(_key) {
          return undefined;
        },
        signedCookies: {
          id_token: undefined
        }
      };
      Login.authenticate(req).should.be.false;
    });
    it("should return false when there is a problem with the keystore", () => {
      const betterJWKS = {
        asKeyStore: function(_keys) {
          throw new Error("Error with keystore");
        }
      };
      Login.__set__("JWKS", betterJWKS);

      const req = {
        get: function(_key) {
          return undefined;
        },
        signedCookies: {
          id_token: "fake.jwt.token"
        }
      };
      Login.authenticate(req).should.be.false;
    });
  });
});
