const webdriver = require("selenium-webdriver"),
  By = webdriver.By;
const firefox = require("selenium-webdriver/firefox");
const should = require("chai").should();
const instaDb = require("../db/instaShorts");

let driver;

describe("insta shorts", function() {
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
  it("should display the insta short", async function() {
    this.timeout(0);
    try {
      await instaDb.putExample();
      await driver.get("http://localhost:3000");
      let frame = await driver.findElement(By.xpath('//*[@id="carousel-2"]'));
      frame.isDisplayed();

      let short = await driver
        .findElement(By.xpath('//*[@id="carousel-2"]/div/div/a/p'))
        .getText();
      short.should.equal(instaDb.content);

      await instaDb.deleteExample();
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
