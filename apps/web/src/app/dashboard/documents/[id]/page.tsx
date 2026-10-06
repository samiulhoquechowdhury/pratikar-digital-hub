import { DocumentDetail } from "@/features/documents";

export const metadata = { title: "Your document" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentDetail documentId={id} />;
}
