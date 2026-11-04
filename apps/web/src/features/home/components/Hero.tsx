import { existsSync } from "node:fs";
import path from "node:path";

import { BrandMark } from "@pratikar/ui";
import {
  ArrowRight,
  Check,
  FilePenLine,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/shared/components/Icon";
import { COURSES_LIVE } from "@/shared/lib/features";
import { shelfHref } from "@/shared/lib/navigation";

import { countLabel, type CatalogueSummary } from "../lib/catalogueSummary";

import { BannerCarousel, type Banner } from "./BannerCarousel";
import { CertificateArt, FormArt, StampArt } from "./illustrations";

/**
 * A banner picture dropped into public/brand under this name, in whichever
 * format it was saved — or nothing, and the banner keeps its drawing.
 */
function brandImage(name: string): string | undefined {
  const dir = path.join(process.cwd(), "public", "brand");
  const ext = ["webp", "png", "jpg", "jpeg"].find((e) =>
    existsSync(path.join(dir, `${name}.${e}`)),
  );
  return ext && `/brand/${name}.${ext}`;
}

/** A transparent cut-out scene standing in for a banner's drawing. */
function SceneImage({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={1536}
      height={1024}
      sizes="560px"
      className="h-auto w-[35rem] max-w-none drop-shadow-2xl"
    />
  );
}

const FRAME = "mx-auto max-w-shell px-4 sm:px-6 lg:px-8";

type Tone = "navy" | "sky" | "sand" | "mint" | "lilac";

const TONES: Record<
  Tone,
  { ground: string; dark: boolean; blob: string; tag: string }
> = {
  navy: {
    ground: "bg-noir-glow",
    dark: true,
    blob: "bg-white/[0.06]",
    tag: "bg-brand text-on-brand",
  },
  sky: {
    ground: "bg-banner-sky",
    dark: false,
    blob: "bg-white/70",
    tag: "bg-noir text-white",
  },
  sand: {
    ground: "bg-banner-sand",
    dark: false,
    blob: "bg-white/70",
    tag: "bg-noir text-white",
  },
  mint: {
    ground: "bg-banner-mint",
    dark: false,
    blob: "bg-white/70",
    tag: "bg-noir text-white",
  },
  lilac: {
    ground: "bg-banner-lilac",
    dark: false,
    blob: "bg-white/70",
    tag: "bg-noir text-white",
  },
};

/**
 * One hero banner, Coursera's shape: a rounded tinted panel, the brand and
 * a tag, a large headline, one line, one button — and on the right a picture
 * of the thing itself, drawn rather than photographed.
 */
function BannerPanel({
  tone,
  tag,
  title,
  body,
  cta,
  secondary,
  art,
  photo,
  cutout,
}: {
  tone: Tone;
  tag: string;
  title: ReactNode;
  body: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
  art?: ReactNode;
  /** A full picture in place of the drawn art — it fills the right half and
   *  fades into the panel on its left edge. */
  photo?: string;
  /** A cut-out picture standing on the panel's bottom edge. */
  cutout?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      data-surface={t.dark ? "inverse" : undefined}
      className={`relative isolate grid min-h-[26rem] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl ${t.ground} lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]`}
    >
      <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-12 lg:py-12 lg:pl-14">
        <p className="flex items-center gap-3">
          <span
            className={`grid h-8 w-8 place-items-center rounded-md ${t.dark ? "bg-white text-noir" : "bg-noir text-brand"}`}
          >
            <BrandMark className="h-4 w-auto" />
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${t.tag}`}
          >
            {tag}
          </span>
        </p>
        <h2
          className={`mt-5 max-w-xl text-3xl font-extrabold leading-[1.12] sm:text-[2.6rem] ${t.dark ? "text-white" : "text-noir"}`}
        >
          {title}
        </h2>
        <p
          className={`mt-4 max-w-lg text-lg leading-relaxed ${t.dark ? "text-white/80" : "text-noir/75"}`}
        >
          {body}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={cta.href} className={t.dark ? "btn-gold" : "btn-noir"}>
            {cta.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={`group inline-flex items-center gap-1.5 font-semibold ${t.dark ? "text-white" : "text-noir"}`}
            >
              <span className="link-draw">{secondary.label}</span>
              <Icon
                icon={ArrowRight}
                size="xs"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </div>
      </div>

      {photo ? (
        <div
          aria-hidden
          className="relative hidden min-h-[20rem] select-none [mask-image:linear-gradient(to_right,transparent,black_30%)] lg:block"
        >
          <Image
            src={photo}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover object-center"
          />
        </div>
      ) : (
        /* The picture: a soft disc behind a drawn scene, bleeding off the
           right edge like a photograph would. */
        <div
          aria-hidden
          className="relative hidden min-h-[20rem] select-none items-center justify-center lg:flex"
        >
          <span
            className={`absolute -right-24 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full ${t.blob}`}
          />
          <span
            className={`absolute right-40 top-10 h-24 w-24 rounded-full ${t.dark ? "bg-brand/20" : "bg-brand/25"}`}
          />
          {cutout ? (
            <Image
              src={cutout}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 0px"
              className="object-contain object-bottom"
            />
          ) : (
            <div className="relative">{art}</div>
          )}
        </div>
      )}
    </div>
  );
}

/** A small white card floating on a banner's picture. */
function Chip({
  icon,
  label,
  sub,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <span
      className={`absolute flex items-center gap-2.5 whitespace-nowrap rounded-xl bg-white px-3.5 py-2.5 text-left shadow-float motion-safe:animate-float ${className}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-banner-sky text-noir">
        <Icon icon={icon} size="sm" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-noir">{label}</span>
        {sub && <span className="block text-xs text-noir/60">{sub}</span>}
      </span>
    </span>
  );
}

/**
 * The top of the home page: Coursera's banner carousel. Counts come from
 * the live catalogue.
 */
export function LandingHero({ summary }: { summary: CatalogueSummary }) {
  const forms = summary.library.FORM.count;
  const guides = summary.library.CHECKLIST.count + summary.library.EBOOK.count;

  const templatesArt = brandImage("hero-templates");
  const formsArt = brandImage("hero-forms");
  const coursesArt = brandImage("hero-courses");

  const banners: Banner[] = [
    {
      id: "drafting",
      label: "AI drafting",
      content: (
        <BannerPanel
          tone="navy"
          tag="New"
          title={
            <>
              Any legal document, drafted by AI —{" "}
              <span className="text-brand">checked by an advocate</span>
            </>
          }
          body="Describe what you need in your own words. A practising advocate reviews the draft before you download it."
          cta={{ href: "/documents/custom", label: "Draft my document" }}
          secondary={{ href: "#how-it-works", label: "How it works" }}
          photo="/brand/hero-drafting.webp"
        />
      ),
    },
    {
      id: "templates",
      label: "Ready templates",
      content: (
        <BannerPanel
          tone="sky"
          tag="Templates"
          title="Your rent agreement, ready in five minutes"
          body="Answer a few plain questions — on a form or by chat — and get a finished Word and PDF, ready to sign."
          cta={{ href: "/documents", label: "Create a document" }}
          secondary={{
            href: "/search?q=rent%20agreement",
            label: "See the rent agreement",
          }}
          art={
            templatesArt ? (
              <SceneImage src={templatesArt} />
            ) : (
              <div className="relative">
                <FormArt className="h-64 w-auto drop-shadow-xl" />
                <Chip
                  icon={MessagesSquare}
                  label="Fill it in by chat"
                  className="-left-28 top-4"
                />
                <Chip
                  icon={Check}
                  label="Word + PDF"
                  sub="Preview free"
                  className="-right-10 bottom-2 [animation-delay:1.5s]"
                />
              </div>
            )
          }
        />
      ),
    },
    {
      id: "forms",
      label: "Legal forms",
      content: (
        <BannerPanel
          tone="sand"
          tag="Library"
          title={
            forms > 0
              ? `${countLabel(forms)} legal forms, written by advocates`
              : "Legal forms, written by advocates"
          }
          body="Affidavits, notices, agreements and court formats — buy once, download whenever you need it."
          cta={{ href: shelfHref("FORM"), label: "Browse legal forms" }}
          secondary={{ href: "/content-library", label: "The whole library" }}
          art={
            formsArt ? (
              <SceneImage src={formsArt} />
            ) : (
              <div className="relative">
                <StampArt className="h-64 w-auto drop-shadow-xl" />
                <Chip
                  icon={FilePenLine}
                  label={
                    guides > 0
                      ? `${countLabel(guides)} guides too`
                      : "Guides too"
                  }
                  sub="Checklists & e-books"
                  className="-left-24 bottom-6"
                />
              </div>
            )
          }
        />
      ),
    },
    {
      id: "assistant",
      label: "Pratikar AI",
      content: (
        <BannerPanel
          tone="mint"
          tag="Pratikar AI"
          title="Not sure which document you need? Just ask."
          body="Describe your situation in English or Hindi. The assistant points you to the right document, form or guide."
          cta={{ href: "/assistant", label: "Ask a question" }}
          cutout="/brand/hero-assistant.webp"
        />
      ),
    },
    {
      id: "courses",
      label: "Courses",
      content: (
        <BannerPanel
          tone="lilac"
          tag={COURSES_LIVE ? "Courses" : "Coming soon"}
          title="Learn the law you use — and earn a certificate"
          body="Short video courses on GST, property and running a business, with a certificate anyone can verify."
          cta={{
            href: "/courses",
            label: COURSES_LIVE ? "Explore courses" : "See what's coming",
          }}
          secondary={{ href: "/verify", label: "Verify a certificate" }}
          cutout={coursesArt}
          art={
            <CertificateArt className="w-96 rotate-[-4deg] drop-shadow-2xl" />
          }
        />
      ),
    },
  ];

  return (
    <section aria-label="Featured" className="bg-white">
      <div className={`${FRAME} pb-4 pt-6 sm:pt-8`}>
        <h1 className="sr-only">
          Pratikar Digital Hub — legal documents, forms and guides, drafted
          right and checked by an advocate
        </h1>
        <BannerCarousel banners={banners} />
      </div>
    </section>
  );
}
