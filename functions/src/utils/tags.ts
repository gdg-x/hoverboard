export const pickMainTag = (tags?: string[]): string => {
  return tags?.[0] || 'General';
};

export const combineTags = (speakerTags?: string[], sessionTags?: string[]): string[] => {
  const tags = [...(speakerTags || []), ...(sessionTags || [])];
  return [...new Set(tags)];
};
