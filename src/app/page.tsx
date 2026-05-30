import React from "react";
import { getModules, getProjects } from "./actions";
import LandingPageClient from "./LandingPageClient";

export default async function Home() {
  const { brand, modules } = await getModules();
  const { projects } = await getProjects();
  const resolvedBrand = {
    name: brand.name || "ICYFLAMZE The Brilliantaire",
    category:
      brand.category ||
      "Creative technology, multimedia strategy, and cultural systems",
    thesis:
      brand.thesis ||
      "Brilliance is the capital. Systems are the engine. Culture is the output. Impact is the goal.",
  };

  return (
    <LandingPageClient
      initialModules={modules}
      initialProjects={projects}
      brand={resolvedBrand}
    />
  );
}
