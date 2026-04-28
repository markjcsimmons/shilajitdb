import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the Shilajit Transparency Database.",
};

export default function TermsPage() {
  const lastUpdated = "April 2025";

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#3D7AFF] mb-4">Legal</p>
      <h1 className="font-serif text-3xl font-bold text-[#EEF0F8] mb-2">Terms of Use</h1>
      <p className="text-xs text-[#4A5070] mb-10">Last updated: {lastUpdated}</p>

      <div className="prose prose-invert max-w-none space-y-8 text-sm text-[#8892B8] leading-relaxed">

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">1. Acceptance</h2>
          <p>
            By accessing or using the Shilajit Transparency Database ("the Site"), you agree to these Terms of Use.
            If you do not agree, do not use the Site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">2. Permitted Use</h2>
          <p>
            You may browse, search, and reference information on the Site for personal, non-commercial purposes.
            You may link to individual product or brand pages from your own website or publication,
            provided you do not misrepresent the source.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">3. Prohibited Use</h2>
          <p>The following are expressly prohibited:</p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li>
              <strong className="text-[#EEF0F8]">Automated scraping or harvesting.</strong> You may not use bots,
              crawlers, scrapers, or any automated means to extract, copy, or index data from the Site in bulk,
              regardless of the technical method used.
            </li>
            <li>
              <strong className="text-[#EEF0F8]">Commercial redistribution.</strong> You may not republish, sell,
              or sublicense the Site's data or content, in whole or in part, without written permission.
            </li>
            <li>
              <strong className="text-[#EEF0F8]">AI training.</strong> You may not use content from the Site to
              train, fine-tune, or evaluate machine learning models, including large language models.
            </li>
            <li>
              <strong className="text-[#EEF0F8]">Interference.</strong> You may not take actions that impose an
              unreasonable load on the Site's infrastructure or that interfere with other users' access.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">4. Intellectual Property</h2>
          <p>
            The selection, arrangement, and presentation of data on the Site — including grading methodology,
            scoring, editorial labels, and written descriptions — are original works protected by copyright.
            Factual data points (e.g., a product's price or a laboratory's name) are not owned by the Site,
            but the compiled database as a whole is a protectable database under applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">5. No Medical Advice</h2>
          <p>
            Nothing on the Site constitutes medical advice, diagnosis, or treatment recommendations.
            Always consult a qualified healthcare professional before using any dietary supplement.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">6. Disclaimer of Warranties</h2>
          <p>
            The Site is provided "as is" without warranties of any kind. We make reasonable efforts to
            keep information accurate and up to date, but we do not guarantee completeness, accuracy,
            or fitness for any particular purpose.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, we are not liable for any indirect, incidental,
            or consequential damages arising from your use of the Site or reliance on its content.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">8. Changes</h2>
          <p>
            We may update these Terms at any time. Continued use of the Site after changes are posted
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#EEF0F8] mb-3">9. Contact</h2>
          <p>
            For licensing enquiries or to report a data error, contact us via the{" "}
            <Link href="/about" className="text-[#6E9FFF] hover:text-[#EEF0F8] transition-colors">
              About page
            </Link>
            .
          </p>
        </section>

      </div>
    </div>
  );
}
