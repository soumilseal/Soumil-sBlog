/**
 * Central branding configuration for Soumil's Blog.
 * Easily customize the website name, slogan, logo icon, colors, and links here.
 */
export const BRANDING = {
  name: "Soumil's Blog",
  shortName: "Soumil's",
  tagline: "Every Voice Has a Story. Every Story Deserves to Be Heard.",
  description:
    "Discover interesting stories, share your thoughts, express your creativity and connect with people through the power of writing.",
  authorName: "Soumil Seal",
  adminEmail: "soumilseal457@gmail.com",
  year: new Date().getFullYear(),
  version: "1.0.0",
  socials: {
    twitter: "https://twitter.com",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
  },
  theme: {
    primaryAccent: "#00f2fe", // Electric cyan
    secondaryAccent: "#f6d365", // Champagne gold
    surfaceDark: "#060911",
    cardGlass: "rgba(13, 20, 36, 0.72)",
  },
  categories: [
    { id: "all", name: "All Stories", icon: "Sparkles" },
    { id: "technology", name: "Technology & AI", icon: "Cpu" },
    { id: "creative-writing", name: "Creative Writing", icon: "Feather" },
    { id: "philosophy", name: "Philosophy & Mind", icon: "Compass" },
    { id: "design", name: "Design & Aesthetics", icon: "Palette" },
    { id: "future", name: "Space & Future", icon: "Rocket" },
    { id: "personal-growth", name: "Personal Growth", icon: "Flame" },
    { id: "culture", name: "Culture & Society", icon: "Globe" },
  ],
};
