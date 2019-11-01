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
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();
const db = require('../db/infinite.js');
const weekDB = require('../db/global.js');
const Login = require('../lib/login.js');
const faker = require('faker');

let driver;

describe('InfiniteTimelineSelect', function() {
  beforeEach(function() {
    driver = new webdriver.Builder()
      .forBrowser('firefox')
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
  it('should require login', async function() {
    this.timeout(0);
    try {
      await driver.get('http://localhost:3000/infinite_timeline/edit');
      await driver.wait(until.urlContains('/login'));

      const url = await driver.getCurrentUrl();
      url.should.equal('http://localhost:3000/login');
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
  it('should select a story from the week', async function() {
    this.timeout(0);
    try {
      await Login.login(driver);
      await weekDB.put();
      const word1 = faker.lorem.word();
      const word2 = faker.lorem.word();
      const word3 = faker.lorem.word();
      await db.put(1, word1, weekDB.value);
      await db.put(2, word2, 0);
      await db.put(3, word3, weekDB.value);
      await driver.get('http://localhost:3000/infinite_timeline/edit');

      driver.findElement(By.id('2')).should.be.rejected;
      const displayedElem = await driver.findElement(By.id('1')).isDisplayed();

      await driver.findElement(By.id('3')).click();
      await driver.findElement(By.id('form-submit')).click();

      await driver.wait(until.urlIs('http://localhost:3000/infinite_timeline'));

      const selected = await db.get(3);
      const unselected = await db.get(1);
      selected.Item.selected.should.equal('x');
      should.not.exist(unselected.Item.selected);
      displayedElem.should.be.true;

      await db.delete(1);
      await db.delete(2);
      await db.delete(3);
      await weekDB.delete();
    } catch(error) {
      console.error('Error: ' + error);
      throw error;
    }
  });
  it('should select a story from a given week', async function() {
    this.timeout(0);
    try {
      await Login.login(driver);
      await weekDB.put();
      const word1 = faker.lorem.word();
      const word2 = faker.lorem.word();
      const word3 = faker.lorem.word();
      await db.put(1, word1, weekDB.value);
      await db.put(2, word2, 0, 'x');
      await db.put(3, word3, 0);
      await driver.get('http://localhost:3000/infinite_timeline/edit?week=0');

      driver.findElement(By.id('1')).should.be.rejected;
      const displayedElem = await driver.findElement(By.id('2')).isDisplayed();

      await driver.findElement(By.id('3')).click();
      await driver.findElement(By.id('form-submit')).click();

      await driver.wait(until.urlIs('http://localhost:3000/infinite_timeline'));

      const selected = await db.get(3);
      const unselected = await db.get(2);
      selected.Item.selected.should.equal('x');
      should.not.exist(unselected.Item.selected);
      displayedElem.should.be.true;

      await db.delete(1);
      await db.delete(2);
      await db.delete(3);
      await weekDB.delete();
      await Login.logout(driver);
    } catch(error) {
      console.error('Error: ' + error);
      throw error;
    }
  });
});
