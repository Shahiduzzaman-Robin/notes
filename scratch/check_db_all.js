const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin:admin123@cluster0.f2ddfrw.mongodb.net/note_taking_app?retryWrites=true&w=majority&appName=Cluster0';

const NoteSchema = new mongoose.Schema({
  title: String,
  content: String,
  updatedAt: Date
});

const Note = mongoose.model('Note', NoteSchema);

async function checkNote() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  
  const notes = await Note.find({}).sort({ updatedAt: -1 }).limit(10);
  console.log('Found notes:', notes.length);
  
  notes.forEach(n => {
    console.log('---');
    console.log('ID:', n._id);
    console.log('Title:', n.title);
    console.log('Content Length:', n.content?.length || 0);
    console.log('Content Preview:', n.content?.substring(0, 100));
    console.log('Updated At:', n.updatedAt);
  });
  
  await mongoose.disconnect();
}

checkNote().catch(console.error);
