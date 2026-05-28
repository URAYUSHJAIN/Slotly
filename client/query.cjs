const fs = require('fs');
const { Client } = require('pg');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/VITE_NEON_DATA_API_URL=postgres:\/\/(.+)/);
  if (!urlMatch) {
    console.log('Could not find postgres URL in .env.local');
    process.exit(1);
  }
  const url = 'postgres://' + urlMatch[1].trim();
  
  const client = new Client({ connectionString: url });
  await client.connect();
  
  const res = await client.query("SELECT * FROM neon_auth.users_sync WHERE email = 'urayushjain9@gmail.com'");
  console.log('User:', res.rows[0]);
  
  if (res.rows[0]) {
    const prof = await client.query("SELECT * FROM profiles WHERE id = $1", [res.rows[0].id]);
    console.log('Profile:', prof.rows[0] || 'No profile found');
    
    // Convert to doctor if requested
    if (!prof.rows[0]) {
      // Insert profile
      await client.query("INSERT INTO profiles (id, role, first_name, last_name, mobile) VALUES ($1, 'doctor', 'Urayush', 'Jain', '1234567890')", [res.rows[0].id]);
      console.log('Inserted profile as doctor');
    } else if (prof.rows[0].role !== 'doctor') {
      await client.query("UPDATE profiles SET role = 'doctor' WHERE id = $1", [res.rows[0].id]);
      console.log('Updated profile to doctor');
    }

    const doc = await client.query("SELECT * FROM doctors WHERE id = $1", [res.rows[0].id]);
    console.log('Doctor details:', doc.rows[0] || 'No doctor details found');
    
    if (!doc.rows[0]) {
      await client.query("INSERT INTO doctors (id, qualification, experience, speciality, appointment_price) VALUES ($1, 'MBBS', '10 Years', 'Cardiologist', 500)", [res.rows[0].id]);
      console.log('Inserted doctor details');
    }
  }
  
  await client.end();
}

run().catch(console.error);
