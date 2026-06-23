const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const processEnv = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    processEnv[key] = value;
  }
});

async function testAuth(endpoint) {
  const username = processEnv.SF_USERNAME;
  const password = processEnv.SF_PASSWORD;
  const securityToken = processEnv.SF_SECURITY_TOKEN;
  const consumerKey = processEnv.SF_CONSUMER_KEY;
  const consumerSecret = processEnv.SF_CONSUMER_SECRET;
  
  const tokenUrl = `${endpoint}/services/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: consumerKey,
    client_secret: consumerSecret,
    username,
    password: `${password}${securityToken}`
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    console.log(`${endpoint} -> Status:`, response.status);
    const text = await response.text();
    console.log(`Response:`, text);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

async function run() {
  await testAuth('https://test.salesforce.com');
}

run();
