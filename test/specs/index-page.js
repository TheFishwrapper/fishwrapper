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

let driver;

describe("IndexPage", function() {
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
      console.error(error);
      throw error;
    }
  });
  it("should have a correct subtitle", async function() {
    this.timeout(0);
    try {
      await driver.get("http://localhost:3000");
      const subtitle = await driver.findElement(By.id("subtitle")).getText();

      subtitle.should.equal("It's all irrelevant.");
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
  it("should have a correct contact", async function() {
    this.timeout(0);
    try {
      await driver.get("http://localhost:3000");
      const contact = await driver.findElement(By.css("footer p")).getText();

      contact.should.equal("Contact us: editorial@thefishwrapper.news");
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
