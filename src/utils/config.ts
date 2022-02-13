// Config settings can be different depending on deploy environment and can't be imported like resources.json

export enum CONFIG {
  BASEPATH = 'basepath',
  URL = 'url',
  GOOGLE_MAPS_API_KEY = 'google-maps-api-key',
}

export const getConfig = (key: CONFIG): string => {
  const element = document.querySelector<HTMLMetaElement>(`meta[name="config-${key}"]`);

  if (element === null || !element.content) {
    throw new Error(`Config ${key} is missing or doesn't have a value`);
  }

  return element.content;
};
