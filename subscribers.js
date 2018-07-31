const SUB_TABLE = process.env.SUBSCRIBERS_TABLE;
const bucket = process.env.S3_BUCKET;
const Lib = require('./lib');

class Subscribers {

  static new_subscriber(req, res, dynamoDb) {
    res.render('subscribers/new', {bucket: bucket});
  }

  static create(req, res, dynamoDb) {
    const params = {
      TableName: SUB_TABLE, 
      Item: {
        email: req.body.email,
        phone: req.body.phone
      }
    };
    dynamoDb.put(params, function (error) {
      if (error) {
        console.log(error);
        Lib.error(res, 'Could not create subscriber. Make sure a proper email is supplied.');
      } else {
        res.redirect('/');
      }
    });
  }

  static delete(req, res, dynamoDb) {
    res.render('subscribers/delete', {bucket: bucket});
  }

  static destroy(req, res, dynamoDb) {
    const params = {
      TableName: SUB_TABLE,
      Key: {
        email: req.body.email
      }  
    };
    dynamoDb.delete(params, function (err, data) {
      if (err) {
        console.log(err);
        Lib.error(res, 'Could not find subscriber to delete.');
      } else { 
        res.redirect('/');
      }
    });
  }
}

module.exports = Subscribers;
