const http = require('http');

async function test() {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/profile/edit',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'token=some_invalid_token'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', data));
  });

  req.on('error', e => console.error('Error:', e));
  req.write(JSON.stringify({ firstName: 'test' }));
  req.end();
}
test();
