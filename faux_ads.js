/*
 * Copyright 2020 Zane Littrell
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
const Login = require('./login');

/*
 * Controller class for faux ad objects.
 */
class FauxAds {

  /*
   * Renders an index page with all the faux ad objects.
   * NOTE:
   *   User must be logged in.
   */
  static index(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {TableName: process.env.ADS_TABLE};
      dynamoDb.scan(params).promise()
      .then((data) => {
        callback('render', 'faux_ads/index', {ad: data.Item});
      }).catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a faux ad object.
   * NOTE:
   *   User must be logged in.
   */
  static show(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ADS_TABLE,
        Key : {
          adId: req.params.adId
        }
      };
      dynamoDb.get(params).promise()
      .then((data) => {
        callback('render', 'faux_ads/show', {ad: data.Item});
      }).catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a form to create a new faux ad object.
   * NOTE:
   *   User must be logged in.
   */
  static new_ad(req, dyanmoDb, callback) {
    if (Login.authenticate(req)) {
      callback('render', 'faux_ads/new');
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Creates a new faux ad object and redirects to the faux ad index on success.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      if (!req.body.title || !req.body.photo || !req.body.altText) {
        callback('render', 'error', {error: "Missing title, photo, or altText"});
      } else {
        const params = {
          TableName: process.env.ADS_TABLE,
          // TODO: figure out how the correct Item params
          Item: {
            adId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
            title: req.body.title,
            photo: req.body.photo,
            altText: req.body.altText
          }
        };
        dynamoDb.put(params).promise()
        .then((data) => {
          callback('redirect', '/faux_ads');
        }).catch((error) => {
          console.error(error);
          callback('render', 'error', {error: error});
        });
      }
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a form to edit a pre-existing faux ad object.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ADS_TABLE,
        Key: {
          adId: req.params.adId
        }
      };
      dynamoDb.get(params).promise()
      .then((data) => {
        callback('render', 'faux_ads/edit', {ad: result.Item});
      }).catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates a faux ad object and redirects to the faux ad index on success.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.ADS_TABLE,
        Key: {
          adId: req.body.adId
        },
        UpdateExpression: 'SET title = :title, photo = :photo,'
          + ' altText = :altText',
        ExpressionAttributeValues: {
          ':title': req.body.title,
          ':photo': req.body.photo,
          ':altText': req.body.altText
        }
      };
      dynamoDb.update(params).promise()
      .then((data) => {
        console.error(error);
        callback('render', 'error', {error: error});
      }).catch((error) => {
        callback('redirect', '/faux_ads');
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Deletes a faux ad object and redirects to the faux ad index on success.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.VIDEO_TABLE,
        Key: {
          adId: req.params.adId
        }
      };
      dynamoDb.delete(params).promise()
      .then((data) => {
        callback('redirect', '/faux_ads');
      }).catch((error) => {
        console.error(error);
        callback('render', 'error', {error: error});
      });
    } else {
      callback('redirect', '/login');
    }
  }

}

module.exports = FauxAds;
