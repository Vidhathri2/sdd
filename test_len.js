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

function printStr(name, val) {
  if (!val) {
    console.log(name, 'is empty');
    return;
  }
  console.log(`${name}: "${val}" (len=${val.length})`);
  const codes = [];
  for (let i = 0; i < val.length; i++) {
    codes.push(val.charCodeAt(i));
  }
  console.log(`${name} codes:`, codes.join(', '));
}

printStr('SF_USERNAME', processEnv.SF_USERNAME);
printStr('SF_PASSWORD', processEnv.SF_PASSWORD);
printStr('SF_SECURITY_TOKEN', processEnv.SF_SECURITY_TOKEN);
printStr('SF_CONSUMER_KEY', processEnv.SF_CONSUMER_KEY);
printStr('SF_CONSUMER_SECRET', processEnv.SF_CONSUMER_SECRET);
printStr('SF_INSTANCE_URL', processEnv.SF_INSTANCE_URL);
