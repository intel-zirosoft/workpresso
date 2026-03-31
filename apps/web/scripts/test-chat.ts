
async function testChat() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'hello' }]
    })
  });
  
  console.log('Status:', res.status);
  const body = await res.text();
  console.log('Response Body:', body);
}

testChat();
