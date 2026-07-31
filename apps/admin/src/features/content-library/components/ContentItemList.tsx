"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";

import { contentLibraryApi, type ContentItem } from "../api/contentLibraryApi";

export function ContentItemList() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    contentLibraryApi
      .listAll()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the content library.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <p>Loading content library…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <p>
        <Link href="/content-library/new">New item</Link>
      </p>
      {items.length === 0 ? (
        <p>No content items yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Type</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.type}</td>
                <td>₹{paiseToRupees(item.priceInPaise)}</td>
                <td>{item.status}</td>
                <td>
                  <Link href={`/content-library/${item.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
