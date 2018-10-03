const bucket = process.env.S3_BUCKET;

class Lib {

  static error(res, req, errorMessage) {
    Lib.render(res, req, 'error', {error: errorMessage});
  }

  static render(res, req, loc, obj) {
    res.render(loc, Object.assign({bucket: bucket, req: req}, obj));
  }

  static sitemap(req, res, dynamoDb) {
    res.type('application/xml');
    let out = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
    dynamoDb.scan({TableName: process.env.POSTS_TABLE}, function (err, data) {
      if (err) {
        console.log(err);
        res.send(`<error>${err}</error>`);
      } else {
        dynamoDb.scan({TableName: process.env.QUIZZES_TABLE}, function (er, dat) {
          if (er) {
            console.log(er);
            res.send(`<error>${er}</error>`);
          } else {
            for (let i = 0; i < data.Count; i++) {
              let post = data.Items[i];
              if (!post.staging) {
                out += '<url>';
                out += `<loc>https://thefishwrapper.news/posts/${escape(post.postId)}</loc>`;
                if (post.thumbnail) {
                  out += `<image:image><image:loc>${post.thumbnail}</image:loc></image:image>`;
                }
                out += '</url>';
              }
            }
            for (let i = 0; i < dat.Count; i++) {
              out += '<url>';
              let quiz = dat.Items[i];
              out += `<loc>https://thefishwrapper.news/quizzes/${escape(quiz.quizId)}</loc>`;
              if (quiz.thumbnail) {
                out += `<image:image><image:loc>${quiz.thumbnail}</image:loc></image:image>`;
              }
              out += '</url>';
            }
            out += '</urlset>';
            res.send(out);
          }
        });
      }
    });
  }
}
module.exports = Lib;
