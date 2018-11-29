# The Fishwrapper
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
To test this code you need to first run `sls offline start` in order to start 
the database locally on your machine. From there simply run `npm test` to see 
the test results and coverage. Test coverage results are printed out to the
console and can also be found in the coverage directory inside this project.

**Make sure to not load any data into the 
database as the tests expect an empty database**.
