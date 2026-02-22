import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Filesystem,
  Directory,
  Encoding,
  WriteFileResult,
  ReadFileResult,
  StatResult
} from '@capacitor/filesystem';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface FileOperationResult {
  success: boolean;
  path?: string;
  uri?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  mtime: number;
  ctime: number;
  type: string;
  uri: string;
}

/**
 * Service for native file system operations
 * Handles offline document storage and management
 */
@Injectable({
  providedIn: 'root'
})
export class NativeFilesystemService {
  private readonly isNativePlatform = Capacitor.isNativePlatform();
  private readonly documentsDir = Directory.Documents;
  private readonly dataDir = Directory.Data;
  private readonly appFolder = 'AtlasImmobilier';

  constructor() {
    if (this.isNativePlatform) {
      this.initializeAppFolders();
    }
  }

  /**
   * Initialize application folders
   */
  private async initializeAppFolders(): Promise<void> {
    try {
      await this.createDirectory(this.appFolder, this.documentsDir);
      await this.createDirectory(`${this.appFolder}/documents`, this.documentsDir);
      await this.createDirectory(`${this.appFolder}/images`, this.documentsDir);
      await this.createDirectory(`${this.appFolder}/cache`, this.dataDir);
      await this.createDirectory(`${this.appFolder}/offline`, this.dataDir);
    } catch (error) {
      console.error('Error initializing app folders:', error);
    }
  }

