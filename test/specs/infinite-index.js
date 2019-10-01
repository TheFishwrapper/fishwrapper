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
const webdriver = require('selenium-webdriver'),
  By = webdriver.By;
const firefox = require('selenium-webdriver/firefox');
const should = require('chai').should();
const db = require('../db/videos.js');

const options = new firefox.Options();
options.addArguments("-headless");

const driver = new webdriver.Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(new firefox.Options().headless())
  .build();

describe('VideoIndex', () => {
  it('should have a correct title', async () => {
    try {
      driver.get('http://localhost:3000/infinite_timeline');
      let title = await driver.findElement(By.css('main h1')).getText();

      title.should.equal("Videos");
    } catch(error) {
      console.error('Error: ' + error);
      should.fail();
    }
  }).timeout(0);
  it('should display a video', async () => {
    try {
      await db.putExample();
      driver.get('http://localhost:3000/videos');

      let videoHeading = await driver.findElement(By.xpath(
        '//main/div/div[1]/h3')).getText();
      let videoLink = await driver.findElement(By.xpath(
        '//main/div/div[1]/div')).getText();

      videoHeading.should.equal(db.title);
      videoLink.should.equal(db.link);

      await db.deleteExample();
    } catch(error) {
      console.error('Error: ' + error);
      should.fail();
    }
  }).timeout(0);
});
