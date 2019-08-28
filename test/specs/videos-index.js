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
  beforeEach(() => {
    driver.get('http://localhost:3000/videos');
  });
  it('should have a correct title', (done) => {
    let title = driver.findElement(By.css('main h1')).getText();

    title.then((text) => {
      text.should.equal("Videos");
      done();
    })
    .catch((error) => {
      console.error('Error: ' + error);
      should.fail();
    });
  }).timeout(0);
  it('should display a video', (done) => {
    (async function() {
      await db.putExample();
      let videoHeading = await driver.findElement(By.css('main div.col-12 h3'))
        .getText();
      let videoLink = await driver.findElement(By.css('main div.col-12 div'))
        .getText();
      await db.deleteExample();
      videoHeading.should.equal(db.title);
      videoLink.should.equal(db.link);
      done();
    })();
  }).timeout(0);
});
