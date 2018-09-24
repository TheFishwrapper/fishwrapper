const USERS_TABLE = process.env.USERS_TABLE;
const bucket = process.env.S3_BUCKET;
const bcrypt = require('bcryptjs');
const Lib = require('./lib');

class Login {

  static show(req, res, dynamoDb) {
    console.log(res);
    res.render('login', {bucket: bucket, req: req});
  }

  static attempt(req, res, dynamoDb) {
    const params = {
      TableName: USERS_TABLE,
       Key: {
         user: req.body.username
       },
    }
    dynamoDb.get(params, function (error, result) {
      if (error) {
        console.log(error);
        Lib.error(res, req, error);
      } 
      if (result.Item) {
        const hash = result.Item.password;
        bcrypt.compare(req.body.password, hash, function (err, correct) {
          if (err) {
            console.log(err);
            Lib.error(res, req, err);
          }
          if (correct) {
            res.cookie('id_token', result.Item.user, { signed: true, httpOnly: true, sameSite: 'strict' });
            res.redirect(302, '/');
          } else {
            Lib.error(res, req, 'Incorrect password or username');
          }
        });
      } else {
        Lib.error(res, req, 'User not found');
      }
    });
  }

  static logout(req, res, dynamoDb) {
    res.cookie('id_token', '', { expires: new Date() });
    res.redirect(302, '/');
  }

  /*
   * Verifies that the user is logged in.
   */
  static authenticate(req, res) {
    if (!req.signedCookies['id_token']) {
      res.redirect('/login');
      return false;
    } else {
      return true;
    }
  }

  /*
   * Verifies that the user is logged in.
   */
  static authenticate(req) {
    if (!req.signedCookies['id_token']) {
      return false;
    } else {
      return true;
    }
  }
}
module.exports = Login;
