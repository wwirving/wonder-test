export type Link = { name: string; url?: string };

export type Project = {
  id: string;
  /** project name — rendered as the small grey subtitle / grid title */
  title: string;
  url: string;
  description: string;
  year: string;
  with?: Link[]; // collaborators
  for?: string; // client
  location?: string;
  recognition?: Link[];
  tags: string[];
  media: {
    aspectRatio: number; // width / height
    video?: string;
    poster: string;
  };
};

/** The full tag vocabulary, surfaced by the search bar's suggestion list. */
export const ALL_TAGS = [
  "Development",
  "Design",
  "Art Direction",
  "Creative Direction",
  "Motion",
  "3D",
  "Brand",
  "Editorial",
  "E-commerce",
  "Interaction",
];

export const PROJECTS: Project[] = [
  {
    id: "cover",
    title: "Cover",
    url: "https://buildcover.com",
    description:
      "Discovering a new height in home through an innovative, beautifully simple way to build in Los Angeles.",
    year: "2025",
    with: [{ name: "MOUTHWASH Studio", url: "https://www.mouthwash.studio" }],
    for: "Cover",
    location: "Los Angeles, California",
    recognition: [{ name: "SiteInspire", url: "https://www.siteinspire.com" }],
    tags: ["Development", "Interaction", "Motion"],
    media: {
      aspectRatio: 16 / 9,
      video: "/video/mock.mp4",
      poster: "/video/mock-poster.webp",
    },
  },
  {
    id: "brand-ai",
    title: "Brand.AI",
    url: "https://example.com",
    description:
      "A keyboard-enabled ⌘K interface for a brand intelligence platform — fast, quiet, and precise.",
    year: "2025",
    with: [{ name: "Studio Lumen", url: "https://example.com" }],
    for: "Brand.AI",
    location: "Remote",
    recognition: [{ name: "Awwwards", url: "https://www.awwwards.com" }],
    tags: ["Development", "Design", "Interaction"],
    media: {
      aspectRatio: 16 / 9,
      video: "/video/mock.mp4",
      poster: "/video/mock-poster.webp",
    },
  },
  {
    id: "air-company",
    title: "Air Company",
    url: "https://example.com",
    description:
      "Turning captured carbon into everyday luxury — an editorial site for a climate-tech pioneer.",
    year: "2024",
    with: [{ name: "MOUTHWASH Studio", url: "https://www.mouthwash.studio" }],
    for: "Air Company",
    location: "New York",
    tags: ["Development", "Editorial", "Motion"],
    media: {
      aspectRatio: 16 / 9,
      video: "/video/mock.mp4",
      poster: "/video/mock-poster.webp",
    },
  },
  {
    id: "nike-blueprint",
    title: "Nike — Blueprint",
    url: "https://example.com",
    description:
      "An interactive lookbook exploring silhouettes, materials, and the language of a new franchise.",
    year: "2023",
    for: "Nike",
    location: "Portland, Oregon",
    recognition: [{ name: "FWA", url: "https://thefwa.com" }],
    tags: ["Development", "3D", "Interaction"],
    media: {
      aspectRatio: 16 / 9,
      video: "/video/mock.mp4",
      poster: "/video/mock-poster.webp",
    },
  },
];
