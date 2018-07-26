const SUB_TABLE = process.env.SUBSCRIBERS_TABLE;
const bucket = process.env.S3_BUCKET;

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
        res.status(400).json({ error: 'Could not create subscriber' });
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
        res.status(404).json({ error: 'Could not find subscriber' });
      } else { 
        res.redirect('/');
      }
    });
  }
}

module.exports = Subscribers;
