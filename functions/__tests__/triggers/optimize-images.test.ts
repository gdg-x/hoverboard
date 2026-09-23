import os from 'os';
import path from 'path';
import * as functions from 'firebase-functions';
import { afterEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  bucket: vi.fn(),
  mkdir: vi.fn(),
  spawnSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock('@google-cloud/storage', () => ({
  Storage: class {
    bucket = storageMocks.bucket;
  },
}));

vi.mock('child_process', () => ({
  spawnSync: storageMocks.spawnSync,
}));

vi.mock('fs', () => ({
  default: {
    promises: {
      mkdir: storageMocks.mkdir,
    },
    unlinkSync: storageMocks.unlinkSync,
  },
}));

import { optimizeImages } from '../../src/triggers/optimize-images';

const setupStorageMocks = ({
  metadata = {},
}: {
  metadata?: Record<string, unknown>;
} = {}) => {
  const download = vi.fn().mockResolvedValue(undefined);
  const getMetadata = vi.fn().mockResolvedValue([{ metadata }]);
  const makePublic = vi.fn().mockResolvedValue(undefined);
  const upload = vi.fn().mockResolvedValue([{ makePublic }]);
  const sourceFile = { download, getMetadata };
  const destinationFile = { kind: 'destination-file' };
  const file = vi.fn().mockReturnValueOnce(sourceFile).mockReturnValueOnce(destinationFile);

  storageMocks.bucket.mockReturnValue({
    file,
    upload,
  } as never);

  return { destinationFile, download, file, getMetadata, makePublic, upload };
};

describe('optimizeImages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns early for non-image objects', async () => {
    const logSpy = vi.spyOn(functions.logger, 'log').mockImplementation(() => undefined);

    const result = await optimizeImages.run(
      {
        bucket: 'hoverboard-assets',
        contentType: 'text/plain',
        name: 'notes.txt',
      } as never,
      {} as never,
    );

    expect(result).toBeNull();
    expect(logSpy).toHaveBeenCalledWith('This is not an image.');
    expect(storageMocks.bucket).not.toHaveBeenCalled();
    expect(storageMocks.spawnSync).not.toHaveBeenCalled();
  });

  it('skips files that are already marked as optimized', async () => {
    const { download, getMetadata, upload } = setupStorageMocks({
      metadata: { optimized: 'true' },
    });
    const logSpy = vi.spyOn(functions.logger, 'log').mockImplementation(() => undefined);

    const result = await optimizeImages.run(
      {
        bucket: 'hoverboard-assets',
        contentType: 'image/png',
        name: 'images/photo.png',
      } as never,
      {} as never,
    );

    expect(result).toBeNull();
    expect(getMetadata).toHaveBeenCalledTimes(1);
    expect(download).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(storageMocks.mkdir).not.toHaveBeenCalled();
    expect(storageMocks.spawnSync).not.toHaveBeenCalled();
    expect(storageMocks.unlinkSync).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Image has been already optimized');
  });

  it('downloads, optimizes, uploads, makes public, and cleans up local files', async () => {
    const { destinationFile, download, file, makePublic, upload } = setupStorageMocks();
    const object = {
      bucket: 'hoverboard-assets',
      contentType: 'image/png',
      name: 'images/photo.png',
    };
    const tempLocalFile = path.join(os.tmpdir(), object.name);
    const tempLocalDir = path.dirname(tempLocalFile);

    await optimizeImages.run(object as never, {} as never);

    expect(storageMocks.bucket).toHaveBeenCalledWith('hoverboard-assets');
    expect(file).toHaveBeenNthCalledWith(1, 'images/photo.png');
    expect(file).toHaveBeenNthCalledWith(2, 'images/photo.png');
    expect(storageMocks.mkdir).toHaveBeenCalledWith(tempLocalDir, { recursive: true });
    expect(download).toHaveBeenCalledWith({ destination: tempLocalFile });
    expect(storageMocks.spawnSync).toHaveBeenCalledWith('convert', [
      tempLocalFile,
      '-strip',
      '-interlace',
      'Plane',
      '-quality',
      '82',
      tempLocalFile,
    ]);
    expect(upload).toHaveBeenCalledWith(tempLocalFile, {
      destination: destinationFile,
      metadata: {
        metadata: {
          optimized: 'true',
        },
      },
    });
    expect(makePublic).toHaveBeenCalledTimes(1);
    expect(storageMocks.unlinkSync).toHaveBeenCalledWith(tempLocalFile);
  });
});
