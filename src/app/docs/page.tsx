import type { Metadata } from "next";
import { DocsPageClient } from "./docs-client";

export const metadata: Metadata = {
  title: "Docs & Setup Guide — MJ.TALK",
  description:
    "Learn how to set up the MJ.TALK widget, add agents, enable AI, and configure human handoff.",
};

export default function DocsPage() {
  return <DocsPageClient />;
}
