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

const options = new firefox.Options();
options.addArguments("-headless");

const driver = new webdriver.Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(new firefox.Options().headless())
  .build();

driver.get('http://localhost:3000');

describe('IndexPage', () => {
  it('should have a correct subtitle', (done) => {
    let subtitle = driver.findElement(By.id('subtitle')).getText();

    subtitle.then((text) => {
      text.should.equal("It's all irrelevant.");
      done();
    })
    .catch((error) => {
      console.error('Error: ' + error);
      should.fail();
    });
  }).timeout(0);
  it('should have a correct contact', (done) => {
    let contact = driver.findElement(By.css('footer p')).getText();

    contact.then((text) => {
      text.should.equal('Contact us: editorial@thefishwrapper.news');
      done();
    })
    .catch((error) => {
      console.error('Error: ' + error);
      should.fail();
    });
  });
});
