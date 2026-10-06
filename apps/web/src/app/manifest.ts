import type { MetadataRoute } from "next";

/**
 * Makes the site installable — "Add to Home Screen" on a phone. On an iPhone
 * that is also what turns on push notifications: Safari only offers web push
 * to a site that has been added to the home screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pratikar Digital Hub",
    short_name: "Pratikar",
    description:
      "Legal documents, advocate review, forms, e-books and courses — in plain language.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b1f3a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
