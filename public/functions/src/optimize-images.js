import { storage } from 'firebase-functions';
import Storage from '@google-cloud/storage';
import { spawn } from 'child-process-promise';
import mkdirp from 'mkdirp-promise';
import path from 'path';
import os from 'os';
import fs from 'fs';

const gcs = new Storage();

const optimizeImages = storage.object().onFinalize((object) => {
  const { contentType } = object;
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return null;
  }

  return optimizeImage(object);
});

async function optimizeImage(object) {
  // File and directory paths.
  const filePath = object.name;
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);

  // Cloud Storage files.
  const bucket = gcs.bucket(object.bucket);
  const file = bucket.file(filePath);

  const [metadata] = await file.getMetadata();
  if (metadata.metadata && metadata.metadata.optimized) {
    console.log('Image has been already optimized');
    return null;
  }

  await mkdirp(tempLocalDir);
  await file.download({ destination: tempLocalFile });
  console.log('The file has been downloaded to', tempLocalFile);

  // Generate a thumbnail using ImageMagick.
  await spawn('convert', [tempLocalFile, '-strip', '-interlace', 'Plane', '-quality', '82', tempLocalFile]);
  console.log('Optimized image created at', tempLocalFile);

  // Uploading the Optimized image.
  const destination = bucket.file(filePath);
  const [newFile] = await bucket.upload(tempLocalFile, {
    destination,
    metadata: {
      metadata: {
        optimized: true,
      },
    },
  });
  await newFile.makePublic();
  console.log('Optimized image uploaded to Storage');
  // Once the image has been uploaded delete the local files to free up disk space.
  return Promise.all([fs.unlinkSync(tempLocalFile)]);
}

export default optimizeImages;
