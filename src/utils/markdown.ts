export const unsupportedHtmlTags = ['div', 'plastic-image'].join(', ');

export const hasUnsupportedTags = (document: DocumentFragment): boolean => {
  return document.querySelector(unsupportedHtmlTags) !== null;
};
