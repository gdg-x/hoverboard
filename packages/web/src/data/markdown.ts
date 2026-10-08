import { JSDOM } from 'jsdom';
import type { WindowLike } from 'dompurify';
import { setMarkdownWindow } from '../utils/markdown';

// Imported for its effect: markdown components sanitize with this window during the build.
setMarkdownWindow(new JSDOM('').window as unknown as WindowLike);
