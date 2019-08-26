const webdriver = require('selenium-webdriver'),
  By = webdriver.By;
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');
const should = require('chai').should();

const options = new firefox.Options();
options.addArguments("-headless");

const driver = new webdriver.Builder()
.forBrowser('firefox')
.setFirefoxOptions(new firefox.Options().addArguments('-headless'))
.setChromeOptions(new chrome.Options().addArguments('--headless').addArguments('--disable-gpu'))
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
