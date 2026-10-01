import Link from 'next/link'
import { getNavigation, getSiteSettings } from '@/lib/site'

/** attorneyshere.com pattern: centered logo, horizontal nav beneath it. */
export async function Header() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getNavigation()])

  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex justify-center py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-brand-900">
            {settings.brandName}
          </Link>
        </div>
        <nav aria-label="Menu chính" className="flex flex-wrap justify-center gap-6 pb-3">
          {nav.headerItems?.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-brand-800 hover:text-gold-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
