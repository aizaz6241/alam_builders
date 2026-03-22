const mongoose = require('mongoose');

async function run() {
  console.log('--- Checking Atlas ---');
  try {
    await mongoose.connect('mongodb+srv://aizazkhan6241_db_user:YiVI4H2pE6HKoG9V@cluster0.tg2csvq.mongodb.net/?appName=Cluster0');
    const adminAtlas = mongoose.connection.client.db('admin').admin();
    const dbsAtlas = await adminAtlas.listDatabases();
    for (let dbInfo of dbsAtlas.databases) {
      const db = mongoose.connection.client.db(dbInfo.name);
      const cols = await db.listCollections().toArray();
      for (let c of cols) {
        const coll = db.collection(c.name);
        const count = await coll.countDocuments();
        if (count > 0) console.log(`Atlas DB: ${dbInfo.name}, Coll: ${c.name}, Docs: ${count}`);
        const found = await coll.findOne({ name: 'TestDb' });
        if (found) console.log(' -> Found TestDb here!');
      }
    }
    await mongoose.disconnect();
  } catch(e) {}

  console.log('--- Checking Localhost ---');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/');
    const adminLocal = mongoose.connection.client.db('admin').admin();
    const dbsLocal = await adminLocal.listDatabases();
    for (let dbInfo of dbsLocal.databases) {
      const db = mongoose.connection.client.db(dbInfo.name);
      const cols = await db.listCollections().toArray();
      for (let c of cols) {
        const coll = db.collection(c.name);
        const count = await coll.countDocuments();
        if (count > 0) console.log(`Local DB: ${dbInfo.name}, Coll: ${c.name}, Docs: ${count}`);
        const found = await coll.findOne({ name: 'TestDb' });
        if (found) console.log(' -> Found TestDb here!');
      }
    }
    await mongoose.disconnect();
  } catch(e) {}
  
  process.exit(0);
}
run();
