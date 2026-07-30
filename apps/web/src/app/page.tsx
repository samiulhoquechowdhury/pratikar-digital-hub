import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Pratikar Digital Hub</h1>
      <p>Legal documents, courses, and resources.</p>

      <nav>
        <ul>
          <li>
            <Link href="/documents">Document templates</Link> — fill in a form,
            get a ready document
          </li>
          <li>
            <Link href="/content-library">Content library</Link> — e-books and
            checklists
          </li>
          <li>
            <Link href="/courses">Courses</Link> — video courses with
            certificates
          </li>
          <li>
            <Link href="/dashboard">Your account</Link> — purchases, documents,
            and courses
          </li>
          <li>
            <Link href="/verify">Verify a certificate</Link> — check a
            certificate someone has shown you
          </li>
        </ul>
      </nav>

      <p>
        <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
