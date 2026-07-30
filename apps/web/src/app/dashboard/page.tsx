import { MyDocuments } from "@/features/documents";
import { MyCourses } from "@/features/lms";
import { MyPurchases } from "@/features/payments";

// Composed from three features rather than owning the data itself, per
// apps/web/src/features/README.md: each section is that feature's business,
// and the page only decides what appears and in what order.
export default function DashboardPage() {
  return (
    <main>
      <h1>Your account</h1>

      <section>
        <h2>Your documents</h2>
        <MyDocuments />
      </section>

      <section>
        <h2>Your courses</h2>
        <MyCourses />
      </section>

      <section>
        <h2>Purchase history</h2>
        <MyPurchases />
      </section>
    </main>
  );
}
