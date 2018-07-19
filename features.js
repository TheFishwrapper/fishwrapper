const FEATS_TABLE = process.env.FEATS_TABLE;
const POSTS_TABLE = process.env.POSTS_TABLE;
const bucket = process.env.S3_BUCKET;
const Login = require('./login');

class Features {

  static index(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = { TableName: FEATS_TABLE };
      dynamoDb.scan(params, (error, result) => {
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else {
          res.render('features/index', {bucket: bucket, req: req, feats: result.Items});
        }
      });
    }
  }

  static new_feat(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = { TableName: POSTS_TABLE };
      dynamoDb.scan(params, (error, result) => {
        if (error) {
          console.log(error);
          res.status(400).json({ error: error });
        } else {
          res.render('features/new', {bucket: bucket, req: req, posts: result.Items});
        }
      });
    }
  }

  static create(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: FEATS_TABLE,
        Item: {
          index: parseInt(req.body.index, 10),
          post: req.body.post
        }
      };
      console.log(req.body);
      dynamoDb.put(params, (error) => {
        if (error) {
          console.log(error);
          res.status(400).json({ error: 'Could not create featured article' });
        } else {
          res.redirect('/features');
        }
      });
    }
  }

  static edit(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: FEATS_TABLE,
        Key: {
          index: parseInt(req.params.index, 10)
        }
      };

      dynamoDb.get(params, (error, result) => {
        if (error) {
          console.log(error);
        }
        if (result.Item) {
          dynamoDb.scan({TableName: POSTS_TABLE}, (err, resul) => {
            if (err) {
              console.log(err);
              res.status(400).json({ error: err });
            } else {
              res.render('features/edit', {bucket: bucket, req: req, posts: resul.Items, feat: result.Item});
            }
          });
        } else {
          res.status(404).json({ error: 'Feature not found' });
        }
      });
    }
  }

  static update(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: FEATS_TABLE,
        Key: {
          index: parseInt(req.body.index, 10)
        },
        UpdateExpression: 'SET post = :post',
        ExpressionAttributeValues: {
          ':post': req.body.post
        }
      };
      dynamoDb.update(params, (error) => {
        if (error) {
          console.log(error);
          res.status(400).json({ error: 'Could not update feature' });
        } else {
          res.redirect('/features');
        }
      });
    }
  }

  static destroy(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: FEATS_TABLE,
        Key: {
          index: parseInt(req.params.index, 10)
        }
      };
      dynamoDb.delete(params, function (err, data) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: 'Could not find feature' });
        } else {
          res.redirect('/features');
        }
      });
    }
  }
}

module.exports = Features;
