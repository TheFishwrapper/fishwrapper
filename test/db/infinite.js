/*
 * Copyright 2019 Zane Littrell
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
const dotenv = require("dotenv");
const AWS = require("aws-sdk");

const result = dotenv.config({ path: process.cwd() + "/test/.env" });
if (result.error) {
  throw result.error;
}

const db = new AWS.DynamoDB.DocumentClient({
  region: "localhost",
  endpoint: "http://localhost:8000"
});

class InfiniteDB {
  static put(id, content, week, selected) {
    const params = {
      TableName: process.env.TIME_TABLE,
      Item: {
        id: id,
        content: content,
        week: week
      }
    };
    if (selected) {
      params.Item.selected = selected;
    }
    return db.put(params).promise();
  }

  static get(id) {
    const params = {
      TableName: process.env.TIME_TABLE,
      Key: {
        id: id
      }
    };
    return db.get(params).promise();
  }

  static scan() {
    const params = {
      TableName: process.env.TIME_TABLE
    };
    return db.scan(params).promise();
  }

  static delete(id) {
    const params = {
      TableName: process.env.TIME_TABLE,
      Key: {
        id: id
      }
    };
    return db.delete(params).promise();
  }
}

module.exports = InfiniteDB;
