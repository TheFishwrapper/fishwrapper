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
const dotenv = require('dotenv');
const faker = require('faker');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');

const result = dotenv.config(
  { path: process.cwd() + '/test/.env' });
if (result.error) {
  throw result.error;
}

const db = new AWS.DynamoDB.DocumentClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000'
});

const username = faker.internet.userName();
const password = faker.internet.password();

class LoginDB {

  static get username() {
    return username;
  }

  static get password() {
    return password;
  }

  static getExample() {
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: {
        user: username
      }
    };
    return db.get(params).promise();
  }

  static putExample() {
    const params = {
      TableName: process.env.USERS_TABLE,
      Item: {
        user: username,
        password: bcrypt.hashSync(password)
      }
    };
    return db.put(params).promise();
  }

  static deleteExample() {
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: {
        user: username
      }
    };
    return db.delete(params).promise();
  }
}

module.exports = LoginDB;
