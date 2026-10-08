import type { APIRoute } from 'astro';
import { theme } from 'virtual:hoverboard/layout';
import { resources, site } from 'virtual:hoverboard/site';

const ICON_SIZES = [16, 32, 48, 57, 60, 72, 76, 96, 114, 120, 144, 152, 180, 192, 512];

export const GET: APIRoute = () =>
  Response.json({
    name: resources.title,
    short_name: site.shortName,
    lang: site.locales.source,
    start_url: './?utm_source=web_app_manifest',
    display: 'standalone',
    background_color: theme.primary,
    theme_color: theme.primary,
    icons: ICON_SIZES.map((size) => ({
      src: `images/manifest/icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
    })),
    gcm_sender_id: '103953800507',
  });
