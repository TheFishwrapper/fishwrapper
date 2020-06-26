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
const webdriver = require("selenium-webdriver"),
  until = webdriver.until,
  By = webdriver.By;
const firefox = require("selenium-webdriver/firefox");
const should = require("chai").should();
const db = require("../db/infinite.js");
const weekDB = require("../db/global.js");
const Login = require("../lib/login.js");
const faker = require("faker");

let driver;

describe("InfiniteTimelineClean", function() {
  beforeEach(function() {
    driver = new webdriver.Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(new firefox.Options().headless())
      .build();
  });
  afterEach(async function() {
    this.timeout(0);
    try {
      await driver.quit();
    } catch (error) {
      throw error;
    }
  });
  it("should require login", async function() {
    this.timeout(0);
    try {
      await driver.get("http://localhost:3000/infinite_timeline/clean");
      await driver.wait(until.urlContains("/login"));

      const url = await driver.getCurrentUrl();
      url.should.equal("http://localhost:3000/login");
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
  it("should delete unselected stories", async function() {
    this.timeout(0);
    try {
      await Login.login(driver);
      const word1 = faker.lorem.word();
      const word2 = faker.lorem.word();
      const word3 = faker.lorem.word();
      await db.put(1, word1, weekDB.value);
      await db.put(2, word2, 0, "x");
      await db.put(3, word3, 0);
      await driver.get("http://localhost:3000/infinite_timeline/clean");

      await driver.wait(until.urlIs("http://localhost:3000/infinite_timeline"));

      const selected = await db.get(2);
      const scan = await db.scan();
      scan.Items.length.should.equal(1);
      selected.Item.selected.should.equal("x");

      await db.delete(2);
      await weekDB.delete();
      await Login.logout(driver);
    } catch (error) {
      console.error("Error: " + error);
      throw error;
    }
  });
});
