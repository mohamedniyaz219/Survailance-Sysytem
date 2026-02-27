const base = 'http://localhost:3000/api/v1';

async function run() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const businessCode = `MAP-${rand}`;
  const adminEmail = `map_${rand.toLowerCase()}@mailhog.local`;
  const adminPassword = 'Admin@12345';

  const registerRes = await fetch(`${base}/auth/official/register-tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_name: `Map Org ${rand}`,
      business_code: businessCode,
      admin_email: adminEmail,
      admin_password: adminPassword,
      admin_name: 'Map Admin'
    })
  });
  const registerBody = await registerRes.json();

  const loginRes = await fetch(`${base}/auth/official/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-business-code': businessCode
    },
    body: JSON.stringify({
      business_code: businessCode,
      email: adminEmail,
      password: adminPassword
    })
  });
  const loginBody = await loginRes.json();

  const mapRes = await fetch(`${base}/admin/map-overview`, {
    headers: {
      Authorization: `Bearer ${loginBody.token}`,
      'x-business-code': businessCode
    }
  });

  const mapBodyText = await mapRes.text();

  console.log(JSON.stringify({
    businessCode,
    registerStatus: registerRes.status,
    loginStatus: loginRes.status,
    mapStatus: mapRes.status,
    mapBody: mapBodyText.slice(0, 1000),
    registerBody
  }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
