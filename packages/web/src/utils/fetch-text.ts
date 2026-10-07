export const fetchText = async (path: string): Promise<string> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  // Firebase Hosting rewrites missing files to /index.html with a 200 status.
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`Failed to load ${path}: received HTML`);
  }
  return response.text();
};
