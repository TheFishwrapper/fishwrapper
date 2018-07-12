const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const cookie = require('cookie-parser');
const hbs = require('hbs');
const app = express();
const AWS = require('aws-sdk');
const Posts = require('./posts');
const Login = require('./login');
const Features = require('./features');

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

hbs.registerHelper('blurb', function(content) { return content.substr(0, 230) + '...' });
hbs.registerHelper('caro', function(items, options) {
  var out = '<div class="carousel-inner" role="listbox">';
  for (var i = 0; i < items.length; i++) {
    out += '<div class="carousel-item';
    if (i == 0) {
      out += ' active">';
    } else {
      out += '">';
    }
    out += options.fn(items[i]);
  }
  out += '</div>';
  return out;
});
hbs.registerPartials(__dirname + '/views/partials');

app.use(bodyParser.json({ strict: false }));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(cookie(process.env.COOKIE_SECRET));
app.set('view engine', 'hbs');
let bucket = process.env.S3_BUCKET; 

app.get('/', function (req, res) {
  Posts.index(req, res, dynamoDb);
});

app.get('/login', function (req, res) {
  Login.show(req, res, dynamoDb);
});

app.post('/login', function (req, res) {
  Login.attempt(req, res, dynamoDb);
});

app.get('/logout', function (req, res) {
  Login.logout(req, res, dynmaoDb);
});

app.get('/posts', function (req, res) {
  Posts.index(req, res, dynamoDb);
});

app.get('/posts/new', function(req, res) {
  Posts.new_post(req, res, dynamoDb);
});

app.get('/posts/:postId', function(req, res) {
  Posts.read(req, res, dynamoDb); 
});

app.get('/posts/:postId/edit', function(req, res) {
  Posts.edit(req, res, dynamoDb);
});

app.post('/posts', function(req, res) {
  if (req.body._method == 'PUT') {
    Posts.update(req, res, dynamoDb);
  } else if (req.body._method == 'POST') {
    Posts.create(req, res, dynamoDb);
  }
});

app.get('/features', function(req, res) {
  Features.index(req, res, dynamoDb);
});

module.exports.handler = serverless(app);
