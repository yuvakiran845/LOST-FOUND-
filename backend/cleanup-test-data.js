require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  // Delete all items
  const result = await mongoose.connection.collection('items').deleteMany({});
  console.log('Deleted', result.deletedCount, 'items');
  
  // Also clean up orphaned requests
  const req = await mongoose.connection.collection('requests').deleteMany({});
  console.log('Deleted', req.deletedCount, 'requests');
  
  await mongoose.disconnect();
  console.log('Done');
}

run().catch(e => { console.error(e.message); process.exit(1); });
