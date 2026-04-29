import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Folder from '@/models/Folder';
import Note from '@/models/Note';
import Board from '@/models/Board';

// PUT (Update) a folder
export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;
    const { name, parentFolder } = await req.json();

    await dbConnect();
    const folder = await Folder.findOneAndUpdate(
      { _id: id, user: user._id },
      { name, parentFolder },
      { new: true }
    );

    if (!folder) return NextResponse.json({ message: 'Folder not found' }, { status: 404 });

    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a folder
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;

    await dbConnect();
    
    // Find the folder to delete
    const folder = await Folder.findOneAndDelete({ _id: id, user: user._id });

    if (!folder) return NextResponse.json({ message: 'Folder not found' }, { status: 404 });

    // Move all items in this folder to the root (null)
    await Promise.all([
      Note.updateMany({ folder: id, user: user._id }, { folder: null }),
      Board.updateMany({ folder: id, user: user._id }, { folder: null }),
      // Also update subfolders to be root-level
      Folder.updateMany({ parentFolder: id, user: user._id }, { parentFolder: null })
    ]);

    return NextResponse.json({ message: 'Folder removed and contents moved to root' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
