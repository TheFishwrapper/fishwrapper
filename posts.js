const POSTS_TABLE = process.env.POSTS_TABLE;
var markdown = require("markdown").markdown;

class Posts {

  static index(req, res, bucket, dynamoDb) {
    const params = { TableName: POSTS_TABLE };
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else {
        var pols = [];
        var local = [];
        var current = [];
        for (var i = 0; result && i < result.Items.length; i++) {
          if (result.Items[i].category == 'Politics') {
            pols.push(result.Items[i]);
          } else if (result.Items[i].category == 'Local') {
            local.push(result.Items[i]);
          } else if (result.Items[i].category == 'Current Events') {
            current.push(result.Items[i]);
          }
          result.Items[i].content = markdown.toHTML(result.Items[i].content);
        }
        res.render('posts/index', {bucket: bucket, req: req,
                                   politics: pols, local: local,
                                   current: current, features: null});
      }
    });
  } 

  static read(req, res, bucket, dynamoDb) {
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
      }
      if (result.Item) {
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
    if (Posts.authenticate(req, res)) {
      const post = Posts.parse(req.body);
      post.postId = post.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-');
      if (post) {
        const params = {
          TableName: POSTS_TABLE,
          Item: {
            postId: post.postId,
            title: post.title,
            category: post.category,
            author: post.author,
            published_on: post.published_on,
            content: post.content,
            staging: post.staging 
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
  
  static edit(req, res, bucket, dynamoDb) {
    if (Posts.authenticate(req, res)) {
      const params = {
        TableName: POSTS_TABLE,
        Key: {
          postId: req.params.postId
        }
      }

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

  static new_post(req, res, bucket, dynamoDb) {
    if (Posts.authenticate(req, res)) {
      const post = {
        staging: true,
        postId: 10 
      };
      res.render('posts/new', {bucket: bucket, req: req, post: post});
    }
  }

  static update(req, res, bucket, dynamoDb) {
    if (Posts.authenticate(req, res)) {
      const post = Posts.parse(req.body);
      if (post) {
        const params = {
          TableName: POSTS_TABLE,
          Key: {
            postId: post.postId
          },
          UpdateExpression: 'SET title = :title, author = :author, category = :category, published_on = :published_on, content = :content, staging = :staging',
          ExpressionAttributeValues: {
            ':title': post.title,
            ':author': post.author,
            ':category': post.category,
            ':published_on': post.published_on,
            ':content': post.content,
            ':staging': post.staging
          },
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

  static parse(body) {
    var post = new Object();
    post.postId = body.postId;
    post.title = body.title;
    post.author = body.author;
    post.published_on = body.published_on;
    post.content = body.content;
    post.category = body.category;
    post.staging = new Boolean(body.staging).valueOf();
    var error = '';
    error += Posts.validate(post.postId, 'string');
    error += Posts.validate(post.title, 'string');
    error += Posts.validate(post.author, 'string'); 
    error += Posts.validate(post.published_on, 'string');
    error += Posts.validate(post.content, 'string');
    error += Posts.validate(post.category, 'string');
    if (error) {
      console.log();
      console.log(error);
      return null;
    }
    return post;
  }

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
   * Verifies that the user is logged in.
   */
  static authenticate(req, res) {
    if (!req.signedCookies['id_token']) {
      res.redirect(302, '/login');
      return false;
    } else {
      return true;
    }
  }
}
module.exports = Posts;
