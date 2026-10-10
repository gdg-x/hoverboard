import type { APIRoute, GetStaticPaths } from 'astro';
import { loadContent } from '../../../data/content';
import { renderSocialImage } from '../../../data/social-image-render';
import { type SocialImage, SOCIAL_IMAGE, sessionImage } from '../../../data/social-images';

export const getStaticPaths = (async () => {
  const { sessions = [], speakers = [] } = await loadContent();
  return sessions.map((session) => {
    const image = sessionImage(session, speakers);
    return { params: { file: image.file }, props: { image } };
  });
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ image: SocialImage }> = async ({ props }) =>
  new Response(new Uint8Array(await renderSocialImage(props.image)), {
    headers: { 'Content-Type': SOCIAL_IMAGE.type },
  });
