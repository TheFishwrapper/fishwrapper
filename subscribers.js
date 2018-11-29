/*
 * Copyright 2018 Zane Littrell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const SUB_TABLE = process.env.SUBSCRIBERS_TABLE;
const bucket = process.env.S3_BUCKET;
const Lib = require('./lib');

class Subscribers {

  static new_subscriber(req, res, dynamoDb) {
    Lib.render(res, req, 'subscribers/new');
  }

  static create(req, res, dynamoDb) {
    let params = {
      TableName: SUB_TABLE, 
      Item: {
        email: req.body.email,
      }
    };
    if (req.body.phone) {
      params.Item.phone = req.body.phone;
    }
    dynamoDb.put(params, function (error) {
      if (error) {
        console.log(error);
        Lib.error(res, req, 'Could not create subscriber. Make sure a proper email is supplied.');
      } else {
        res.redirect('/');
      }
    });
  }

  static delete(req, res, dynamoDb) {
    Lib.render(res, req, 'subscribers/delete');
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
        Lib.error(res, req, 'Could not remove subscriber. Make sure a proper email is supplied.');
      } else { 
        res.redirect('/');
      }
    });
  }
}

module.exports = Subscribers;
