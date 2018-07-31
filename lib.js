const bucket = process.env.S3_BUCKET;

class Lib {

  static error(res, errorMessage) {
    res.render('error', {bucket: bucket, error: errorMessage});
  }
}
module.exports = Lib;
