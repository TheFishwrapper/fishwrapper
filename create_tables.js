const AWS = require('aws-sdk');

const IS_OFFLINE = process.env.IS_OFFLINE;

let dynamodb;
if (IS_OFFLINE === 'true') {
  dynamodb = new AWS.DynamoDB({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamodb);
} else {
  dynamodb = new AWS.DynamoDB();
}

var postsParams = {
  TableName: 'posts-table-dev',
  KeySchema: [
    {
      AttributeName: 'postId',
      KeyType: 'HASH'
    }
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'postId',
      AttributeType: 'S'
    }
  ],
  ProvisionedThroughput: {
        ReadCapacityUnits: 1, 
        WriteCapacityUnits: 1, 
  }
};

dynamodb.createTable(postsParams, function(err, data) {
  if (err) console.log(err); // an error occurred
  else console.log(data); // successful response
});
