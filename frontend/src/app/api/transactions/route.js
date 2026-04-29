import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Transaction from '@/models/Transaction';

// GET all transactions for the user
export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const transactions = await Transaction.find({ user: user._id }).sort({ date: -1 });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST a new transaction
export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { description, amount, type, category, date } = await req.json();

    await dbConnect();
    const transaction = await Transaction.create({
      user: user._id,
      description,
      amount,
      type,
      category,
      date: date || Date.now()
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
