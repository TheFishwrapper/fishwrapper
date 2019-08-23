const webdriver = require('selenium-webdriver'),
  By = webdriver.By;
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');


const options = new firefox.Options();
options.addArguments("-headless");

const driver = new webdriver.Builder()
.forBrowser('firefox')
.setFirefoxOptions(new firefox.Options().addArguments('-headless'))
.setChromeOptions(new chrome.Options().addArguments('--headless').addArguments('--disable-gpu'))
.build();

driver.get('http://localhost:3000');
let subtitle = driver.findElement(By.id('subtitle')).getText();

subtitle.then((text) => {
  console.log(text);
})
.catch((error) => {
  console.error('Error: ' + error);
});
