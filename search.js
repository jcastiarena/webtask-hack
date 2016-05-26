'use latest';

var querystring = require('querystring'),
    https = require('https'),
    host = 'api.mercadolibre.com',
    handlebars = require('handlebars');

var View = `
<html>
  <head>
    <title>MELI API Proxy</title>
  </head>
  <body>
    <h1 style='text-align:center'>{{results.length}} results found for <div style='color:blue'>'{{query}}'</div></h1>
    {{#if results.length}}
      <ul>
        {{#each results}}
          <li><div><img src={{this.thumbnail}} /><a href={{this.permalink}} target='_blank'> {{this.title}} </a><strong style='color:red'>ARS {{this.price}}</strong></div></li>
        {{/each}}
      </ul>
    {{else}}
      <h1>No results :(</h1>
    {{/if}}
  </body>
</html>
`;

function doRequest(endpoint, method, data, err, success) {
  console.log('doRequest!');

  let dataString = JSON.stringify(data),
      headers = {};

  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  } else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }
  endpoint = endpoint.endsWith('?') ? endpoint.slice(0, -1) : endpoint;

  let options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };

  console.log('req options: ', options);
  let req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    let responseString = '';
    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      var responseObject = JSON.parse(responseString);
      success(responseObject);
    });

    res.on('error', function onError(err) {
        console.log('Error: ', err);
        err(err);
    });
  });

  req.write(dataString);
  req.end();
}


//module.exports = function (ctx, done) {
return (ctx, req, res) => {
  console.log('search handler!', ctx.data.query);
  let offset = 0;
  let limit = 50;
  let query = escape(ctx.data.query);

  doRequest('/sites/MLA/search?q=' + query + '&limit=' + limit, 'GET', {},
    function error(err) {
      return res.end(err);
    },
    function success(response) {
      if (response.results) {
        //console.log('MELI data: ', response.results);
        //done(null, response.results);
        const view_ctx = {
          results: response.results,
          query: unescape(query)
        };

        const template = handlebars.compile(View);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(template(view_ctx));
      }
  });
}
