const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load .env to avoid dependency issues in scratch script
const envPath = path.join(__dirname, '../backend/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoUri = envContent.match(/MONGO_URI=(.*)/)[1].trim();

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'General' },
  date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function importData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const user = await User.findOne();
    if (!user) {
      console.error('No user found');
      return;
    }

    const transactions = [
      // Income
      { user: user._id, description: 'First 15 Days Income', amount: 35000, type: 'income', category: 'Salary' },
      { user: user._id, description: 'Salary 1/2 Month', amount: 17500, type: 'income', category: 'Salary' },
      
      // Expenses
      { user: user._id, description: 'Chandpur to Dhaka by Launch', amount: 1640, type: 'expense', category: 'Travel' },
      { user: user._id, description: 'Khawa Dawa 409', amount: 1700, type: 'expense', category: 'Food' },
      { user: user._id, description: 'Hotel Grand Hilsha', amount: 4900, type: 'expense', category: 'Travel' },
      { user: user._id, description: 'Cashout to Bellal Digital (Bkash)', amount: 500, type: 'expense', category: 'General' },
      { user: user._id, description: 'Star kabab with Supreme', amount: 625, type: 'expense', category: 'Food' },
      { user: user._id, description: 'Pathao Food', amount: 120, type: 'expense', category: 'Food' },
      { user: user._id, description: 'Haji Biriyani House Shaharasti', amount: 170, type: 'expense', category: 'Food' },
      { user: user._id, description: 'Cash out by Bkash', amount: 700, type: 'expense', category: 'General' },
      { user: user._id, description: 'Pay bill to Prime Bank card', amount: 3000, type: 'expense', category: 'General' },
      { user: user._id, description: 'Cash out by Bkash', amount: 500, type: 'expense', category: 'General' },
      { user: user._id, description: 'FoodPand', amount: 260, type: 'expense', category: 'Food' },
      { user: user._id, description: 'Cashout Bkash', amount: 600, type: 'expense', category: 'General' },
      { user: user._id, description: 'Mobile Purchase from Imtiaz bhai', amount: 19000, type: 'expense', category: 'Shopping' },
      { user: user._id, description: 'Bus Bhara', amount: 400, type: 'expense', category: 'Travel' },
      { user: user._id, description: 'Micro Bhara', amount: 550, type: 'expense', category: 'Travel' }
    ];

    await Transaction.insertMany(transactions);
    console.log(`Successfully imported ${transactions.length} transactions for ${user.email}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importData();
