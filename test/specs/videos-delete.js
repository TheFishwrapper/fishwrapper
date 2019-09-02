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
  until = webdriver.until,
  By = webdriver.By;
const firefox = require('selenium-webdriver/firefox');
const should = require('chai').should();
const db = require('../db/videos.js');
const Login = require('../lib/login.js');

const options = new firefox.Options();
options.addArguments("-headless");

const driver = new webdriver.Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(new firefox.Options().headless())
  .build();

describe('VideoDelete', () => {
  it('should require login', async () => {
    try {
      await db.putExample();
      driver.get('http://localhost:3000/videos/' + db.videoId + '/delete');
      await driver.wait(until.urlContains('/login'));
      let url = await driver.getCurrentUrl();
      url.should.equal('http://localhost:3000/login');
      await db.deleteExample();
    } catch (error) {
      console.error(error);
      should.fail();
    }
  }).timeout(0);
  it('should delete the video', async () => {
    try {
      await Login.login(driver);
      await db.putExample();
      driver.get('http://localhost:3000/videos/' + db.videoId + '/delete');

      await driver.wait(until.urlIs('http://localhost:3000/videos'));
      let url = await driver.getCurrentUrl();
      url.should.equal('http://localhost:3000/videos');

      // Ensure that a db Item was deleted
      let item = await db.getExample();
      item.should.be.empty;

      await db.deleteExample();
      await Login.logout(driver);
    } catch (error) {
      console.error(error);
      should.fail();
    }
  }).timeout(0);
});
