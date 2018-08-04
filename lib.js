const bucket = process.env.S3_BUCKET;

class Lib {

  static error(res, req, errorMessage) {
    Lib.render(res, req, 'error', {error: errorMessage});
  }

  static render(res, req, loc, obj) {
    res.render(loc, Object.assign({bucket: bucket, req: req}, obj));
  }

}
module.exports = Lib;
