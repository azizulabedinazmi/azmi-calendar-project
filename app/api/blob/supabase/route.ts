import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from "next/server";

const BACKUP_PATH = "backups";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log("Backup API: Received POST request");

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      console.error("Backup API: Missing required fields", { id: !!id, data: !!data });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`Backup API: Preparing to store backup for ID: ${id}`);

    // Convert data to string
    const dataString = typeof data === "string" ? data : JSON.stringify(data);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BACKUP_PATH)
      .upload(`${id}.json`, dataString, {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload backup: ${uploadError.message}`);
    }

    console.log(`Backup API: Backup successfully stored`);

    return NextResponse.json({ 
      success: true, 
      path: `${BACKUP_PATH}/${id}.json`,
      id: id,
      message: "Backup created successfully"
    });
  } catch (error) {
    console.error("Backup API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Restore API: Received GET request");

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      console.error("Restore API: Missing backup ID");
      return NextResponse.json({ error: "Missing backup ID" }, { status: 400 });
    }

    // Get file from Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(BACKUP_PATH)
      .download(`${id}.json`);

    if (error) {
      console.error("Restore API: Error fetching backup:", error);
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Convert blob to text
    const text = await data.text();
    console.log("Restore API: Successfully retrieved backup data");

    return NextResponse.json({ success: true, data: text });
  } catch (error) {
    console.error("Restore API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}