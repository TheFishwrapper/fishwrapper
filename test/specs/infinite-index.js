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
  By = webdriver.By;
const firefox = require("selenium-webdriver/firefox");
const should = require("chai").should();
const db = require("../db/infinite.js");
const faker = require("faker");

let driver;

describe("InfiniteTimelineIndex", function() {
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
  it("should have a correct title", async function() {
    this.timeout(0);
    try {
      driver.get("http://localhost:3000/infinite_timeline");
      let title = await driver.findElement(By.css("main h1")).getText();
      let subhead = await driver.findElement(By.css("main h6")).getText();

      title.should.equal("Infinite Timeline");
      subhead.should.equal(
        "A collaborative story produced by readers like" + " you."
      );
    } catch (error) {
      console.error("Error: " + error);
      should.fail();
    }
  });
  it("should display the timeline", async function() {
    this.timeout(0);
    try {
      const word1 = faker.lorem.word();
      const word2 = faker.lorem.word();
      const word3 = faker.lorem.word();
      await db.put(1, word1, 1, "x");
      await db.put(2, word2, 1);
      await db.put(3, word3, 2, "x");
      driver.get("http://localhost:3000/infinite_timeline");

      let storyCount = await driver.findElements(By.css("#stories p"));
      let text1 = await driver
        .findElement(By.xpath("//main/div/p[1]"))
        .getText();
      let text2 = await driver
        .findElement(By.xpath("//main/div/p[2]"))
        .getText();

      text1.should.equal(word1);
      text2.should.equal(word3);
      storyCount.length.should.equal(2);

      await db.delete(1);
      await db.delete(2);
      await db.delete(3);
    } catch (error) {
      console.error("Error: " + error);
      throw error;
    }
  });
});
