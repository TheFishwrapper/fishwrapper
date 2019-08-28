# The Fishwrapper
[![Build Status](https://travis-ci.org/CapitalistLepton/fishwrapper.svg?branch=master)](https://travis-ci.org/CapitalistLepton/fishwrapper)
[![Coverage Status](https://coveralls.io/repos/github/CapitalistLepton/fishwrapper/badge.svg?branch=master)](https://coveralls.io/github/CapitalistLepton/fishwrapper?branch=master)

This is the source code for The Fishwrapper website. It utilizes the
[Serverless framework](https://serverless.com/) and uses AWS services to create
a stateless web app that functions as a news site.

If you want to add code to this repository make sure to checkout the
CONTRIBUTING file.

## Running Locally
To run this code on your local machine first run `npm i` and then `sls dynamodb
install`. From there you can test out the code on your machine by running `sls
offline start` and then going to the specified page in your browser.

> If the app ever crashes when running locally make sure to stop the dynamodb
> program

> If on a Mac or Linux machine this is accomplished by running `ps aux | grep
> dynamodb` and then running `kill (pid from last command)`

## Testing
To run the unit tests for this application simply run `npm test`
