import { getSiteSettings } from '@/lib/site'

/** attorneyshere.com top-bar row: phone, email, social icons, on brand-navy. */
export async function TopBar() {
  const s = await getSiteSettings()
  const socials = [
    s.socials?.facebook && { label: 'Facebook', href: s.socials.facebook },
    s.socials?.zalo && { label: 'Zalo', href: s.socials.zalo },
    s.socials?.youtube && { label: 'YouTube', href: s.socials.youtube },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div className="bg-brand-950 text-brand-100 text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
        <div className="flex gap-4">
          <a href={`tel:${s.hotline}`} className="hover:text-white">
            ☎ {s.hotline}
          </a>
          <a href={`mailto:${s.email}`} className="hover:text-white">
            ✉ {s.email}
          </a>
        </div>
        <div className="flex gap-3">
          {socials.map((soc) => (
            <a key={soc.label} href={soc.href} className="hover:text-white">
              {soc.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
