const FEATS_TABLE = process.env.FEATS_TABLE;
const bucket = process.env.S3_BUCKET;

class Features {

  static index(req, res, dynamoDb) {
    const params = { TableName: FEATS_TABLE };
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        res.json({ error: error });
      } else {
        res.json(result);
      }
    });
  }

  static new_feat(req, res, dynamoDb) {
    // TODO
  }

  static create(req, res, dynamoDb) {
    // TODO
  }

  static edit(req, res, dynamoDb) {
    // TODO
  }
}

module.exports = Features;
