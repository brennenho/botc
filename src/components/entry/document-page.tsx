import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type DocumentPageProps = {
  title: string;
  headerDetail?: ReactNode;
  structuredData?: object;
  children: ReactNode;
  footer?: ReactNode;
};

export function DocumentPage({
  title,
  headerDetail,
  structuredData,
  children,
  footer,
}: DocumentPageProps) {
  return (
    <main className="entry-cover entry-document-cover">
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <div className="entry-leather" aria-hidden="true" />

      <article className="entry-document-panel">
        <div className="entry-document-inner">
          <Link href="/" className="entry-document-back">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>

          <header className="entry-document-header">
            <h1>{title}</h1>
            {headerDetail && (
              <div className="entry-document-header-detail">{headerDetail}</div>
            )}
          </header>

          <div className="entry-document-content">{children}</div>

          {footer && (
            <footer className="entry-document-footer">{footer}</footer>
          )}
        </div>
      </article>
    </main>
  );
}

export function DocumentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function DocumentFooter({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <h2>{title}</h2>
      {children}
    </>
  );
}
