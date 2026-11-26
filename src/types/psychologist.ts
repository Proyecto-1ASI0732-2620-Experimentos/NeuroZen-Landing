import type { ImageMetadata } from "astro";

export interface Psychologist {
  name: string;
  img: ImageMetadata;
  description: string;
  title?: string;
}
