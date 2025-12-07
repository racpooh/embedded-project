/**
 * Google Cloud Storage Uploader for Node.js
 * Uploads images to GCS bucket and returns public URL
 */

import { Storage } from '@google-cloud/storage'
import { readFile } from 'fs/promises'
import { basename } from 'path'

export class GCSUploader {
  constructor(serviceAccountPath, bucketName) {
    this.storage = new Storage({
      keyFilename: serviceAccountPath,
    })
    this.bucketName = bucketName
    this.bucket = this.storage.bucket(bucketName)
  }

  /**
   * Upload a file to GCS and return public URL
   * @param {string} localFilePath - Path to local file
   * @param {string} [destinationPath] - Optional destination path in bucket
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  async uploadFile(localFilePath, destinationPath = null) {
    const destination = destinationPath || basename(localFilePath)

    try {
      // Upload file
      await this.bucket.upload(localFilePath, {
        destination,
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000',
        },
      })

      // Construct public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${destination}`
      
      console.log(`✓ Image uploaded to GCS: ${publicUrl}`)
      return publicUrl
    } catch (error) {
      console.error(`✗ GCS upload failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Upload image buffer to GCS
   * @param {Buffer} buffer - Image buffer
   * @param {string} filename - Filename in bucket
   * @returns {Promise<string>} - Public URL
   */
  async uploadBuffer(buffer, filename) {
    try {
      const file = this.bucket.file(filename)
      
      await file.save(buffer, {
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000',
        },
      })

      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`
      console.log(`✓ Image uploaded to GCS: ${publicUrl}`)
      return publicUrl
    } catch (error) {
      console.error(`✗ GCS upload failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Make a file publicly accessible (optional, based on security needs)
   * @param {string} filename - File name in bucket
   */
  async makePublic(filename) {
    await this.bucket.file(filename).makePublic()
  }

  /**
   * Generate a timestamped filename for fire detection images
   * @returns {string} - Filename like fire_detection_20231206_143022_123456.jpg
   */
  static generateFireImageFilename() {
    const now = new Date()
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .replace(/\..+/, '')
    const ms = now.getMilliseconds().toString().padStart(3, '0')
    return `fire_detection_${timestamp}_${ms}.jpg`
  }
}

// Test function
async function testUpload() {
  const uploader = new GCSUploader(
    '../embedded-project-6f2ed-6ff292c84b10.json',
    'household-fire-images'
  )
  
  // Example: Upload test image
  // const url = await uploader.uploadFile('/tmp/test.jpg')
  // console.log('Uploaded URL:', url)
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testUpload().catch(console.error)
}