  /**
   * Create a directory
   */
  private async createDirectory(path: string, directory: Directory): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory,
        recursive: true
      });
    } catch (error: any) {
      if (!error.message?.includes('exists')) {
        throw error;
      }
    }
  }

  /**
   * Write a file
   */
  writeFile(
    path: string,
    data: string | Blob,
    directory: Directory = this.documentsDir,
    encoding: Encoding = Encoding.UTF8
  ): Observable<FileOperationResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Filesystem not available on web' });
    }

    const fullPath = `${this.appFolder}/${path}`;

    return from(
      Filesystem.writeFile({
        path: fullPath,
        data: typeof data === 'string' ? data : data,
        directory,
        encoding: typeof data === 'string' ? encoding : undefined
      })
    ).pipe(
      map((result: WriteFileResult) => ({
        success: true,
        path: fullPath,
        uri: result.uri
      })),
      catchError((error) => {
        console.error('Error writing file:', error);
        return of({
          success: false,
          error: error.message || 'Failed to write file'
        });
      })
    );
  }

  /**
   * Read a file
   */
  readFile(
    path: string,
    directory: Directory = this.documentsDir,
    encoding: Encoding = Encoding.UTF8
  ): Observable<string | null> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    const fullPath = `${this.appFolder}/${path}`;

    return from(
      Filesystem.readFile({
        path: fullPath,
        directory,
        encoding
      })
    ).pipe(
      map((result: ReadFileResult) => result.data as string),
      catchError((error) => {
        console.error('Error reading file:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete a file
   */
  deleteFile(
    path: string,
    directory: Directory = this.documentsDir
  ): Observable<FileOperationResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Filesystem not available on web' });
    }

    const fullPath = `${this.appFolder}/${path}`;

    return from(
      Filesystem.deleteFile({
        path: fullPath,
        directory
      })
    ).pipe(
      map(() => ({
        success: true,
        path: fullPath
      })),
      catchError((error) => {
        console.error('Error deleting file:', error);
        return of({
          success: false,
          error: error.message || 'Failed to delete file'
        });
      })
    );
  }

  /**
   * Check if a file exists
   */
  fileExists(
    path: string,
    directory: Directory = this.documentsDir
  ): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    const fullPath = `${this.appFolder}/${path}`;

    return from(
      Filesystem.stat({
        path: fullPath,
        directory
      })
    ).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Get file metadata
   */
  getFileMetadata(
    path: string,
    directory: Directory = this.documentsDir
  ): Observable<FileMetadata | null> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    const fullPath = `${this.appFolder}/${path}`;

    return from(
      Filesystem.stat({
        path: fullPath,
        directory
      })
    ).pipe(
      map((result: StatResult) => ({
        name: path.split('/').pop() || path,
        size: result.size,
        mtime: result.mtime,
        ctime: result.ctime || 0,
        type: result.type,
        uri: result.uri
      })),
      catchError((error) => {
        console.error('Error getting file metadata:', error);
        return of(null);
      })
    );
  }

  /**
   * List files in a directory
   */
  listFiles(
    path = '',
    directory: Directory = this.documentsDir
  ): Observable<string[]> {
    if (!this.isNativePlatform) {
      return of([]);
    }

    const fullPath = path ? `${this.appFolder}/${path}` : this.appFolder;

    return from(
      Filesystem.readdir({
        path: fullPath,
        directory
      })
    ).pipe(
      map((result) => result.files.map(f => f.name)),
      catchError((error) => {
        console.error('Error listing files:', error);
        return of([]);
      })
    );
  }

  /**
   * Copy a file
   */
  copyFile(
    fromPathStr: string,
    to: string,
    directory: Directory = this.documentsDir
  ): Observable<FileOperationResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Filesystem not available on web' });
    }

    const fromPath = `${this.appFolder}/${fromPathStr}`;
    const toPath = `${this.appFolder}/${to}`;

    return from(
      Filesystem.copy({
        from: fromPath,
        to: toPath,
        directory
      })
    ).pipe(
      map(() => ({
        success: true,
        path: toPath
      })),
      catchError((error) => {
        console.error('Error copying file:', error);
        return of({
          success: false,
          error: error.message || 'Failed to copy file'
        });
      })
    );
  }

  /**
   * Rename/move a file
   */
  renameFile(
    fromPathStr: string,
    to: string,
    directory: Directory = this.documentsDir
  ): Observable<FileOperationResult> {
    if (!this.isNativePlatform) {
      return of({ success: false, error: 'Filesystem not available on web' });
    }

    const fromPath = `${this.appFolder}/${fromPathStr}`;
    const toPath = `${this.appFolder}/${to}`;

    return from(
      Filesystem.rename({
        from: fromPath,
        to: toPath,
        directory
      })
    ).pipe(
      map(() => ({
        success: true,
        path: toPath
      })),
      catchError((error) => {
        console.error('Error renaming file:', error);
        return of({
          success: false,
          error: error.message || 'Failed to rename file'
        });
      })
    );
  }

  /**
   * Get URI for a file
   */
  getUri(
    path: string,
    directory: Directory = this.documentsDir
  ): Observable<string | null> {
    if (!this.isNativePlatform) {
      return of(null);
    }

    const fullPath = `${this.appFolder}/${path}`;

    return from(
      Filesystem.getUri({
        path: fullPath,
        directory
      })
    ).pipe(
      map((result) => result.uri),
      catchError((error) => {
        console.error('Error getting file URI:', error);
        return of(null);
      })
    );
  }

  /**
   * Save document for offline access
   */
  saveDocumentOffline(
    documentId: string,
    content: string | Blob,
    filename: string
  ): Observable<FileOperationResult> {
    const path = `offline/documents/${documentId}/${filename}`;
    return this.writeFile(path, content, this.dataDir);
  }

  /**
   * Get offline document
   */
  getOfflineDocument(documentId: string, filename: string): Observable<string | null> {
    const path = `offline/documents/${documentId}/${filename}`;
    return this.readFile(path, this.dataDir);
  }

  /**
   * Delete offline document
   */
  deleteOfflineDocument(documentId: string, filename: string): Observable<FileOperationResult> {
    const path = `offline/documents/${documentId}/${filename}`;
    return this.deleteFile(path, this.dataDir);
  }

  /**
   * Cache image locally
   */
  cacheImage(imageUrl: string, imageData: Blob): Observable<FileOperationResult> {
    const filename = this.getFilenameFromUrl(imageUrl);
    const path = `cache/images/${filename}`;
    return this.writeFile(path, imageData, this.dataDir);
  }

  /**
   * Get cached image
   */
  getCachedImage(imageUrl: string): Observable<string | null> {
    const filename = this.getFilenameFromUrl(imageUrl);
    const path = `cache/images/${filename}`;
    return this.getUri(path, this.dataDir);
  }

  /**
   * Clear cache
   */
  clearCache(): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    return from(
      Filesystem.rmdir({
        path: `${this.appFolder}/cache`,
        directory: this.dataDir,
        recursive: true
      })
    ).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Get total storage used by app
   */
  getStorageSize(): Observable<number> {
    if (!this.isNativePlatform) {
      return of(0);
    }

    return this.listFiles('', this.documentsDir).pipe(
      map(files => {
        // Simplified - in production, recursively calculate all file sizes
        return files.length * 1024; // Placeholder
      })
    );
  }

  /**
   * Extract filename from URL
   */
  private getFilenameFromUrl(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0] || `file_${Date.now()}`;
  }

  /**
   * Convert base64 to blob
   */
  base64ToBlob(base64: string, contentType = ''): Blob {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }
}
