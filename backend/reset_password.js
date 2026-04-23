const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'mds.zaamanrobin@gmail.com' });
    
    if (user) {
      user.password = '123456';
      await user.save();
      console.log('Password successfully reset for mds.zaamanrobin@gmail.com');
      console.log('New Password: 123456');
    } else {
      console.log('User not found.');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();
