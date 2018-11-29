# Contributing to The Fishwrapper

Before submitting any code make sure it fits with our [style guide](#style) and
the [flow](#flow) of this app.

## Flow

This app works by sending all recieved HTTP requests to the index.js file. The
express app inside index.js. This app redirects all requests to their respective
js file holding the respective controller. For example, all appropriate requests
to "/posts" should be sent to the Posts controller located in posts.js. Any
requests that are not directly related to a controller action will be sent an
error page from the app that the page does not exist. An example of the desired
flow can be see in the diagram below:
![Flow Diagram](https://s3.amazonaws.com/fishwrapper-assets-dev/FishwrapperInteractions.png)

The setup of this app is loosely based around the MVC model so each new data
model should have its own controller, which should also be in its own .js file.
All requests should be redirected in the index.js file but nearly all work
should be done in the controller files.

### Callbacks

There is a large amount of asynchronous work that is being done in this app with
plenty of database calls. As such the controllers will return from their
functions by using the callback function given to them from index.js. This
function currently has three paramters:

```javascript
callback(action, page, obj)
```

The `action` parameter can be one of three actions `render`, `redirect`, or
`cookie`.

#### Render

The `render` action renders the template passed in as the `page` parameter and
uses the `obj` object to pass in other objects the the template needs to render
such as data from the database of metadata for a post.

Example: `callback('render', 'posts/show', {post: ...});` to render a post.

#### Redirect

The `redirect` action redirects the user to the url in the `page` parameter and
does not use the `obj` object at all.

Example: `callback('redirect', '/login');` to redirect a user to the login page.

#### Cookie

The `cookie` action is used to set a cookie in the user's browser and to also
redirect the user to the url in the `page` parameter. The `obj` object is used
to pass the data that should be stored in a cookie.

Example: `callback('cookie', '/', {cookie: 'name', value: 'Joe', options: ...});`
would redirect the user to the index page and set the cookie name='Joe'. Look
at login.js for more examples of how the `cookie` action is used.

## Style

For all source code files:
- Each line should be no more than 80 characters
- For indentation use 2 spaces (**no tabs**)
- Try to keep code as clean as possible

## Testing

All controller .js files should have a corresponding mocha test in the test/
directory. Furthermore, test-driven development should be used whenever possible
writing failing tests for the controllers before actually implementing them.
Unit tests should have at least 90% code coverage. To run tests check the README
