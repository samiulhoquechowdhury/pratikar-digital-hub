"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { paiseToRupees } from "@/features/templates/lib/fieldSchema";

import { coursesApi, type Course } from "../api/coursesApi";

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    coursesApi
      .listAll()
      .then((result) => {
        if (!cancelled) setCourses(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load courses.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <p>Loading courses…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <p>
        <Link href="/courses/new">New course</Link>
      </p>
      {courses.length === 0 ? (
        <p>No courses yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Modules</th>
              <th scope="col">Enrolled</th>
              <th scope="col">Access</th>
              <th scope="col">Price</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.status}</td>
                <td>{course._count?.modules ?? 0}</td>
                <td>{course._count?.enrollments ?? 0}</td>
                <td>{course.accessDurationDays}d</td>
                <td>₹{paiseToRupees(course.priceInPaise)}</td>
                <td>
                  <Link href={`/courses/${course.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
