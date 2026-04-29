import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from './mongodb';

export async function verifyAuth(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    await dbConnect();
    const user = await User.findById(decoded.id).select('-password');
    
    return user;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
