import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Transaction from '@/models/Transaction';

// PUT (Update) a transaction
export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = params;
    const { description, amount, type, category, date } = await req.json();

    await dbConnect();
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: user._id },
      { description, amount, type, category, date },
      { new: true }
    );

    if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a transaction
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = params;

    await dbConnect();
    const transaction = await Transaction.findOneAndDelete({ _id: id, user: user._id });

    if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

    return NextResponse.json({ message: 'Transaction removed' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
