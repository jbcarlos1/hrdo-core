import { google } from "googleapis";

let drive: any;

async function getAuthenticatedDrive() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Google OAuth credentials not configured. Please set up OAuth credentials for centralized storage."
    );
  }

  const authClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL + "/api/auth/callback/google"
  );

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      "Google refresh token not configured. Please complete the one-time authorization setup."
    );
  }

  authClient.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: authClient });
}

export async function uploadFile(
  file: File,
  folderId?: string,
  userInfo?: { name?: string | null; email?: string | null }
): Promise<string> {
  try {
    drive = await getAuthenticatedDrive();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { Readable } = require("stream");
    const stream = Readable.from(buffer);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const userPrefix = userInfo?.name ? `${userInfo.name}_` : "";
    const uniqueFileName = `${userPrefix}${timestamp}_${file.name}`;

    const response = await drive.files.create({
      requestBody: {
        name: uniqueFileName,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id,webViewLink,webContentLink",
    });

    if (userInfo?.email && folderId) {
      try {
        await shareFolderWithUser(folderId, userInfo.email, "reader");
        console.log(`✅ HRDO Documents folder shared with ${userInfo.email}`);
      } catch (shareError) {
        console.error("Failed to share folder with user:", shareError);
      }
    }

    return response.data.webViewLink || response.data.webContentLink;
  } catch (error) {
    console.error("Google Drive upload error:", error);
    throw new Error("Failed to upload file to Google Drive");
  }
}

export async function createFolder(folderName: string, parentFolderId?: string): Promise<string> {
  try {
    drive = await getAuthenticatedDrive();

    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    return response.data.id;
  } catch (error) {
    console.error("Google Drive folder creation error:", error);
    throw new Error("Failed to create folder in Google Drive");
  }
}

export async function getOrCreateDocumentsFolder(): Promise<string> {
  try {
    drive = await getAuthenticatedDrive();

    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    const response = await drive.files.list({
      q: "name='HRDO Documents' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    return await createFolder("HRDO Documents");
  } catch (error) {
    console.error("Google Drive folder check/create error:", error);
    throw new Error("Failed to access or create documents folder");
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    drive = await getAuthenticatedDrive();

    await drive.files.delete({
      fileId: fileId,
    });
  } catch (error) {
    console.error("Google Drive delete error:", error);
    throw new Error("Failed to delete file from Google Drive");
  }
}

export async function getFileInfo(fileId: string) {
  try {
    drive = await getAuthenticatedDrive();

    const response = await drive.files.get({
      fileId: fileId,
      fields: "id, name, mimeType, size, createdTime, webViewLink, webContentLink",
    });

    return response.data;
  } catch (error) {
    console.error("Google Drive file info error:", error);
    throw new Error("Failed to get file information from Google Drive");
  }
}

export async function shareFileWithUser(
  fileId: string,
  userEmail: string,
  role: "reader" | "writer" | "owner" = "reader"
): Promise<void> {
  try {
    drive = await getAuthenticatedDrive();

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: role,
        type: "user",
        emailAddress: userEmail,
      },
      sendNotificationEmail: false,
    });

    console.log(`✅ File ${fileId} shared with ${userEmail} as ${role}`);
  } catch (error) {
    console.error("Failed to share file with user:", error);
    throw new Error(`Failed to share file with ${userEmail}`);
  }
}

export async function shareFolderWithUser(
  folderId: string,
  userEmail: string,
  role: "reader" | "writer" = "reader"
): Promise<void> {
  try {
    drive = await getAuthenticatedDrive();

    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: role,
        type: "user",
        emailAddress: userEmail,
      },
      sendNotificationEmail: false,
    });

    console.log(`✅ Folder ${folderId} shared with ${userEmail} as ${role}`);
  } catch (error) {
    console.error("Failed to share folder with user:", error);
    throw new Error(`Failed to share folder with ${userEmail}`);
  }
}

export async function getFilePermissions(fileId: string) {
  try {
    drive = await getAuthenticatedDrive();

    const response = await drive.permissions.list({
      fileId: fileId,
      fields: "permissions(id, type, role, emailAddress, displayName)",
    });

    return response.data.permissions;
  } catch (error) {
    console.error("Failed to get file permissions:", error);
    throw new Error("Failed to get file permissions");
  }
}

export async function shareAllFilesInFolderWithUser(
  folderId: string,
  userEmail: string,
  role: "reader" | "writer" = "reader"
): Promise<void> {
  try {
    drive = await getAuthenticatedDrive();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name)",
    });

    const files = response.data.files || [];

    for (const file of files) {
      try {
        await shareFileWithUser(file.id, userEmail, role);
      } catch (error) {
        console.error(`Failed to share file ${file.name} with ${userEmail}:`, error);
      }
    }

    console.log(`✅ Shared ${files.length} files with ${userEmail}`);
  } catch (error) {
    console.error("Failed to share files in folder:", error);
    throw new Error(`Failed to share files in folder with ${userEmail}`);
  }
}
