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
const db = require('../db/issues.js');
const faker = require('faker');

let driver;

describe('IssuesIndex', function() {
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
  it('should have a correct title', async function() {
    this.timeout(0);
    try {
      driver.get('http://localhost:3000/issues');
      let title = await driver.findElement(By.xpath('/html/body/main/h1'))
        .getText();

      title.should.equal('Issues');
    } catch(error) {
      console.error('Error: ' + error);
      should.fail();
    }
  });
  it('should display an issue', async function() {
    this.timeout(0);
    try {
      const fakeLink = faker.internet.url();
      await db.put(1, fakeLink);
      driver.get('http://localhost:3000/issues');

      let storyCount = await driver.findElements(By.className('issue'));
      let title = await driver.findElement(
        By.xpath('/html/body/main/div/div[1]/h3/a')).getText();

      title.should.equal('Issue #1');
      storyCount.length.should.equal(1);

      await db.delete(1);
    } catch(error) {
      console.error('Error: ' + error);
      throw error;
    }
  });
});
