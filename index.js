const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');
const Posts = require('./posts');

const IS_OFFLINE = process.env.IS_OFFLINE;

let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.use(bodyParser.json({ strict: false }));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.set('view engine', 'ejs');
let bucket = "https://s3.amazonaws.com/fishwrapper-assets-dev/";

app.get('/', function (req, res) {
  Posts.index(req, res, bucket, dynamoDb);
});

app.get('/posts', function (req, res) {
  Posts.index(req, res, bucket, dynamoDb);
});

app.get('/posts/new', function(req, res) {
  Posts.new_post(req, res, bucket, dynamoDb);
});

app.get('/posts/:postId', function(req, res) {
  Posts.read(req, res, bucket, dynamoDb); 
});

app.get('/posts/:postId/edit', function(req, res) {
  Posts.edit(req, res, bucket, dynamoDb);
});

app.post('/posts', function(req, res) {
  if (req.body._method == 'PUT') {
    Posts.update(req, res, bucket, dynamoDb);
  } else if (req.body._method == 'POST') {
    Posts.create(req, res, dynamoDb);
  }
});

app.put('/posts/:postId', function(req, res) {
  res.json(req.params);
});

module.exports.handler = serverless(app);
