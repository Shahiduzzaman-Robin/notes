import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
      });

      return NextResponse.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token,
      });
    } else {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
