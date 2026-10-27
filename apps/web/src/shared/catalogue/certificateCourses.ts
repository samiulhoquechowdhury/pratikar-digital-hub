/**
 * The certificate courses being prepared, from the client's syllabi in R2
 * (courses/*.docx): what the home page and /courses show while courses are
 * coming soon (COURSES_LIVE). No lessons or prices yet, so nothing here can
 * be bought — once a course is live in the LMS it replaces its entry.
 */

export type CourseArea = "legal" | "business" | "digital" | "career";

export const COURSE_AREAS: Record<CourseArea, string> = {
  legal: "Law practice",
  business: "Business & compliance",
  digital: "Digital skills",
  career: "Career skills",
};

export interface PlannedCourse {
  /** Its anchor on /courses. */
  slug: string;
  title: string;
  area: CourseArea;
  /** As the syllabus gives it — "8 weeks", "1–3 months". */
  duration: string;
  modules: number;
}

export const PLANNED_COURSES: PlannedCourse[] = [
  {
    slug: "arbitration-mediation",
    title: "Arbitration & Mediation",
    area: "legal",
    duration: "10 weeks",
    modules: 12,
  },
  {
    slug: "banking-finance-law",
    title: "Banking & Finance Law",
    area: "legal",
    duration: "10 weeks",
    modules: 13,
  },
  {
    slug: "civil-litigation",
    title: "Civil Litigation",
    area: "legal",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "company-law-practice",
    title: "Company Law Practice",
    area: "legal",
    duration: "10 weeks",
    modules: 14,
  },
  {
    slug: "consumer-protection-law",
    title: "Consumer Protection Law",
    area: "legal",
    duration: "1–3 months",
    modules: 8,
  },
  {
    slug: "contract-drafting",
    title: "Contract Drafting",
    area: "legal",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "court-practice-and-procedure",
    title: "Court Practice and Procedure",
    area: "legal",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "criminal-litigation",
    title: "Criminal Litigation",
    area: "legal",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "cyber-law",
    title: "Cyber Law",
    area: "legal",
    duration: "10 weeks",
    modules: 12,
  },
  {
    slug: "gst-law-compliance",
    title: "GST Law & Compliance",
    area: "legal",
    duration: "8 weeks",
    modules: 15,
  },
  {
    slug: "intellectual-property-rights",
    title: "Intellectual Property Rights",
    area: "legal",
    duration: "1–3 months",
    modules: 9,
  },
  {
    slug: "legal-drafting",
    title: "Legal Drafting",
    area: "legal",
    duration: "12 weeks",
    modules: 16,
  },
  {
    slug: "legal-research-and-writing",
    title: "Legal Research and Writing",
    area: "legal",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "motor-accident-claims-practice",
    title: "Motor Accident Claims Practice",
    area: "legal",
    duration: "1–3 months",
    modules: 9,
  },
  {
    slug: "property-law-practice",
    title: "Property Law Practice",
    area: "legal",
    duration: "1–3 months",
    modules: 9,
  },
  {
    slug: "trademark-registration-practice",
    title: "Trademark Registration Practice",
    area: "legal",
    duration: "1–3 months",
    modules: 9,
  },
  {
    slug: "business-documentation",
    title: "Business Documentation",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "business-registration-in-india",
    title: "Business Registration in India",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "business-risk-management",
    title: "Business Risk Management",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "contract-management",
    title: "Contract Management",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "corporate-governance",
    title: "Corporate Governance",
    area: "business",
    duration: "8 weeks",
    modules: 10,
  },
  {
    slug: "e-commerce-business",
    title: "E-commerce Business",
    area: "business",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "entrepreneurship",
    title: "Entrepreneurship",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "llp-incorporation-compliance",
    title: "LLP Incorporation & Compliance",
    area: "business",
    duration: "8 weeks",
    modules: 10,
  },
  {
    slug: "msme-compliance",
    title: "MSME Compliance",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "private-limited-company-compliance",
    title: "Private Limited Company Compliance",
    area: "business",
    duration: "8 weeks",
    modules: 11,
  },
  {
    slug: "rural-entrepreneurship-community-development",
    title: "Rural Entrepreneurship & Community Development",
    area: "business",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "startup-legal-compliance",
    title: "Startup Legal Compliance",
    area: "business",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "ai-for-professionals",
    title: "AI for Professionals",
    area: "digital",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "content-writing",
    title: "Content Writing",
    area: "digital",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "cyber-security-awareness",
    title: "Cyber Security Awareness",
    area: "digital",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    area: "digital",
    duration: "12 weeks",
    modules: 14,
  },
  {
    slug: "freelancing-online-income",
    title: "Freelancing & Online Income",
    area: "digital",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "prompt-engineering",
    title: "Prompt Engineering",
    area: "digital",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "search-engine-optimization",
    title: "Search Engine Optimization",
    area: "digital",
    duration: "8–12 weeks",
    modules: 10,
  },
  {
    slug: "social-media-marketing",
    title: "Social Media Marketing",
    area: "digital",
    duration: "8–12 weeks",
    modules: 10,
  },
  {
    slug: "website-creation-using-wordpress",
    title: "Website Creation using WordPress",
    area: "digital",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "interview-skills",
    title: "Interview Skills",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "leadership-skills",
    title: "Leadership Skills",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "negotiation-skills",
    title: "Negotiation Skills",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "office-management",
    title: "Office Management",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "personal-finance-management",
    title: "Personal Finance Management",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "professional-qualification",
    title: "Professional Qualification",
    area: "career",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "public-speaking",
    title: "Public Speaking",
    area: "career",
    duration: "8 weeks",
    modules: 12,
  },
  {
    slug: "resume-sop-writing",
    title: "Resume & SOP Writing",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
  {
    slug: "time-management",
    title: "Time Management",
    area: "career",
    duration: "12 weeks",
    modules: 12,
  },
];
