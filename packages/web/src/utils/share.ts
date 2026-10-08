import { msg, str } from '@lit/localize';
import { hashtag } from '../config/site';

export const share = (e: PointerEvent) => {
  const shareUrl = location.href;
  const title = document.title;

  const target = e.currentTarget instanceof HTMLElement && e.currentTarget.getAttribute('share');

  switch (target) {
    case 'facebook': {
      openFacebook({ title, shareUrl });
      break;
    }
    case 'twitter': {
      openTwitter({ title, shareUrl });
      break;
    }
    default:
      throw new Error('Unknown share target');
  }
};

const features = ({ height }: { height: number }): string => {
  return [
    ['menubar', 'no'],
    ['toolbar', 'no'],
    ['resizable', 'yes'],
    ['scrollbars', 'yes'],
    ['width', 600],
    ['height', height],
  ]
    .map((feature) => feature.join('='))
    .join(',');
};

const openTwitter = ({ title, shareUrl }: { title: string; shareUrl: string }) => {
  const text = msg(str`Check out ${title} at #${hashtag}: ${shareUrl}`, {
    id: 'shared.share.twitter-text',
    desc: 'Post text. Followed by a page title, the event hashtag and a link.',
  });
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, 'share', features({ height: 275 }));
};

const openFacebook = ({ title, shareUrl }: { title: string; shareUrl: string }) => {
  const url = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(
    shareUrl,
  )}&t=${encodeURIComponent(title)}`;
  window.open(url, 'share', features({ height: 775 }));
};
