const USERS_TABLE = process.env.USERS_TABLE;
const bcrypt = require('bcryptjs');

class Login {

  static show(req, res, bucket, dynamoDb) {
    console.log(res);
    res.render('login', {bucket: bucket, req: req});
  }

  static attempt(req, res, bucket, dynamoDb) {
    const params = {
      TableName: USERS_TABLE,
       Key: {
         user: req.body.username
       },
    }
    dynamoDb.get(params, function (error, result) {
      if (error) {
        console.log(error);
      } 
      if (result.Item) {
        const hash = result.Item.password;
        bcrypt.compare(req.body.password, hash, function (err, correct) {
          if (err) {
            console.log(err);
          }
          if (correct) {
            res.cookie('id_token', 12, { signed: true, httpOnly: true, sameSite: 'strict' });
            res.redirect(302, '/');
          } else {
            res.status(400).json({ error: 'Incorrect password or username' });
          }
        });
      } else {
        res.status(404).json({ error: 'user not found' });
      }
    });
  }
}

module.exports = Login;
