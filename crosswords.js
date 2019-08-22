const Login = require('./login');
const markdown = require('markdown').markdown;

/*
 * Controller class for crossword objects.
 */
class Crosswords {

  /*
   * Renders an index page with all the crossword objects.
   */
  static index(req, dynamoDb, callback) {
    const params = {TableName: process.env.CROSS_TABLE};
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else {
        callback('render', 'crosswords/index', {crosswords: result.Items});
      }
    });
  }

  /*
   * Renders a crossword object.
   */
  static show(req, dynamoDb, callback) {
    const params = {
      TableName: process.env.CROSS_TABLE,
      Key: {
        crossId: req.params.crossId
      }
    };
    dynamoDb.get(params, (error, result) => {
      if (error) {
        console.error(error);
        callback('render', 'error', {error: error});
      } else {
        result.Item.solution = markdown.toHTML(result.Item.solution);
        callback('render', 'crosswords/show', {crossword: result.Item});
      }
    });
  }

  /*
   * Renders a form to create a new crossword object.
   * NOTE:
   *   User must be logged in.
   */
  static new_cross(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      callback('render', 'crosswords/new');
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Creates a new crossword object.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      if (!req.body.title) {
        callback('render', 'error', {error: 'Title is missing'});
      } else {
        const params = {
          TableName: process.env.CROSS_TABLE,
          Item: {
            crossId: req.body.title.toLocaleLowerCase().substr(0, 20).replace(/\s/g, '-'),
            title: req.body.title,
            solution: req.body.solution
          }
        };
        dynamoDb.put(params, (error) => {
          if (error) {
            console.error(error);
            callback('render', 'error', {error: error});
          } else {
            callback('redirect', '/crosswords');
          }
        });
      }
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Renders a form to edit a pre-existing crossword object.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.CROSS_TABLE,
        Key: {
          crossId: req.params.crossId
        }
      };
      dynamoDb.get(params, (error, result) => {
        if (error) {
          callback('render', 'error', {error: error});
        } else {
          callback('render', 'crosswords/edit', {crossword: result.Item});
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Updates a crossword object.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.CROSS_TABLE,
        Key: {
          crossId: req.body.crossId
        },
        UpdateExpression: 'SET solution = :solution, title = :title',
        ExpressionAttributeValues: {
          ':solution': req.body.solution,
          ':title': req.body.title
        }
      };
      dynamoDb.update(params, (error) => {
        if (error) {
          console.error(error);
          callback('render', 'error', {error: error});
        } else {
          callback('redirect', '/crosswords');
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }

  /*
   * Deletes the selected crossword object.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dynamoDb, callback) {
    if (Login.authenticate(req)) {
      const params = {
        TableName: process.env.CROSS_TABLE,
        Key: {
          crossId: req.params.crossId
        }
      };
      dynamoDb.delete(params, (error) => {
        if (error) {
          console.error(error);
          callback('render', 'error', {error: error});
        } else {
          callback('redirect', '/crosswords');
        }
      });
    } else {
      callback('redirect', '/login');
    }
  }
}
module.exports = Crosswords;
