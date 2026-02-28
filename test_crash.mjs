async function test() {
  const emailId = 'crash' + Date.now() + '@yes.com';
  try {
    const signup = await fetch('http://localhost:3000/auth/signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'crash',
        lastName: 'test',
        emailId,
        password: 'Password@123',
        age: 20,
        gender: 'male',
        role: 'user',
        photoUrl: 'http://google.com',
        skills: ['crash'],
        about: 'crashtest'
      })
    });
    console.log('Signup:', signup.status, await signup.text());

    const login = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailId,
        password: 'Password@123'
      })
    });
    const cookie = login.headers.get('set-cookie');
    console.log('Login:', login.status, await login.text());
    console.log('Cookie:', cookie);

    const edit = await fetch('http://localhost:3000/profile/edit', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({ firstName: 'TestEdit' })
    });
    console.log('Edit:', edit.status, await edit.text());
  } catch (e) {
    console.error(e);
  }
}
test();
