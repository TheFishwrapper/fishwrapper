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
const MarkdownIt = require('markdown-it');
const markdown = new MarkdownIt({ html: true });
const SolrNode = require('solr-node');
const solr = new SolrNode({
  host: process.env.SOLR_SITE,
  port: process.env.SOLR_PORT,
  core: process.env.SOLR_CORE,
  protocol: 'http'
});

class Posts {

  /*
   * Renders the index page of the website with three columns of posts and two
   * carousels, one of features, another of instashorts.
   */
  static index(req, dynamoDb, callback) {
    const params = {TableName: process.env.POSTS_TABLE};
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else {
        dynamoDb.scan({TableName: process.env.FEATS_TABLE}, (err, resul) => {
          // Remove posts in staging and sort by published date
          var posts = result.Items.filter(p => !p.staging);
          posts.sort((a, b) => new Date(b.published_on)
            - new Date(a.published_on));
          var pols = [];
          var local = [];
          var current = [];
          var feats = resul.Items.sort((a, b) => a.index - b.index);
          // Sort posts by category
          for (var i = 0; result && i < posts.length; i++) {
            if (posts[i].category == 'Politics') {
              pols.push(posts[i]);
            } else if (posts[i].category == 'Local') {
              local.push(posts[i]);
            } else if (posts[i].category == 'Current Events') {
              current.push(posts[i]);
            }
            posts[i].content = markdown.render(posts[i].content);
            posts[i].title = markdown.renderInline(posts[i].title);
            // Join posts and features
            for (var j = 0; j < feats.length; j++) {
               if (posts[i].postId == feats[j].post) {
                 feats[j].title = posts[i].title;
                 feats[j].thumbnail = posts[i].thumbnail;
              }
            }
          }
          dynamoDb.scan({TableName: process.env.TIME_TABLE}, (e, d) => {
            if (e) {
              console.error(e);
              callback('render', 'error', {error: error});
            } else {
              // Sort infinite timeline stories by week
              let time = d.Items.filter(x => x.selected);
              time.sort((a, b) => a.week - b.week);
              dynamoDb.scan({TableName: process.env.INSTA_TABLE}, (er, da) => {
                if (er) {
                  console.error(er);
                  callback('render', 'error', {error: error});
                } else {
                  callback('render', 'posts/index', {politics: pols,
                    local: local, current: current, features: feats, time: time,
                    shorts: da.Items});
                }
              });
            }
          });
        });
      }
    });
  }

  /*
   * Renders a single specified post.
   */
  static read(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.POSTS_TABLE,
      Key: {
        postId: req.params.postId
      }
    };
    dynamoDb.get(params, (error, result) => {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else if (result && result.Item) {
        result.Item.content = markdown.render(result.Item.content);
        result.Item.title = markdown.renderInline(result.Item.title);
        callback('render', 'posts/show', {post: result.Item});
      } else {
        callback('render', 'error', {error: 'Post not found'});
      }
    });
  }

  /*
   * Creates a post and redirects on success.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const post = Posts.parse(req.body);
      post.postId = post.title.toLocaleLowerCase().substr(0, 20)
        .replace(/\s/g, '-');
      if (post && req.file) {
        const params = {
          TableName: process.env.POSTS_TABLE,
          Item: {
            postId: post.postId,
            title: post.title,
            category: post.category,
            author: post.author,
            published_on: post.published_on,
            issue: post.issue,
            content: post.content,
            staging: post.staging,
            thumbnail: req.file.location,
            thumbnail_credit: post.thumbnail_credit,
            postStyle: post.postStyle
          },
        };

        dynamoDb.put(params, (error) => {
          if (error) {
            console.error(error);
            callback('render', 'error', {error: 'Could not create post'});
          } else {
            callback('redirect', '/posts/' + post.postId);
          }
        });
        Posts.solrPost(post);
      } else {
        callback('render', 'error', {error: 'Invalid post arguments'});
      }
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a form to edit the specified post.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.POSTS_TABLE,
        Key: {
          postId: req.params.postId
        }
      };

      dynamoDb.get(params, (error, result) => {
        if (error) {
          console.error(error);
          callback('render', 'error', {error: 'Could not get post'});
        } else {
          if (result.Item) {
            callback('render', 'posts/edit', {post: result.Item});
          } else {
            callback('render', 'error', {error: 'Post not found'});
          }
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a form to create a new post.
   * NOTE:
   *   User must be logged in.
   */
  static new_post(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const post = {
        staging: true,
        postId: 10
      };
      callback('render', 'posts/new', {post: post});
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates the specified post and redirects on a success.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const post = Posts.parse(req.body);
      let params;
      if (post) {
        params = {
            TableName: process.env.POSTS_TABLE,
            Key: {
              postId: post.postId
            },
            UpdateExpression: 'SET title = :title, author = :author, category' +
              ' = :category, published_on = :published_on, issue = :issue, ' +
              'content = :content, staging = :staging, thumbnail_credit = ' +
              ':thumbnail_credit, postStyle = :postStyle',
            ExpressionAttributeValues: {
              ':title': post.title,
              ':author': post.author,
              ':category': post.category,
              ':published_on': post.published_on,
              ':issue': post.issue,
              ':content': post.content,
              ':staging': post.staging,
              ':thumbnail_credit': post.thumbnail_credit,
              ':postStyle': post.postStyle
            },
        };
        if (req.file) {
          params.UpdateExpression += ',thumbnail = :thumbnail';
          params.ExpressionAttributeValues[':thumbnail'] = req.file.location;
        }
        dynamoDb.update(params, (error) => {
          if (error) {
            console.error(error);
            callback('render', 'error', {error: 'Could not update post'});
          } else {
            callback('redirect', '/posts/' + post.postId);
          }
        });
        Posts.solrPost(post);
      } else {
        callback('render', 'error', {error: 'Invalid arguments'});
      }
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Deletes the specified post and redirects on success.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.POSTS_TABLE,
        Key: {
          postId: req.params.postId
        }
      };
      dynamoDb.delete(params, function (err, data) {
        if (err) {
          console.error(err);
          callback('render', 'error', {error: 'Could not find post'});
        } else {
          callback('redirect', '/');
        }
      });
      solr.delete({id: req.params.postId}, function (err, result) {
        if (err) {
          console.error(err);
        } else {
          console.log('Solr response:', result.responseHeader);
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a page of all posts that are in the staging area.
   * NOTE:
   *   User must be logged in.
   */
  static staging(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.POSTS_TABLE,
        FilterExpression: 'staging = :val',
        ExpressionAttributeValues: {
          ':val': true
        }
      };
      dynamoDb.scan(params, function (err, data) {
        if (err) {
          console.error(err);
          callback('render', 'error', {error: err});
        } else {
          data.Items.map(p => {
            p.content = markdown.render(p.content);
            p.title = markdown.renderInline(p.title);
          });
          let left = data.Items.slice(0, data.Count / 2);
          let center = data.Items.slice(data.Count / 2);
          callback('render', 'posts/subindex', {heading: 'Staging', left: left,
            center: center});
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a page of all posts in the specified category.
   */
  static category(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.POSTS_TABLE,
      FilterExpression: 'category = :val',
      ExpressionAttributeValues: {
        ':val': req.query.category
      }
    };
    dynamoDb.scan(params, function (err, data) {
      if (err) {
        console.error(err);
        callback('render', 'error', {error: err});
      } else {
        let posts = data.Items.filter(p => !p.staging);
        posts.map(p => {
          p.content = markdown.render(p.content);
          p.title = markdown.renderInline(p.title);
        });
        posts.sort((a, b) => {
          return new Date(b.published_on) - new Date(a.published_on);
        });
        let left = posts.slice(0, data.Count / 2);
        let center = posts.slice(data.Count / 2);
        callback('render', 'posts/subindex', {heading: req.query.category,
          left: left, center: center});
      }
    });
  }

  /*
   * Renders a page of all posts that returned from the solr search.
   */
  static search(req, dynamoDb, callback) {
    let string = req.query.search;
    let qstring = 'title:' + string + ' OR ' + 'content:' + string + ' OR ' + 'author:' + string;
    if (req.query.category) {
      qstring = 'category:' + req.query.category + ' AND (' + qstring + ')';
    }
    solr.search('q='+ qstring).then(x => {
      let posts = x.response.docs.map(a => a.id);
      let ps = posts.map(p => Posts.idToPost(p, dynamoDb));
      Promise.all(ps).then(r => {
        let ar = r.map(a => a.Item).filter(a => !a.staging);
        ar.map(p => p.content = markdown.render(p.content));
        const left = ar.slice(0, ar.length / 2);
        const center = ar.slice(ar.length / 2);
        callback('render', 'posts/subindex', {heading: 'Search results',
          left: left, center: center});
      });
    }).catch(e => callback('reneder', 'error', {error: e}));
  }

  /*
   * Gets the post with the given id.
   * Parameters:
   *   id: postId of the post
   *   dynamoDb: database object to use
   * NOTE:
   *   Returns a promise.
   */
  static idToPost(id, dynamoDb) {
    let params = {
      TableName: process.env.POSTS_TABLE,
      Key: {
        postId: id
      },
    };
    return dynamoDb.get(params).promise();
  }

  /*
   * Parses the body of the posts form and returns an object with all of the
   * fields of the form.
   */
  static parse(body) {
    var post = new Object();
    post.postId = body.postId;
    post.title = body.title;
    post.author = body.author;
    post.published_on = body.published_on;
    post.issue = Number(body.issue);
    post.content = body.content;
    post.category = body.category;
    post.staging = (body.staging) ? true : false;
    post.thumbnail_credit = body.thumbnail_credit;
    post.postStyle = body.postStyle;
    var error = '';
    error += Posts.validate(post.postId, 'string');
    error += Posts.validate(post.title, 'string');
    error += Posts.validate(post.author, 'string');
    error += Posts.validate(post.published_on, 'string');
    error += Posts.validate(post.content, 'string');
    error += Posts.validate(post.category, 'string');
    error += Posts.validate(post.thumbnail_credit, 'string');
    error += Posts.validate(post.postStyle, 'string');
    if (error) {
      console.error(error);
      return null;
    }
    return post;
  }

  /*
   * Validates the type of a given variable.
   */
  static validate(param, type) {
    if (typeof param !== type) {
      return `"${param}" must be a ${type}\n`;
    } else if(type === 'string' && !param) {
      return `"${param}" is an empty string\n`;
    } else {
      return '';
    }
  }

  /*
   * Adds a post object to solr.
   */
  static solrPost(post) {
    const data = {
      id: post.postId,
      title: post.title,
      author: post.author.toLowerCase(),
      category: post.category,
      content: post.content
    };
    solr.update(data,  function (err, resul) {
      if (err) {
        console.error('Solr error:', err);
      } else {
        console.log('Solr response:', resul.responseHeader);
      }
    });
  }
}
module.exports = Posts;
