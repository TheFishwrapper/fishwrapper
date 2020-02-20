# The Fishwrapper
[![Build Status](https://travis-ci.org/CapitalistLepton/fishwrapper.svg?branch=master)](https://travis-ci.org/CapitalistLepton/fishwrapper)
[![Coverage Status](https://coveralls.io/repos/github/CapitalistLepton/fishwrapper/badge.svg?branch=master)](https://coveralls.io/github/CapitalistLepton/fishwrapper?branch=master)

This is the source code for The Fishwrapper website. It utilizes the
[Serverless framework](https://serverless.com/) and uses AWS services to create
a stateless web app that functions as a news site.

If you want to add code to this repository make sure to checkout the
CONTRIBUTING file.

## Running Locally
> NOTE: The following commands have only been tested on Mac/Linux and have not
> been tested on Windows

To run this code on your local machine, make sure that you are using the version
of Node.js specified in `serverless.yml`. Then, if you do not already have the
Serverless CLI installed on your computer, run `npm i -g serverless`. Then, run
`npm i` to install all the necessary node modules on your computer. Next, run
`sls dynamodb install`. From there you can test out the code on your machine by
running `sls offline start` and then going to `http://localhost:3000` in your
browser.

> If the app ever crashes when running locally make sure to stop the dynamodb
> program

> If on a Mac or Linux machine this is accomplished by running `ps aux | grep
> dynamodb` and then running `kill (pid from last command)`

Also, Serverless is expecting certain configurations from AWS SSM. These must
be provided with a file name '.env' in the base directory. As this file contains
sensitive information about the server configuration, it is not tracked in Git.
See the configuration section for more information.

## Testing
To run the unit tests for this application simply run `npm test`. To run the
integration tests, you need to have both Firefox and the Gecko driver installed.
Then, run `sls offline start` and in another tab run `npm run integration`.

## Configuration

These are the settings expected by the program from AWS SSM that may be provided
from the .env file for offline operation

- cookieSecret: A string token that is used to encrypt secure cookies
- domain-dev: URL of the domain to deploy to in the dev stage
- s3Bucket: URL of the S3 bucket used to store images
- solrCore: The name of the Apache Solr core being used
- solrPort: The port number of the Solr instance
- solrSite: URL of the Solr instance
- storageBucket: Name of the S3 bucket used for storing PDFs of the print issues
