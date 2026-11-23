import type { Metadata } from "next";
import { NotFoundContent } from "@/components/content/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <NotFoundContent />;
}
