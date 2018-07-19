const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const cookie = require('cookie-parser');
const hbs = require('hbs');
const app = express();
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
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

let s3 = new AWS.S3();

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

let mulS3 = multerS3({
  s3: s3,
  bucket: 'fishwrapper-pictures-dev',
  acl: 'public-read',
  contentType: function (req, file, cb) {
    cb(null, file.mimetype);
  }, 
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname
    });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString() + '-' + file.originalname)
  }
});

let upload = multer({ storage: mulS3 });

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
  Login.logout(req, res, dynamoDb);
});

app.get('/posts', function (req, res) {
  Posts.index(req, res, dynamoDb);
});

app.get('/posts/new', function(req, res) {
  Posts.new_post(req, res, dynamoDb);
});

app.get('/posts/:postId', function (req, res) {
  Posts.read(req, res, dynamoDb); 
});

app.get('/posts/:postId/edit', function (req, res) {
  Posts.edit(req, res, dynamoDb);
});

app.get('/posts/:postId/delete', function (req, res) {
  Posts.destroy(req, res, dynamoDb);
});

app.post('/posts', upload.single('thumbnail'), function (req, res) {
  if (req.body._method == 'PUT') {
    Posts.update(req, res, dynamoDb);
  } else if (req.body._method == 'POST') {
    Posts.create(req, res, dynamoDb);
  }
});

app.get('/features', function (req, res) {
  Features.index(req, res, dynamoDb);
});

app.get('/features/new', function (req, res) {
  Features.new_feat(req, res, dynamoDb);
});

app.get('/features/:index', function (req, res) {
  Features.show(req, res, dynamoDb);
});

app.get('/features/:index/edit', function (req, res) {
  Features.edit(req, res, dynamoDb);
});

app.get('/features/:index/delete', function (req, res) {
  Features.destroy(req, res, dynamoDb);
});

app.post('/features', function (req, res) {
  if (req.body._method == 'PUT') {
    Features.update(req, res, dynamoDb);
  } else if (req.body._method == 'POST') {
    Features.create(req, res, dynamoDb);
  }
});

module.exports.handler = serverless(app);
