// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { file } from "astro/loaders";

// 3. Define your collection(s)
const speaker = defineCollection({
  loader: file("src/content/speakers/speakers.json"),
  schema: z.object({
    id: z.number(),
    name: z.string(),
    role: z.string(),
    company: z.string(),
    talkTitle: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
  }),
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { speaker };
