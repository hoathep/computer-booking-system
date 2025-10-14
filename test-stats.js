import axios from 'axios';

async function testStats() {
  try {
    console.log('Testing admin stats API...');
    
    // First login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');
    
    // Test stats API
    const statsResponse = await axios.get('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Stats response:', statsResponse.data);
    
    // Test debug API
    const debugResponse = await axios.get('http://localhost:3000/api/admin/debug', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Debug response:', debugResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testStats();
