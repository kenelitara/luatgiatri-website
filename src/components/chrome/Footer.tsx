import Link from 'next/link'
import { fullAddress, getNavigation, getSiteSettings } from '@/lib/site'

export async function Footer() {
  const [s, nav] = await Promise.all([getSiteSettings(), getNavigation()])

  return (
    <footer className="mt-16 bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{s.brandName}</p>
          {s.legalEntityName ? <p className="text-sm">{s.legalEntityName}</p> : null}
          {s.taxCode ? <p className="text-sm">MST: {s.taxCode}</p> : null}
        </div>
        <div className="text-sm leading-7">
          <p>{fullAddress(s)}</p>
          <a href={`tel:${s.hotline}`} className="hover:text-white">
            {s.hotline}
          </a>
          <br />
          <a href={`mailto:${s.email}`} className="hover:text-white">
            {s.email}
          </a>
        </div>
        <div className="text-sm leading-7">
          {nav.footerLinks?.length
            ? nav.footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block hover:text-white">
                  {link.label}
                </Link>
              ))
            : null}
          <Link href="/chinh-sach-bao-mat/" className="block hover:text-white">
            Chính sách bảo mật
          </Link>
        </div>
      </div>
      <div className="border-t border-brand-800 py-3 text-center text-xs">
        © {new Date().getFullYear()} {s.brandName}. Bảo lưu mọi quyền.
      </div>
    </footer>
  )
}
