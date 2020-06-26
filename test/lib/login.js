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
const db = require("../db/login.js");

const options = new firefox.Options();
options.addArguments("-headless");

class LoginHelper {
  static async login(driver) {
    await db.putExample();
    await driver.get("http://localhost:3000/login");
    await driver.findElement(By.name("username")).sendKeys(db.username);
    await driver.findElement(By.name("password")).sendKeys(db.password);
    await driver.findElement(By.id("submit-form")).click();
    await driver.wait(until.urlIs("http://localhost:3000/"));
  }

  static async logout(driver) {
    await driver.get("http://localhost:3000/logout");
  }
}

module.exports = LoginHelper;
