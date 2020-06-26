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
const Login = require("./login");

/*
 * Controller class for featured articles.
 */
class Features {
  /*
   * Renders the index page with all the featured articles.
   * NOTE:
   *   User must be logged in.
   */
  static index(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = { TableName: process.env.FEATS_TABLE };
      dynamoDb.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          callback("render", "error", { error: error });
        } else {
          callback("render", "features/index", {
            feats: result.Items.sort((a, b) => a.index - b.index)
          });
        }
      });
    } else {
      callback("redirect", "/login");
    }
  }

  /*
   * Renders a form to create a new featured article with a list of all the
   * current posts.
   * NOTE:
   *   User must be logged in.
   */
  static new_feat(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = { TableName: process.env.POSTS_TABLE };
      dynamoDb.scan(params, (error, result) => {
        if (error) {
          console.error(error);
          callback("render", "error", { error: error });
        } else {
          callback("render", "features/new", { posts: result.Items });
        }
      });
    } else {
      callback("redirect", "/login");
    }
  }

  /*
   * Creates a new featured article in the database from the given request and
   * redirects to the features index page if successful.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.FEATS_TABLE,
        Item: {
          index: parseInt(req.body.index, 10),
          post: req.body.post
        }
      };
      dynamoDb.put(params, error => {
        if (error) {
          console.error(error);
          callback("render", "error", { error: error });
        } else {
          callback("redirect", "/features");
        }
      });
    } else {
      callback("redirect", "/login");
    }
  }

  /*
   * Renders a form to edit the selected featured article.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.FEATS_TABLE,
        Key: {
          index: parseInt(req.params.index, 10)
        }
      };

      dynamoDb.get(params, (error, result) => {
        if (error) {
          console.error(error);
          callback("render", "error", { error: error });
        } else {
          if (result.Item) {
            dynamoDb.scan(
              { TableName: process.env.POSTS_TABLE },
              (err, resul) => {
                if (err) {
                  console.error(err);
                  callback("render", "error", { error: err });
                } else {
                  let posts = resul.Items.map(x => {
                    x.sel = x.postId == result.Item.post;
                    return x;
                  });
                  callback("render", "features/edit", {
                    posts: posts,
                    feat: result.Item
                  });
                }
              }
            );
          } else {
            callback("render", "error", {
              error: "Featured article not found"
            });
          }
        }
      });
    } else {
      callback("redirect", "/login");
    }
  }

  /*
   * Updates a featured article in the database from the given request and
   * redirects to the features index page if successful.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.FEATS_TABLE,
        Key: {
          index: parseInt(req.body.index, 10)
        },
        UpdateExpression: "SET post = :post",
        ExpressionAttributeValues: {
          ":post": req.body.post
        }
      };
      dynamoDb.update(params, error => {
        if (error) {
          console.error(error);
          callback("render", "error", {
            error: "Could not update featured article"
          });
        } else {
          callback("redirect", "/features");
        }
      });
    } else {
      callback("redirect", "/login");
    }
  }

  /*
   * Deletes the selected featured article from the database and redirects
   * to the features index page if successful.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.FEATS_TABLE,
        Key: {
          index: parseInt(req.params.index, 10)
        }
      };
      dynamoDb.delete(params, (err, data) => {
        if (err) {
          console.error(err);
          callback("render", "error", {
            error: "Could not find featured article"
          });
        } else {
          callback("redirect", "/features");
        }
      });
    } else {
      callback("redirect", "/login");
    }
  }
}
module.exports = Features;
