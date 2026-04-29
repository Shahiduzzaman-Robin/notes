import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db/mongodb';
import { verifyAuth } from '../../lib/db/auth';
import Folder from '../../models/Folder';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const folders = await Folder.find({ user: user._id }).sort({ name: 1 });
    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { name, parentFolder, type } = await req.json();
    
    const folder = await Folder.create({
      name,
      parentFolder: parentFolder || null,
      type: type || 'notes',
      user: user._id
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
