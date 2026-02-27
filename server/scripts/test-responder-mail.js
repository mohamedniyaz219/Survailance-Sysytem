const base = 'http://localhost:3000/api/v1';
const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
const businessCode = `TEST-${rand}`;
const adminEmail = `admin_${rand.toLowerCase()}@mailhog.local`;
const adminPassword = 'Admin@12345';

async function main() {
  const registerResp = await fetch(`${base}/auth/official/register-tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_name: `Test Org ${rand}`,
      business_code: businessCode,
      admin_email: adminEmail,
      admin_password: adminPassword,
      admin_name: 'Test Admin'
    })
  });
  const registerData = await registerResp.json();

  if (!registerResp.ok) {
    throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
  }

  const loginResp = await fetch(`${base}/auth/official/login`, {
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
  const loginData = await loginResp.json();

  if (!loginResp.ok || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }

  const responderResp = await fetch(`${base}/admin/responders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
      'x-business-code': businessCode
    },
    body: JSON.stringify({
      name: 'Responder One',
      email: `responder_${rand.toLowerCase()}@mailhog.local`,
      badge_id: `R-${rand}`,
      assigned_zone: 'Zone-A',
      is_active: true,
      password: 'Responder@123'
    })
  });
  const responderData = await responderResp.json();

  if (!responderResp.ok) {
    throw new Error(`Responder create failed: ${JSON.stringify(responderData)}`);
  }

  console.log(JSON.stringify({
    businessCode,
    registerEmailStatus: registerData.emailStatus,
    responderCreateEmailStatus: responderData.emailStatus,
    responderEmail: responderData?.data?.email,
    responderId: responderData?.data?.id
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
