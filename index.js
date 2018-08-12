const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const cookie = require('cookie-parser');
const hbs = require('hbs');
const SolrNode = require('solr-node');
const app = express();
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const Lib = require('./lib');
const Posts = require('./posts');
const Login = require('./login');
const Features = require('./features');
const Subscribers = require('./subscribers');
const InfiniteTimeline = require('./infinite_timeline');
const Quizzes = require('./quizzes');

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
hbs.registerHelper('checkedIf', function(test) { return (test) ? 'checked' : ''; });
hbs.registerHelper('selected', function (sel) { return (sel) ? 'selected' : ''; });
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
  if (req.query.search) {
    Posts.search(req, res, dynamoDb);
  } else if (req.query.category) {
    Posts.category(req, res, dynamoDb);
  } else {
    Posts.index(req, res, dynamoDb);
  }
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

app.get('/staging', function (req, res) {
  Posts.staging(req, res, dynamoDb);
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

app.get('/about', function (req, res) {
  Lib.render(res, req, 'about', {bucket: bucket});
});

app.get('/contact', function (req, res) {
  Lib.render(res, req, 'contact', {bucket: bucket});
});

app.get('/subscribers/new', function (req, res) {
  Subscribers.new_subscriber(req, res, dynamoDb);
});

app.get('/subscribers/delete', function (req, res) {
  Subscribers.delete(req, res, dynamoDb);
});

app.post('/subscribers', function(req, res) {
  if (req.body._method == 'POST') {
    Subscribers.create(req, res, dynamoDb);
  } else if (req.body._method == 'DELETE') {
    Subscribers.destroy(req, res, dynamoDb);
  }
});

app.get('/reindex', function (req, res) {
 if (Login.authenticate(req, res)) {
    const solr = new SolrNode({
      host: process.env.SOLR_SITE,
      port: process.env.SOLR_PORT,
      core: process.env.SOLR_CORE,
      protocol: 'http'
    });
    dynamoDb.scan({TableName: process.env.POSTS_TABLE}, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        result.Items.map(x => Posts.solrPost(x));
      }
    });
    res.redirect('/');
  }
});

app.get('/infinite_timeline', function (req, res) {
  InfiniteTimeline.index(req, res, dynamoDb);
});

app.get('/infinite_timeline/new', function (req, res) {
  InfiniteTimeline.new_story(req, res, dynamoDb);
});

app.get('/infinite_timeline/edit', function (req, res) {
  InfiniteTimeline.edit(req, res, dynamoDb);
});

app.post('/infinite_timeline', function (req, res) {
  if (req.body._method == 'POST') {
    InfiniteTimeline.create(req, res, dynamoDb);
  } else if (req.body._method == 'PUT') {
    InfiniteTimeline.update(req, res, dynamoDb);
  }
});

app.get('/infinite_timeline/week', function (req, res) {
  InfiniteTimeline.changeWeek(req, res, dynamoDb);
});

app.post('/infinite_timeline/week', function (req, res) {
  InfiniteTimeline.setWeek(req, res, dynamoDb);
});

app.get('/infinite_timeline/clean', function (req, res) {
  InfiniteTimeline.clean(req, res, dynamoDb);
});

app.get('/quizzes', function (req, res) {
  Quizzes.index(req, res, dynamoDb);
});

app.get('/quizzes/:quizId', function (req, res) {
  Quizzes.show(req, res, dynamoDb);
});

app.get('/quizzes/:quizId/edit', function (req, res) {
  Quizzes.edit(req, res, dynamoDb);
});

app.get('/quizzes/:quizId/delete', function (req, res) {
  Quizzes.destroy(req, res, dynamoDb);
});

app.get('/quizzes/new', function (req, res) {
  Quizzes.new(req, res, dynamoDb);
});

app.post('/quizzes', upload.single('thumbnail'), function (req, res) {
   if (req.body._method == 'POST') {
     Quizzes.create(req, res, dynamoDb);
   } else if (req.body._method == 'PUT') {
     Quizzes.update(req, res, dynamoDb);
   }
});

app.get('*', function (req, res) {
  Lib.render(res, req, 'missing', {bucket: bucket});
});

module.exports.handler = serverless(app);
