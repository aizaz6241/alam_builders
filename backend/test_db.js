const mongoose = require('mongoose');

async function testConnection() {
  const uri = 'mongodb+srv://aizazkhan6241_db_user:YiVI4H2pE6HKoG9V@cluster0.tg2csvq.mongodb.net/alambuilders?appName=Cluster0';
  console.log('Connecting to: ', uri);
  
  await mongoose.connect(uri);
  console.log('Connected to Atlas directly.');
  
  const Employee = mongoose.model('Employee', new mongoose.Schema({ name: String }, { strict: false }));
  
  const employees = await Employee.find({});
  console.log('Employees in Atlas database (alambuilders):', employees.length);
  
  if (employees.length > 0) {
    console.log(employees);
  } else {
    console.log('No employees found in alambuilders database. Checking available databases...');
    const adminDb = mongoose.connection.client.db('admin');
    const result = await adminDb.admin().listDatabases();
    console.log('Available databases:');
    result.databases.forEach(db => console.log(' - ' + db.name));
  }
  
  process.exit(0);
}

testConnection().catch(console.error);
