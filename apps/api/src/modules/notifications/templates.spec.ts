import {
  certificateIssued,
  courseExpiring,
  refundIssued,
  reviewReady,
  staffNewOrder,
  staffReviewRequested,
  purchaseConfirmation,
} from "./templates";

const purchase = {
  customerName: "Asha Rao",
  itemTitle: "GST for Freelancers",
  amountInPaise: 100_000,
  gstInPaise: 18_000,
  destinationPath: "/dashboard/courses",
  destinationLabel: "Start the course",
};

/**
 * An email cannot be corrected after it is sent, so the things worth pinning
 * are the ones a customer would notice and complain about: the amount, and
 * whether the links go anywhere.
 */
describe("purchaseConfirmation", () => {
  it("shows amount, GST and the total that was actually charged", () => {
    const { html } = purchaseConfirmation(purchase);
    expect(html).toContain("Rs 1,000.00");
    expect(html).toContain("Rs 180.00");
    expect(html).toContain("Rs 1,180.00");
  });

  it.each([
    [0, "0.00"],
    [50, "0.50"],
    [9_900, "99.00"],
    [123_456, "1,234.56"],
    // Indian grouping: pairs above the last three digits, not triples.
    [12_345_678, "1,23,456.78"],
  ])("formats %i paise as %s", (paise, expected) => {
    const { html } = purchaseConfirmation({
      ...purchase,
      amountInPaise: paise,
      gstInPaise: 0,
    });
    expect(html).toContain(`Rs ${expected}`);
  });

  it("names the customer when known, and greets them anyway when not", () => {
    expect(purchaseConfirmation(purchase).html).toContain("Thanks, Asha Rao");
    // OTP signup collects no name, so this is the common case, not an edge.
    const anon = purchaseConfirmation({ ...purchase, customerName: null });
    expect(anon.html).toContain("Thanks for your purchase");
    expect(anon.html).not.toContain("null");
  });

  it("puts what was bought in the subject line", () => {
    expect(purchaseConfirmation(purchase).subject).toContain(
      "GST for Freelancers",
    );
  });

  /**
   * Links, not attachments. A signed download URL expires in five minutes and
   * would be dead before most people opened the mail.
   */
  it("links to the account rather than attaching the invoice", () => {
    const { html } = purchaseConfirmation(purchase);
    expect(html).toContain("/dashboard/orders");
    expect(html).not.toMatch(/attachment|\.pdf/i);
  });

  it("builds absolute URLs from the configured site", () => {
    const original = process.env.PUBLIC_SITE_URL;
    process.env.PUBLIC_SITE_URL = "https://pratikar.example";
    try {
      // A relative href in an email goes nowhere — there is no page it is
      // relative to.
      const { html } = purchaseConfirmation(purchase);
      expect(html).toContain("https://pratikar.example/dashboard/courses");
      expect(html).not.toMatch(/href="\//);
    } finally {
      process.env.PUBLIC_SITE_URL = original;
    }
  });

  it("uses near-black on gold for the button, never white", () => {
    // White on gold is 2.1:1 and fails at any size — and unlike a web page,
    // an email cannot be fixed after it has been delivered.
    const { html } = purchaseConfirmation(purchase);
    expect(html).toContain("background:#d4af37");
    expect(html).toContain("color:#081729");
    expect(html).not.toMatch(/background:#d4af37;color:#fff/i);
  });
});

describe("reviewReady", () => {
  it("names the document and links straight to it", () => {
    const mail = reviewReady({
      customerName: null,
      documentTitle: "Rent Agreement",
      documentId: "doc-1",
    });
    expect(mail.subject).toContain("Rent Agreement");
    expect(mail.html).toContain("/dashboard/documents/doc-1");
  });
});

describe("refundIssued", () => {
  it("states the amount and that access has ended", () => {
    const { html } = refundIssued({
      customerName: "Asha Rao",
      itemTitle: "GST for Freelancers",
      totalInPaise: 118_000,
    });
    expect(html).toContain("Rs 1,180.00");
    // Finding out by clicking a dead link is worse than being told.
    expect(html).toMatch(/access to it has ended/i);
    expect(html).toContain("credit note");
  });
});

describe("escaping", () => {
  // A customer's own name is quoted in staff alerts.
  it("never lets a name or title put markup into an email", () => {
    const mail = staffNewOrder({
      customerName: '<a href="https://evil.example">Click</a>',
      customerContact: null,
      itemTitle: "Rent <b>Agreement</b>",
      itemKind: "document",
      totalInPaise: 14_900,
    });
    expect(mail.html).not.toContain('<a href="https://evil.example"');
    expect(mail.html).toContain("&lt;a href=&quot;https://evil.example&quot;");
    expect(mail.html).toContain("Rent &lt;b&gt;Agreement&lt;/b&gt;");
  });

  it("escapes the customer emails too", () => {
    const mail = reviewReady({
      customerName: "<script>x</script>",
      documentTitle: "Deed",
      documentId: "doc-1",
    });
    expect(mail.html).not.toContain("<script>");
  });
});

describe("certificateIssued", () => {
  it("links to the certificate and its public verification page", () => {
    const original = process.env.PUBLIC_SITE_URL;
    process.env.PUBLIC_SITE_URL = "https://pratikar.example";
    try {
      const mail = certificateIssued({
        customerName: "Asha",
        courseTitle: "GST for Freelancers",
        enrollmentId: "enr-1",
        verificationCode: "abc123",
      });
      expect(mail.subject).toBe(
        "Your certificate is ready — GST for Freelancers",
      );
      expect(mail.html).toContain(
        "https://pratikar.example/learn/enr-1/certificate",
      );
      expect(mail.html).toContain("https://pratikar.example/verify/abc123");
    } finally {
      process.env.PUBLIC_SITE_URL = original;
    }
  });
});

describe("courseExpiring", () => {
  const payload = {
    customerName: "Asha",
    courseTitle: "GST for Freelancers",
    enrollmentId: "enr-1",
    expiresAt: new Date("2026-10-13T12:00:00Z"),
    progress: { done: 1, total: 4 },
  };

  it("names the day access ends, in India", () => {
    const mail = courseExpiring(payload);
    expect(mail.subject).toBe(
      "Your access to GST for Freelancers ends on 13 October 2026",
    );
    expect(mail.html).toContain("1 of 4 lessons");
  });

  it("leaves out progress it doesn't know", () => {
    expect(courseExpiring({ ...payload, progress: null }).html).not.toContain(
      "lessons.</p>",
    );
  });
});

describe("staff alerts", () => {
  it("link into the admin panel, not the website", () => {
    const original = process.env.ADMIN_SITE_URL;
    process.env.ADMIN_SITE_URL = "https://admin.pratikar.example";
    try {
      expect(
        staffReviewRequested({ customerName: "Asha", documentTitle: "Deed" })
          .html,
      ).toContain("https://admin.pratikar.example/reviews");
    } finally {
      process.env.ADMIN_SITE_URL = original;
    }
  });
});
