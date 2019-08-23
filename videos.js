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
const Login = require('./login');

/*
 * Controller class for video objects.
 */
class Videos {

  /*
   * Renders an index page with all the video objects.
   */
  static index(req, dynamoDb, callback) {
    const params = {TableName: process.env.VIDEO_TABLE};
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else {
        callback('render', 'videos/index', {videos: result.Items});
      }
    })
  }

  /*
   * Renders a video object.
   */
  static show(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.VIDEO_TABLE,
      Key : {
        videoId: req.params.videoId
      }
    };
    dynamoDb.get(params, (error, result) => {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else {
        callback('render', 'videos/show', {video: result.Item});
      }
    })
  }

  /*
   * Renders a form to create a new video object.
   * NOTE:
   *   User must be logged in.
   */
  static new_video(req, dyanmoDb, callback) {
    if (Login.authenticate(req)) {
      callback('render', 'videos/new');
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Creates a new video object and redirects to the video index.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      if (!req.body.title || !req.body.link) {
        callback('render', 'error', {error: "Missing title or link"});
      } else {
        const params = {
          TableName: process.env.VIDEO_TABLE,
          Item: {
            videoId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
            title: req.body.title,
            link: req.body.link
          }
        };
        dynamoDb.put(params, (error) => {
          if (error) {
            console.error(error);
            callback('render', 'error', {error: error});
          } else {
            callback('redirect', '/videos');
          }
        });
      }
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a form to edit a pre-existing video object.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.VIDEO_TABLE,
        Key: {
          videoId: req.params.videoId
        }
      };
      dynamoDb.get(params, (error, result) => {
        if (error) {
          callback('render', 'error', {error: error});
        } else {
          callback('render', 'videos/edit', {video: result.Item});
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates a video object and redirects to the video index.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.VIDEO_TABLE,
        Key: {
          videoId: req.body.videoId
        },
        UpdateExpression: 'SET link = :link, title = :title',
        ExpressionAttributeValues: {
          ':link': req.body.link,
          ':title': req.body.title
        }
      };
      dynamoDb.update(params, (error) => {
        if (error) {
          console.error(error);
          callback('render', 'error', {error:error});
        } else {
          callback('redirect', '/videos');
        }
      })
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Deletes a video object and redirects to the video index.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.VIDEO_TABLE,
        Key: {
          videoId: req.params.videoId
        }
      };
      dynamoDb.delete(params, (error) => {
        if (error) {
          console.error(error);
          callback('render', 'error', {error: error});
        } else {
          callback('redirect', '/videos');
        }
      })
    } else {
      callback('redirect', '/login')
    }
  }
}
module.exports = Videos;
