const token = '00DDz000001qvYA!ARQAQCOMsSyXqhZqnwgEgzjwAEwd6zY0sR54H0jwZVCOyPODwV.phlmwSx6QnIfoLdr6eiBtGaXPzw1V4VKpvZg4ZTliMa.6';

async function run() {
  const name = 'Analytics';
  const query = `SELECT Id, Product2Id, Product2.Name FROM PricebookEntry WHERE Product2.Name = '${name}' AND Product2.Type = 'Bundle' AND IsActive = true LIMIT 1`;
  const url = `https://vector--rcaagivant.sandbox.my.salesforce.com/services/data/v65.0/query?q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log('Query Status:', res.status);
    console.log('PricebookEntry found:', JSON.stringify(data.records, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
