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
const db = require("../db/videos.js");

let driver;

describe("VideoShow", function() {
  beforeEach(function() {
    driver = new webdriver.Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(new firefox.Options().headless())
      .build();
  });
  afterEach(async function() {
    this.timeout(0);
    await driver.quit();
  });
  it("should display a video", async function() {
    this.timeout(0);
    try {
      await db.putExample();
      await driver.get("http://localhost:3000/videos/" + db.videoId);

      const title = await driver
        .findElement(By.xpath("//main/div/div[1]/h1"))
        .getText();
      const link = await driver
        .findElement(By.xpath('//main/div[@class="row"]/div[2]'))
        .getText();

      title.should.equal(db.title);
      link.should.equal(db.link);

      await db.deleteExample();
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
