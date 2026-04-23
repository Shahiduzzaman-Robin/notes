const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'mds.zaamanrobin@gmail.com' });
    if (user) {
      console.log('User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Password Hash:', user.password);
    } else {
      console.log('User not found.');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
