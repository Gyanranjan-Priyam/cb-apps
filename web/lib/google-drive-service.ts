import { prisma } from "@/lib/db";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
  "profile",
].join(" ");

export interface GoogleDriveStatus {
  isConnected: boolean;
  email?: string;
  expiresAt?: Date;
  rootFolderId?: string | null;
}

export interface UploadedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  webContentLink?: string;
}

export class GoogleDriveService {
  /**
   * Get OAuth credentials from environment variables.
   */
  private static getCredentials(redirectOrigin?: string) {
    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.AUTH_GOOGLE_ID ||
      process.env.AUTH_GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET ||
      process.env.AUTH_GOOGLE_SECRET ||
      process.env.AUTH_GOOGLE_CLIENT_SECRET;

    const baseOrigin =
      redirectOrigin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      "http://localhost:3000";

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${baseOrigin.replace(/\/$/, "")}/api/settings/google-drive/callback`;

    return { clientId, clientSecret, redirectUri };
  }

  /**
   * Generates Google OAuth authorization URL.
   */
  static getAuthUrl(userId: string, redirectOrigin?: string): string {
    const { clientId, redirectUri } = this.getCredentials(redirectOrigin);

    if (!clientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables.");
    }

    const statePayload = Buffer.from(
      JSON.stringify({ userId, origin: redirectOrigin || "" })
    ).toString("base64url");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state: statePayload,
    });

    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Handles OAuth callback: exchanges authorization code for tokens and stores connection.
   */
  static async handleOAuthCallback(code: string, userId: string, redirectOrigin?: string) {
    const { clientId, clientSecret, redirectUri } = this.getCredentials(redirectOrigin);

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials are missing.");
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Failed to exchange Google OAuth code: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string;
    const expiresIn = Number(tokenData.expires_in || 3600);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Fetch user info to get Google email
    const userInfoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      throw new Error("Failed to fetch Google user profile.");
    }

    const userInfo = await userInfoRes.json();
    const email = userInfo.email as string;

    // Fetch existing connection to preserve refreshToken if Google didn't return a new one on re-auth
    const existing = await prisma.googleDriveConnection.findUnique({
      where: { userId },
    });

    const finalRefreshToken = refreshToken || existing?.refreshToken;

    if (!finalRefreshToken) {
      throw new Error("No refresh token received from Google. Please revoke permissions and reconnect.");
    }

    // Upsert connection
    const connection = await prisma.googleDriveConnection.upsert({
      where: { userId },
      create: {
        userId,
        email,
        accessToken,
        refreshToken: finalRefreshToken,
        scope: tokenData.scope || SCOPES,
        tokenType: tokenData.token_type || "Bearer",
        expiresAt,
      },
      update: {
        email,
        accessToken,
        refreshToken: finalRefreshToken,
        scope: tokenData.scope || SCOPES,
        tokenType: tokenData.token_type || "Bearer",
        expiresAt,
      },
    });

    // Ensure root "Forms" parent folder is created & cached
    try {
      await this.getOrCreateFormsFolder(accessToken, connection.id);
    } catch (folderErr) {
      console.warn("Failed to create initial Forms folder during connect:", folderErr);
    }

    return connection;
  }

  /**
   * Retrieves connection status for a user or the active admin connection.
   */
  static async getConnectionStatus(userId?: string): Promise<GoogleDriveStatus> {
    const connection = userId
      ? await prisma.googleDriveConnection.findUnique({ where: { userId } })
      : await prisma.googleDriveConnection.findFirst({ orderBy: { updatedAt: "desc" } });

    if (!connection) {
      return { isConnected: false };
    }

    return {
      isConnected: true,
      email: connection.email,
      expiresAt: connection.expiresAt,
      rootFolderId: connection.rootFolderId,
    };
  }

  /**
   * Gets a valid Google access token, automatically refreshing if expired or expiring soon.
   */
  static async getValidAccessToken(userId?: string): Promise<{ accessToken: string; connectionId: string }> {
    const connection = userId
      ? await prisma.googleDriveConnection.findUnique({ where: { userId } })
      : await prisma.googleDriveConnection.findFirst({ orderBy: { updatedAt: "desc" } });

    if (!connection) {
      throw new Error("Google Drive is not connected. Please connect Google Drive in Settings.");
    }

    // If access token is valid for more than 2 minutes, return it
    const now = Date.now();
    const expiryTime = new Date(connection.expiresAt).getTime();
    if (expiryTime - now > 120000) {
      return { accessToken: connection.accessToken, connectionId: connection.id };
    }

    // Refresh access token
    const { clientId, clientSecret } = this.getCredentials();
    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials missing for token refresh.");
    }

    const refreshRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      console.error("Token refresh failed:", errText);
      throw new Error("Google Drive authorization has expired. Please reconnect your Google Drive account.");
    }

    const refreshData = await refreshRes.json();
    const newAccessToken = refreshData.access_token as string;
    const expiresIn = Number(refreshData.expires_in || 3600);
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.googleDriveConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      },
    });

    return { accessToken: newAccessToken, connectionId: connection.id };
  }

  /**
   * Disconnects Google Drive connection, revokes tokens, and cleans up database record.
   * Does NOT delete existing files from Google Drive.
   */
  static async disconnect(userId: string) {
    const connection = await prisma.googleDriveConnection.findUnique({
      where: { userId },
    });

    if (!connection) return true;

    // Try revoking token with Google
    try {
      await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(connection.refreshToken || connection.accessToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch (revokeErr) {
      console.warn("Could not revoke Google OAuth token:", revokeErr);
    }

    // Delete DB record
    await prisma.googleDriveConnection.delete({
      where: { id: connection.id },
    });

    return true;
  }

  /**
   * Retrieves or creates the single parent "Forms" folder in Google Drive root.
   */
  static async getOrCreateFormsFolder(accessToken: string, connectionId?: string): Promise<string> {
    if (connectionId) {
      const conn = await prisma.googleDriveConnection.findUnique({
        where: { id: connectionId },
        select: { rootFolderId: true },
      });
      if (conn?.rootFolderId) {
        // Verify folder still exists
        const checkRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${conn.rootFolderId}?fields=id,trashed`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.trashed) {
            return conn.rootFolderId;
          }
        }
      }
    }

    // Query for existing Forms folder in root
    const query = encodeURIComponent("name = 'Forms' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents");
    const searchRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const foundId = searchData.files[0].id as string;
        if (connectionId) {
          await prisma.googleDriveConnection.update({
            where: { id: connectionId },
            data: { rootFolderId: foundId },
          });
        }
        return foundId;
      }
    }

    // Create "Forms" folder
    const createRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?fields=id`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Forms",
        mimeType: "application/vnd.google-apps.folder",
        description: "Parent directory for all Codebreakers Form uploads",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create Forms root folder in Google Drive: ${err}`);
    }

    const created = await createRes.json();
    const rootFolderId = created.id as string;

    if (connectionId) {
      await prisma.googleDriveConnection.update({
        where: { id: connectionId },
        data: { rootFolderId },
      });
    }

    return rootFolderId;
  }

  /**
   * Retrieves or creates a form-specific folder named `CB-FRM-{FORM_ID}` inside the parent `Forms` folder.
   */
  static async getOrCreateFormFolder(params: {
    formId: string;
    accessToken: string;
    rootFolderId: string;
  }): Promise<string> {
    const { formId, accessToken, rootFolderId } = params;
    const expectedFolderName = formId.startsWith("CB-FRM-") ? formId : `CB-FRM-${formId}`;

    // Check if form record already has folder ID cached
    const formRecord = await prisma.form.findUnique({
      where: { formId },
      select: { googleDriveFolderId: true },
    });

    if (formRecord?.googleDriveFolderId) {
      const checkRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${formRecord.googleDriveFolderId}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.trashed) {
          return formRecord.googleDriveFolderId;
        }
      }
    }

    // Query for existing folder in parent Forms folder
    const query = encodeURIComponent(
      `name = '${expectedFolderName}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );

    const searchRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const folderId = searchData.files[0].id as string;
        await prisma.form.update({
          where: { formId },
          data: { googleDriveFolderId: folderId },
        });
        return folderId;
      }
    }

    // Create form folder
    const createRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?fields=id`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: expectedFolderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
        description: `Form submissions for ${formId}`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create form folder ${expectedFolderName}: ${err}`);
    }

    const created = await createRes.json();
    const folderId = created.id as string;

    await prisma.form.update({
      where: { formId },
      data: { googleDriveFolderId: folderId },
    });

    return folderId;
  }

  /**
   * Uploads a file buffer directly to Google Drive in the specified form folder.
   * File size MUST be <= 300 KB (307,200 bytes).
   */
  static async uploadFile(params: {
    formFolderId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    accessToken: string;
  }): Promise<UploadedDriveFile> {
    const { formFolderId, fileName, mimeType, buffer, accessToken } = params;

    const MAX_ALLOWED_BYTES = 300 * 1024; // 307,200 bytes
    if (buffer.byteLength > MAX_ALLOWED_BYTES) {
      throw new Error(`File "${fileName}" exceeds the strict 300 KB limit (${(buffer.byteLength / 1024).toFixed(1)} KB).`);
    }

    const metadata = {
      name: fileName,
      parents: [formFolderId],
      description: `Uploaded Form File: ${fileName}`,
    };

    const boundary = `-------314159265358979323846_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataHeader = Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    );
    const mediaHeader = Buffer.from(
      `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`
    );
    const endBoundary = Buffer.from(closeDelimiter);

    const multipartBody = Buffer.concat([
      metadataHeader,
      mediaHeader,
      buffer,
      endBoundary,
    ]);

    const uploadRes = await fetch(
      `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": multipartBody.byteLength.toString(),
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Google Drive file upload failed:", errText);
      throw new Error("Google Drive file upload failed. Please try again.");
    }

    const fileData = await uploadRes.json();
    return {
      id: fileData.id,
      name: fileData.name,
      mimeType: fileData.mimeType,
      size: Number(fileData.size || buffer.byteLength),
      webViewLink: fileData.webViewLink,
      webContentLink: fileData.webContentLink,
    };
  }

  /**
   * Fetches raw file data stream/buffer for authenticated secure proxy viewing/downloading.
   */
  static async getFile(googleDriveFileId: string, accessToken: string) {
    const metaRes = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files/${googleDriveFileId}?fields=id,name,mimeType,size`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!metaRes.ok) {
      throw new Error("File not found on Google Drive or unauthorized.");
    }

    const metadata = await metaRes.json();

    const mediaRes = await fetch(
      `${GOOGLE_DRIVE_API_BASE}/files/${googleDriveFileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!mediaRes.ok) {
      throw new Error("Failed to download file from Google Drive.");
    }

    const arrayBuffer = await mediaRes.arrayBuffer();
    return {
      metadata,
      buffer: Buffer.from(arrayBuffer),
      mimeType: metadata.mimeType,
      fileName: metadata.name,
    };
  }

  /**
   * Deletes a file from Google Drive.
   */
  static async deleteFile(googleDriveFileId: string, accessToken: string) {
    const delRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${googleDriveFileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!delRes.ok && delRes.status !== 404) {
      const err = await delRes.text();
      console.warn(`Failed to delete Google Drive file ${googleDriveFileId}:`, err);
    }

    return true;
  }

  /**
   * Deletes an entire form folder from Google Drive when a form is deleted.
   */
  static async deleteFormFolder(googleDriveFolderId: string, accessToken: string) {
    const delRes = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${googleDriveFolderId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!delRes.ok && delRes.status !== 404) {
      const err = await delRes.text();
      console.warn(`Failed to delete Google Drive folder ${googleDriveFolderId}:`, err);
    }

    return true;
  }
}
