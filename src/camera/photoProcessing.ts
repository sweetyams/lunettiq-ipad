import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface ProcessedPhoto {
  fullUri: string;
  thumbnailUri: string;
  originalSize?: number;
  compressedSize?: number;
}

/**
 * Compress photo to JPEG 80% quality with max 2048px longest edge
 */
export async function compressPhoto(uri: string): Promise<string> {
  try {
    // Get original image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
    );
    
    // Calculate resize dimensions if needed
    const { width, height } = imageInfo;
    const maxDimension = 2048;
    let resizeWidth = width;
    let resizeHeight = height;
    
    if (width > maxDimension || height > maxDimension) {
      const aspectRatio = width / height;
      if (width > height) {
        resizeWidth = maxDimension;
        resizeHeight = Math.round(maxDimension / aspectRatio);
      } else {
        resizeHeight = maxDimension;
        resizeWidth = Math.round(maxDimension * aspectRatio);
      }
    }
    
    // Compress and optionally resize
    const actions = [];
    if (resizeWidth !== width || resizeHeight !== height) {
      actions.push({ resize: { width: resizeWidth, height: resizeHeight } });
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.8,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error compressing photo:', error);
    throw new Error('Failed to compress photo');
  }
}

/**
 * Generate 500px thumbnail for grid display
 */
export async function generateThumbnail(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: 500,
            height: 500,
          },
        },
      ],
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.7, // Slightly more compression for thumbnails
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Strip EXIF metadata for privacy (location, device info)
 * Note: expo-image-manipulator automatically strips most EXIF when compressing
 * This is mainly a placeholder for explicit EXIF removal if needed
 */
export async function stripExif(uri: string): Promise<string> {
  try {
    // expo-image-manipulator strips EXIF by default when saving as JPEG
    // We'll re-process to ensure EXIF is removed
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [], // No transformations, just re-save to strip EXIF
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 1.0, // No additional compression
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error stripping EXIF:', error);
    throw new Error('Failed to strip EXIF metadata');
  }
}

/**
 * Get file size in bytes
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && 'size' in info ? info.size : 0;
  } catch {
    return 0;
  }
}

/**
 * Full processing pipeline: compress + thumbnail + strip EXIF
 */
export async function processCapture(uri: string): Promise<ProcessedPhoto> {
  try {
    const originalSize = await getFileSize(uri);
    
    // Step 1: Compress the full-resolution image
    const compressedUri = await compressPhoto(uri);
    
    // Step 2: Strip EXIF metadata
    const cleanUri = await stripExif(compressedUri);
    
    // Step 3: Generate thumbnail
    const thumbnailUri = await generateThumbnail(cleanUri);
    
    const compressedSize = await getFileSize(cleanUri);
    
    return {
      fullUri: cleanUri,
      thumbnailUri,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    console.error('Error processing capture:', error);
    throw new Error('Failed to process photo');
  }
}

/**
 * Process multiple photos from burst capture
 */
export async function processBurstCapture(
  uris: string[]
): Promise<ProcessedPhoto[]> {
  try {
    const processed = await Promise.all(
      uris.map(uri => processCapture(uri))
    );
    
    return processed;
  } catch (error) {
    console.error('Error processing burst capture:', error);
    throw new Error('Failed to process burst photos');
  }
}

/**
 * Create a unique filename for photos
 */
export function generatePhotoFilename(
  sessionId?: string,
  context: string = 'photo'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  if (sessionId) {
    return `${context}-${sessionId}-${timestamp}-${random}.jpg`;
  }
  
  return `${context}-${timestamp}-${random}.jpg`;
}

/**
 * Save processed photo to permanent location in document directory
 */
export async function savePhotoToPermanentLocation(
  uri: string,
  filename: string
): Promise<string> {
  try {
    // @ts-expect-error expo-file-system v57 API change - documentDirectory available at runtime
    const documentDirectory: string | null = FileSystem.documentDirectory ?? null;
    if (!documentDirectory) {
      throw new Error('Document directory not available');
    }
    
    // Create photos directory if it doesn't exist
    const photosDir = `${documentDirectory}photos/`;
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }
    
    const permanentUri = `${photosDir}${filename}`;
    
    // Copy the processed photo to permanent location
    await FileSystem.copyAsync({
      from: uri,
      to: permanentUri,
    });
    
    return permanentUri;
  } catch (error) {
    console.error('Error saving photo to permanent location:', error);
    throw new Error('Failed to save photo');
  }
}

/**
 * Clean up temporary photos (after processing or failed captures)
 */
export async function cleanupTempPhoto(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.warn('Failed to cleanup temp photo:', error);
  }
}

/**
 * Validate that a URI points to a valid image file
 */
export async function validatePhotoUri(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return false;
    
    // Check if it's likely an image based on file extension
    const isImageExtension = /\.(jpg|jpeg|png|webp)$/i.test(uri);
    return isImageExtension;
  } catch {
    return false;
  }
}