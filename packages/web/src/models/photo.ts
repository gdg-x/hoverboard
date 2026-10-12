export interface Photo {
  id: string;
  url: string;
  /** What the photo shows, for screen readers. */
  alt?: string;
  order: string;
}
