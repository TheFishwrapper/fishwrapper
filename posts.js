const POSTS_TABLE = process.env.POSTS_TABLE;
const bucket = process.env.S3_BUCKET;
const Login = require('./login');
var markdown = require("markdown").markdown;

class Posts {

  static index(req, res, dynamoDb) {
    const params = { TableName: POSTS_TABLE };
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else {
        dynamoDb.scan({ TableName: process.env.FEATS_TABLE }, (err, resul) => {
          var posts = result.Items.filter(p => !p.staging);
          posts.sort((a, b) => new Date(b.published_on) - new Date(a.published_on));
          var pols = [];
          var local = [];
          var current = [];
          var feats = resul.Items.sort((a, b) => a.index - b.index);
          for (var i = 0; result && i < posts.length; i++) {
            if (posts[i].category == 'Politics') {
              pols.push(posts[i]);
            } else if (posts[i].category == 'Local') {
              local.push(posts[i]);
            } else if (posts[i].category == 'Current Events') {
              current.push(posts[i]);
            }
            posts[i].content = markdown.toHTML(posts[i].content);
            for (var j = 0; j < feats.length; j++) {
               if (posts[i].postId == feats[j].post) {
                 feats[j].title = posts[i].title;
                 feats[j].thumbnail = posts[i].thumbnail;
              }
            }
          }
          res.render('posts/index', {bucket: bucket, req: req,
                                     politics: pols, local: local,
                                     current: current, features: feats});
      });
      }
    });
  } 

  static read(req, res, dynamoDb) {
    const params = {
      TableName: POSTS_TABLE,
      Key: {
        postId: req.params.postId
      },
    }

    dynamoDb.get(params, (error, result) => {
      if (error) {
        console.log(error);
        res.status(400).json({ error: 'Could not get post' });
      } else if (result && result.Item) {
        if (result.Item.content) {
          result.Item.content = markdown.toHTML(result.Item.content);
        }
        res.render('posts/show', {bucket: bucket, req: req, post: result.Item});
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    }); 
  }

  static create(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const post = Posts.parse(req.body);
      post.postId = post.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-');
      if (post && req.file) {
        const params = {
          TableName: POSTS_TABLE,
          Item: {
            postId: post.postId,
            title: post.title,
            category: post.category,
            author: post.author,
            published_on: post.published_on,
            content: post.content,
            staging: post.staging,
            thumbnail: req.file.location,
            thumbnail_credit: post.thumbnail_credit 
          },
        };

        dynamoDb.put(params, (error) => {
          if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not create post' });
          } else {
            res.redirect('/posts/' + post.postId);
          }
        });
      } else {
        res.status(400).json({error: 'Invalid post arguments'});
      }
    }
  }
  
  static edit(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: POSTS_TABLE,
        Key: {
          postId: req.params.postId
        }
      };

      dynamoDb.get(params, (error, result) => {
        if (error) {
          console.log(error);
          res.status(400).json({ error: 'Could not get post' });
        }
        if (result.Item) {
          res.render('posts/edit', {bucket: bucket, req: req, post: result.Item});
        } else {
          res.status(404).json({ error: "Post not found" });
        }
      });
    }
  } 

  static new_post(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const post = {
        staging: true,
        postId: 10 
      };
      res.render('posts/new', {bucket: bucket, req: req, post: post});
    }
  }

  static update(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const post = Posts.parse(req.body);
      let params;
      if (post) {
        if (req.file) {
          params = {
            TableName: POSTS_TABLE,
            Key: {
              postId: post.postId
            },
            UpdateExpression: 'SET title = :title, author = :author, category = :category, published_on = :published_on, content = :content, staging = :staging, thumbnail = :thumbnail, thumbnail_credit = :thumbnail_credit',
            ExpressionAttributeValues: {
              ':title': post.title,
              ':author': post.author,
              ':category': post.category,
              ':published_on': post.published_on,
              ':content': post.content,
              ':staging': post.staging,
              ':thumbnail': req.file.location,
              ':thumbnail_credit': post.thumbnail_credit
            },
          }
        } else {
          params = {
            TableName: POSTS_TABLE,
            Key: {
              postId: post.postId
            },
            UpdateExpression: 'SET title = :title, author = :author, category = :category, published_on = :published_on, content = :content, staging = :staging, thumbnail_credit = :thumbnail_credit',
            ExpressionAttributeValues: {
              ':title': post.title,
              ':author': post.author,
              ':category': post.category,
              ':published_on': post.published_on,
              ':content': post.content,
              ':staging': post.staging,
              ':thumbnail_credit': post.thumbnail_credit
            },
          }
        }
        dynamoDb.update(params, (error) => {
          if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not update post' });
          } else {
            res.redirect('/posts/' + post.postId);
          }
        });
      } else {
        res.status(400).json({error: 'invalid arguments'});
      }
    }
  }

  static destroy(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: POSTS_TABLE,
        Key: {
          postId: req.params.postId
        }
      };
      dynamoDb.delete(params, function (err, data) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: 'Could not find post' });
        } else {
          res.redirect(302, '/');
        }
      });
    }
  }

  static staging(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const params = {
        TableName: POSTS_TABLE,
        FilterExpression: 'staging = :val',
        ExpressionAttributeValues: {
          ':val': true
        } 
      };
      dynamoDb.scan(params, function (err, data) {
        if (err) {
          console.log(err);
          res.status(400).json({ error: err });
        } else {
          data.Items.map(p => p.content = markdown.toHTML(p.content));
          var left = data.Items.slice(0, data.Count / 2);
          var center = data.Items.slice(data.Count / 2);
          res.render('posts/subindex', {bucket: bucket, heading: 'Staging', left: left, center: center});
        }
      });
    }
  }

  /*
   * Finds and returns all posts in the specified category.
   *
   * Post-conditions: returns null if there was an error or no posts were
   *                  found.
   */
  static find_category(category, dynamoDb) {
    const params = {
      TableName: POSTS_TABLE,
      KeyConditionExpression: "category = :c" ,
      ExpressionAttributeValues: {
        ":c": category 
      }
    } 
  
    dynamoDb.query(params, (error) => {
      if (error) {
        console.log(error);
        return null;
      } else {
        console.log(result);
        return result.Items;
      }
    });
  }

  /*
   * Parses the body of the posts form and returns an object with all
   * of the fields of the form.
   */
  static parse(body) {
    var post = new Object();
    post.postId = body.postId;
    post.title = body.title;
    post.author = body.author;
    post.published_on = body.published_on;
    post.content = body.content;
    post.category = body.category;
    post.staging = (body.staging) ? true : false;
    post.thumbnail_credit = body.thumbnail_credit;
    var error = '';
    error += Posts.validate(post.postId, 'string');
    error += Posts.validate(post.title, 'string');
    error += Posts.validate(post.author, 'string'); 
    error += Posts.validate(post.published_on, 'string');
    error += Posts.validate(post.content, 'string');
    error += Posts.validate(post.category, 'string');
    error += Posts.validate(post.thumbnail_credit, 'string');
    if (error) {
      console.log();
      console.log(error);
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
   * Joins the features and posts tables so that each feature has the full
   * contents of the respective posts.
   */
  static joinFeats(dynamoDb, cb) {
    dynamoDb.scan({TableName: process.env.FEATS_TABLE}, (err, res) => {
      if (err) {
        console.log(err);
        cb(null);
      } else {
        var feats = [];
        for (var i = 0; i < res.Items.length; i++) {
          const params = { 
            TableName: POSTS_TABLE, 
            Key: {
              postId: res.Items[i].post
            }
          };
          dynamoDb.get(params, (e, r) => {
            if (e) {
              console.log(e);
              cb(null);
            } else {
              feats.push(r);
            }
          });
        }
        console.log(feats);
        cb(feats);
      }
    });
  }
}

module.exports = Posts;
