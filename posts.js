const POSTS_TABLE = process.env.POSTS_TABLE;
const bucket = process.env.S3_BUCKET;
const Login = require('./login');
const Lib = require('./lib');
const markdown = require('markdown').markdown;
const SolrNode = require('solr-node');
const solr = new SolrNode({
  host: process.env.SOLR_SITE,
  port: process.env.SOLR_PORT,
  core: process.env.SOLR_CORE,
  protocol: 'http'
});

class Posts {

  static index(req, res, dynamoDb) {
    const params = { TableName: POSTS_TABLE };
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        console.log(error);
        Lib.error(res, req, error);
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
          dynamoDb.scan({ TableName: process.env.TIME_TABLE }, (e, d) => {
            if (e) {
              console.log(e);
              Lib.error(res, req, e);
            } else {
              let time = d.Items.filter(x => x.selected);
              time.sort((a, b) => a.week - b.week);
              dynamoDb.scan({ TableName: process.env.INSTA_TABLE }, (er, da) => {
                if (er) {
                  console.log(er);
                  Lib.error(res, req, er);
                } else {
                  Lib.render(res, req, 'posts/index', {req: req, politics: pols, local: local, 
                    current: current, features: feats, time: time, shorts: da.Items});
                }
              });
            }
          });
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
         Lib.error(res, req, error);
      } else if (result && result.Item) {
        if (result.Item.content) {
          result.Item.content = markdown.toHTML(result.Item.content);
        }
        Lib.render(res, req, 'posts/show', {req: req, post: result.Item});
      } else {
        Lib.error(res, req, 'Post not found');
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
            issue: post.issue,
            content: post.content,
            staging: post.staging,
            thumbnail: req.file.location,
            thumbnail_credit: post.thumbnail_credit 
          },
        };

        dynamoDb.put(params, (error) => {
          if (error) {
            console.log(error);
            Lib.error(res, req, 'Could not create post');
          } else {
            res.redirect('/posts/' + post.postId);
          }
        });
        Posts.solrPost(post);
      } else {
        Lib.error(res, req, 'Invalid post arguments');
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
          Lib.error(res, req, 'Could not get post');
        }
        if (result.Item) {
          Lib.render(res, req, 'posts/edit', {req: req, post: result.Item});
        } else {
          Lib.error(res, req, 'Post not found');
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
      Lib.render(res, req, 'posts/new', {req: req, post: post});
    }
  }

  static update(req, res, dynamoDb) {
    if (Login.authenticate(req, res)) {
      const post = Posts.parse(req.body);
      let params;
      if (post) {
        params = {
            TableName: POSTS_TABLE,
            Key: {
              postId: post.postId
            },
            UpdateExpression: 'SET title = :title, author = :author, category = :category, published_on = :published_on, issue = :issue, content = :content, staging = :staging, thumbnail_credit = :thumbnail_credit',
            ExpressionAttributeValues: {
              ':title': post.title,
              ':author': post.author,
              ':category': post.category,
              ':published_on': post.published_on,
              ':issue': post.issue,
              ':content': post.content,
              ':staging': post.staging,
              ':thumbnail_credit': post.thumbnail_credit
            },
        };
        if (req.file) {
          params.UpdateExpression += ',thumbnail = :thumbnail';
          params.ExpressionAttributeValues[':thumbnail'] = req.file.location;
        }
        dynamoDb.update(params, (error) => {
          if (error) {
            console.log(error);
            Lib.error(res, req, 'Could not update post');
          } else {
            res.redirect('/posts/' + post.postId);
          }
        });
        Posts.solrPost(post);
      } else {
        Lib.error(res, req, 'Invalid arguments');
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
          Lib.error(res, req, 'Could not find post');
        } else {
          res.redirect('/');
        }
      });
      solr.delete({id: req.params.postId}, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log('Solr response:', result.responseHeader);
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
          Lib.error(res, req, err);
        } else {
          data.Items.map(p => p.content = markdown.toHTML(p.content));
          var left = data.Items.slice(0, data.Count / 2);
          var center = data.Items.slice(data.Count / 2);
          Lib.render(res, req, 'posts/subindex', {heading: 'Staging', left: left, center: center});
        }
      });
    }
  }

  static category(req, res, dynamoDb) {
    const params = {
      TableName: POSTS_TABLE,
      FilterExpression: 'category = :val',
      ExpressionAttributeValues: {
        ':val': req.query.category
      }
    };
    dynamoDb.scan(params, function (err, data) {
      if (err) {
        console.log(err);
        Lib.error(res, req, err);
      } else {
        data.Items.map(p => p.content = markdown.toHTML(p.content));
        data.Items.sort((a, b) => new Date(b.published_on) - new Date(a.published_on));
        var left = data.Items.slice(0, data.Count / 2);
        var center = data.Items.slice(data.Count / 2);
        Lib.render(res, req, 'posts/subindex', {heading: req.query.category, left: left, center: center});
      }
    });
  }

  static search(req, res, dynamoDb) {
    let qstring;
    if (req.query.category) {
      qstring = 'category:' + req.query.category + ' AND ' + req.query.search; 
    } else {
      qstring = req.query.search;
    }
    solr.search('q='+ qstring).then(x => {
      let posts = x.response.docs.map(a => a.id);
      let ps = posts.map(p => Posts.idToPost(p, dynamoDb));
      Promise.all(ps).then(r => {
        let ar = r.map(a => a.Item).filter(a => !a.staging);
        const left = ar.slice(0, ar.length / 2);
        const center = ar.slice(ar.length / 2);
        Lib.render(res, req, 'posts/subindex', {heading: 'Search results', left: left, center: center});
      }); 
    }).catch(e => Lib.error(res, req, e)); 
  }

  static idToPost(id, dynamoDb) {
    let params = {
      TableName: POSTS_TABLE,
      Key: {
        postId: id 
      },
    };
    return dynamoDb.get(params).promise();
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
    post.issue = Number(body.issue);
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
        console.log('Solr error:', err);
      } else {
        console.log('Solr response:', resul.responseHeader);
      }
    });
  }
}
module.exports = Posts;
