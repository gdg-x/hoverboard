import type { APIRoute } from 'astro';
import { theme } from 'virtual:hoverboard/layout';
import { resources, site } from 'virtual:hoverboard/site';
import { ICON_SIZES, iconPath } from '../data/icons';

export const GET: APIRoute = () =>
  Response.json({
    name: resources.title,
    short_name: site.shortName,
    lang: site.locales.source,
    start_url: './?utm_source=web_app_manifest',
    display: 'standalone',
    // The manifest has one theme color, so it uses the light scheme.
    background_color: theme.light.primary,
    theme_color: theme.light.primary,
    icons: ICON_SIZES.map((size) => ({
      src: iconPath(size),
      sizes: `${size}x${size}`,
      type: 'image/png',
    })),
    gcm_sender_id: '103953800507',
  });
