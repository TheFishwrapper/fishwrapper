/*
 * Controller class for video objects.
 */
class Videos {

  /*
   * Renders an index page with all the video objects.
   */
  static index(req, dynamoDb, callback) {
  }

  /*
   * Renders a video object.
   */
  static show(req, dyanmoDb, callback) {
  }

  /*
   * Renders a form to create a new video object.
   * NOTE:
   *   User must be logged in.
   */
  static new_video(req, dyanmoDb, callback) {
  }

  /*
   * Creates a new video object and redirects to the video index.
   * NOTE:
   *   User must be logged in.
   */
  static create(req, dynamoDb, callback) {
  }

  /*
   * Renders a form to edit a pre-existing video object.
   * NOTE:
   *   User must be logged in.
   */
  static edit(req, dynamoDb, callback) {
  }

  /*
   * Updates a video object and redirects to the video index.
   * NOTE:
   *   User must be logged in.
   */
  static update(req, dynamoDb, callback) {
  }

  /*
   * Deletes a video object and redirects to the video index.
   * NOTE:
   *   User must be logged in.
   */
  static destroy(req, dyanmoDb, callback) {
  }
}
module.exports = Videos;
