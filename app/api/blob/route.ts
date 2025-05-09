import { list, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from "next/server";

async function ensureCalendarFolderStructure(misskeyUrl: string, misskeyToken: string, userId: string): Promise<string> {

  const mainFolderName = "calendar";
  
  const listMainFoldersResponse = await fetch(`${misskeyUrl}/api/drive/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      i: misskeyToken,
      limit: 100,
    }),
  });
  
  if (!listMainFoldersResponse.ok) {
    throw new Error(`Failed to list folders: ${listMainFoldersResponse.statusText}`);
  }
  
  const mainFolders = await listMainFoldersResponse.json();
  let mainCalendarFolder = mainFolders.find((folder: any) => folder.name === mainFolderName);
  
  if (!mainCalendarFolder) {
    const createMainFolderResponse = await fetch(`${misskeyUrl}/api/drive/folders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        i: misskeyToken,
        name: mainFolderName,
      }),
    });
    
    if (!createMainFolderResponse.ok) {
      throw new Error(`Failed to create main calendar folder: ${createMainFolderResponse.statusText}`);
    }
    
    mainCalendarFolder = await createMainFolderResponse.json();
  }

  const userFolderName = userId;
  
  const listUserFoldersResponse = await fetch(`${misskeyUrl}/api/drive/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      i: misskeyToken,
      folderId: mainCalendarFolder.id,
      limit: 100,
    }),
  });
  
  if (!listUserFoldersResponse.ok) {
    throw new Error(`Failed to list user folders: ${listUserFoldersResponse.statusText}`);
  }
  
  const userFolders = await listUserFoldersResponse.json();
  let userFolder = userFolders.find((folder: any) => folder.name === userFolderName);
  
  if (!userFolder) {
    const createUserFolderResponse = await fetch(`${misskeyUrl}/api/drive/folders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        i: misskeyToken,
        name: userFolderName,
        parentId: mainCalendarFolder.id,
      }),
    });
    
    if (!createUserFolderResponse.ok) {
      throw new Error(`Failed to create user folder: ${createUserFolderResponse.statusText}`);
    }
    
    userFolder = await createUserFolderResponse.json();
  }
  
  return userFolder.id;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Backup API: Received POST request");

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
    }

    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) {
      console.error("Backup API: Missing required fields", { id: !!id, data: !!data });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`Processing backup for user ${id}...`);

    // Convert data to string if it's not already
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    // Store in Vercel Blob
    const blob = await put(`backups/${id}.json`, dataString, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log("Backup stored successfully in Vercel Blob");

    return NextResponse.json({ 
      success: true, 
      id: id,
      url: blob.url,
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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      console.error("Restore API: Missing backup ID");
      return NextResponse.json({ error: "Missing backup ID" }, { status: 400 });
    }

    console.log(`Processing restore request for user ${id}...`);

    // List blobs with the specific prefix
    const { blobs } = await list({
      prefix: `backups/${id}`,
    });

    if (blobs.length === 0) {
      console.log("No backup found");
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Get the most recent backup
    const latestBackup = blobs[0];
    
    // Fetch the backup data
    const response = await fetch(latestBackup.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch backup data: ${response.statusText}`);
    }
    
    const data = await response.json();

    console.log("Backup restored successfully");

    return NextResponse.json({ 
      success: true, 
      data: data 
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
