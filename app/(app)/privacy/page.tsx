"use client"

import { GithubIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<"en" | "zh">("en")

  useEffect(() => {
    if (navigator.language.startsWith("zh")) {
      setLang("zh")
    }
  }, [])

  const content = {
    en: {
      title: "One Calendar Privacy Policy",
      lastUpdated: "Last updated: May 2, 2025",
      intro: "At One Calendar, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our services, including our website and application.",
      sections: [
        {
          heading: "1. Information We Collect",
          content: [
            "Account Information: When you sign up using Clerk authentication (via GitHub, Google, or Microsoft), we collect your email address, name, and profile information provided by these services to create and manage your account.",
            "Calendar Data: Events, schedules, and related data you input into One Calendar are stored to provide our scheduling and collaboration features.",
            "Usage Data: We collect information about how you interact with our services, such as pages visited, features used, and device information (e.g., browser type, IP address).",
            "Files Uploaded: Any files you upload to One Calendar, stored via Vercel Blob or Misskey Drive, are used solely to enhance your experience, such as attaching documents to events.",
            "Location Data: We will request to collect your location data to get the weather in your area. This is optional and you can refuse it, but the weather component may not work properly."
          ]
        },
        {
          heading: "2. How We Use Your Information",
          content: [
            "To provide and improve our services, including personalizing your calendar experience and enabling collaboration features.",
            "To authenticate your identity via Clerk and ensure secure access to your account.",
            "To analyze usage patterns and optimize our platform's performance and user experience.",
            "To communicate with you, such as sending service-related notifications or responding to your inquiries."
          ]
        },
        {
          heading: "3. Data Storage and Security",
          content: [
            "Your data is stored securely using Vercel’s infrastructure, with encryption at rest and in transit.",
            "Files uploaded via Vercel Blob or Misskey Drive are stored in a manner that ensures only you (and those you explicitly share with) can access them.",
            "We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure.",
            "While we strive to protect your information, no system is completely secure, and we cannot guarantee absolute security."
          ]
        },
        {
          heading: "4. Third-Party Services",
          content: [
            "Clerk Authentication: We use Clerk to manage user authentication. When you log in via GitHub, Google, or Microsoft, Clerk processes your credentials and shares limited profile information with us. Please review Clerk’s Privacy Policy for details.",
            "Vercel Blob: Files you upload are stored using Vercel Blob. Vercel’s Privacy Policy governs their handling of your data.",
            "Misskey Drive: Files you upload are stored via Misskey Drive. Misskey's privacy policy governs how they handle your data.",
            "Groq: Your AI chat history is sent to Groq for AI replies. Groq's privacy policy governs what they do with your data.",
            "We do not share your data with other third parties except as necessary to provide our services or as required by law."
          ]
        },
        {
          heading: "5. Data Sharing and Disclosure",
          content: [
            "Your calendar data is private by default and only shared with others if you explicitly enable collaboration features.",
            "We may disclose your information if required by law, such as in response to a court order or subpoena.",
            "In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of the transaction, with safeguards to maintain your privacy."
          ]
        },
        {
          heading: "6. Your Rights and Choices",
          content: [
            "You can access, update, or delete your account information at any time through your One Calendar account settings.",
            "You can opt out of non-essential communications by adjusting your notification preferences.",
            "If you’re in a region with specific data protection laws (e.g., GDPR or CCPA), you may have additional rights, such as requesting a copy of your data or restricting certain processing. Contact us to exercise these rights."
          ]
        },
        {
          heading: "7. Data Retention",
          content: [
            "We retain your data for as long as your account is active or as needed to provide our services.",
            "If you delete your account, we will remove your personal information and uploaded files within 30 days, except where required to retain data for legal purposes."
          ]
        },
        {
          heading: "8. Children’s Privacy",
          content: [
            "One Calendar is a simple and safe calendar tool designed to be suitable for users of all ages, including children. Parents or guardians can manage accounts for children to ensure appropriate use.",
            "We collect and process personal information from children in the same manner as adults, but we encourage parental supervision to ensure privacy and safety."
          ]
        },
        {
          heading: "9. Changes to This Privacy Policy",
          content: [
            "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated 'Last updated' date.",
            "We encourage you to review this policy periodically to stay informed about how we protect your data."
          ]
        },
        {
          heading: "10. Contact Us",
          content: [
            "If you have questions or concerns about this Privacy Policy, please contact us at evan.huang000@proton.me or via GitHub.",
            "You can also reach out to provide feedback or report privacy-related issues."
          ]
        }
      ],
      cta: "Have feedback or want to contribute to One Calendar?",
      github: "Visit our GitHub",
      home: "Back to Home"
    }
  }

  const t = content[lang]

  return (
    <div className="min-h-screen flex flex-col text-black dark:text-white">
      <main className="max-w-3xl mx-auto px-6 py-24">
        <div className="fixed -z-10 inset-0">
        <div className="absolute inset-0 bg-white dark:bg-black">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
          <div className="absolute inset-0 dark:block hidden" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }} />
        </div>
      </div>
        <h1 className="text-4xl font-bold text-center mb-12">{t.title}</h1>
        <p className="text-sm text-gray-500 text-center mb-8 dark:text-white">{t.lastUpdated}</p>
        <div className="space-y-8 text-left">
          <p className="text-lg text-gray-700 leading-relaxed dark:text-white">{t.intro}</p>
          {t.sections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.content.map((item, j) => (
                <p key={j} className="text-lg text-gray-700 leading-relaxed dark:text-white">
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>
      </main>

      <section className="text-center px-6 py-16">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-xl font-medium dark:text-white">{t.cta}</h2>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="https://github.com/Dev-Huang1/One-Calendar"
              target="_blank"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <GithubIcon className="w-4 h-4" />
              {t.github}
            </Link>
            <Link href="/" className="text-sm text-gray-500 underline hover:text-black">
              {t.home}
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-8 border-t border-black/10 dark:border-white/10 text-gray-600 dark:text-white/70 text-sm px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2025 One Calendar. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/about" className="hover:text-gray-900 dark:hover:text-white">About</a>
            <a href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms</a>
            <a href="https://github.com/EvanTechDev/One-Calendar" target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
              <GithubIcon className="w-4 h-4" />
            </a>
            <a href="https://x.com/One__Cal" target="_blank" className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 32 32">
                <path fill="currentColor" d="M 4.0175781 4 L 13.091797 17.609375 L 4.3359375 28 L 6.9511719 28 L 14.246094 19.34375 L 20.017578 28 L 20.552734 28 L 28.015625 28 L 18.712891 14.042969 L 27.175781 4 L 24.560547 4 L 17.558594 12.310547 L 12.017578 4 L 4.0175781 4 z M 7.7558594 6 L 10.947266 6 L 24.279297 26 L 21.087891 26 L 7.7558594 6 z"></path>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
