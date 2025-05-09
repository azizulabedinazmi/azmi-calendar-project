import connectDB from "@/lib/mongodb";
import Backup from "@/models/Backup";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Backup API: Received POST request");
    await connectDB();

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      console.error("Backup API: Missing required fields", { id: !!id, data: !!data });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`Processing backup for user ${id}...`);

    // Create or update backup
    const backup = await Backup.findOneAndUpdate(
      { userId: id },
      { 
        userId: id,
        data: data,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log("Backup stored successfully");

    return NextResponse.json({ 
      success: true, 
      id: id,
      message: "Backup created successfully"
    });
  } catch (error) {
    console.error("Backup API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Restore API: Received GET request");
    await connectDB();

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      console.error("Restore API: Missing backup ID");
      return NextResponse.json({ error: "Missing backup ID" }, { status: 400 });
    }

    console.log(`Processing restore request for user ${id}...`);

    const backup = await Backup.findOne({ userId: id });

    if (!backup) {
      console.log("No backup found");
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    console.log("Backup restored successfully");

    return NextResponse.json({ 
      success: true, 
      data: backup.data 
    });
  } catch (error) {
    console.error("Restore API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
