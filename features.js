const FEATS_TABLE = process.env.FEATS_TABLE;
const POSTS_TABLE = process.env.POSTS_TABLE;
const bucket = process.env.S3_BUCKET;
const Login = require('./login');
const Lib = require('./lib');

class Features {

  static index(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = { TableName: FEATS_TABLE };
      dynamoDb.scan(params, (error, result) => {
        if (error) {
          console.log(error);
          Lib.error(res, req, error);
        } else {
          Lib.render(res, req, 'features/index', {bucket: bucket, req: req, feats: result.Items});
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
          Lib.error(res, req, error);
        } else {
          Lib.render(res, req, 'features/new', {bucket: bucket, req: req, posts: result.Items});
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
          Lib.error(res, req, 'Could not create featured article');
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
              Lib.error(res, req, err);
            } else {
              Lib.render(res, req, 'features/edit', {bucket: bucket, req: req, posts: resul.Items, feat: result.Item});
            }
          });
        } else {
          Lib.error(res, req, 'Featured article not found');
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
          Lib.error(res, req, 'Could not update featured article');
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
          Lib.error(res, req, 'Could not find featured article');
        } else {
          res.redirect('/features');
        }
      });
    }
  }
}
module.exports = Features;
