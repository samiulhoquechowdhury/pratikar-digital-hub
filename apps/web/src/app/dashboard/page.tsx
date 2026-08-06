import { PageBody, PageHeader } from "@pratikar/ui";

import { MyDocuments } from "@/features/documents";
import { MyCourses } from "@/features/lms";
import { MyPurchases } from "@/features/payments";

export const metadata = { title: "Your account" };

// Composed from three features rather than owning the data itself, per
// apps/web/src/features/README.md: each section is that feature's business,
// and the page only decides what appears and in what order.
//
// The ids are targets for the account menu in the header, which links straight
// to a section — scroll-mt clears the sticky header so the heading doesn't
// land underneath it.
const SECTION_ANCHOR = "scroll-mt-24";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Your account"
        description="Everything you've created, enrolled in, and paid for."
      />
      <PageBody className="space-y-12">
        <section id="documents" className={SECTION_ANCHOR}>
          <h2 className="text-xl">Your documents</h2>
          <div className="mt-4">
            <MyDocuments />
          </div>
        </section>

        <section id="courses" className={SECTION_ANCHOR}>
          <h2 className="text-xl">Your courses</h2>
          <div className="mt-4">
            <MyCourses />
          </div>
        </section>

        <section id="purchases" className={SECTION_ANCHOR}>
          <h2 className="text-xl">Purchase history</h2>
          <div className="mt-4">
            <MyPurchases />
          </div>
        </section>
      </PageBody>
    </>
  );
}
