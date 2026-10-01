'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export type HeroSlide = {
  image: { url?: string | null; alt: string }
  headline: string
  subheadline?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
}

/**
 * The ONLY client component on the public site (spec §6.8). All slides are
 * server-rendered into the DOM and stay mounted — inactive slides are hidden
 * with opacity + inert, so every slide's copy is in the HTML for crawlers.
 * With one slide it renders a static hero (no dots, no autoplay, no controls).
 *
 * `showOverlay` (default false): the legacy banners already carry their own
 * headline/design baked into the image, so overlaying our own text + a dark
 * scrim would double the text and dim the artwork. Off by default means the
 * banner shows as designed; still the slide copy is present in the DOM for
 * crawlers (visually-hidden heading), so SEO and accessibility are unaffected.
 */
export function HeroCarousel({
  slides,
  intervalMs = 6000,
  showOverlay = false,
}: {
  slides: HeroSlide[]
  intervalMs?: number
  showOverlay?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const isCarousel = slides.length > 1

  useEffect(() => {
    if (!isCarousel || !playing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs)
    return () => clearInterval(id)
  }, [isCarousel, playing, intervalMs, slides.length])

  return (
    <section
      className="relative aspect-[21/9] min-h-[320px] w-full overflow-hidden"
      onMouseEnter={() => isCarousel && setPlaying(false)}
      onMouseLeave={() => isCarousel && setPlaying(true)}
      onFocus={() => isCarousel && setPlaying(false)}
      onBlur={() => isCarousel && setPlaying(true)}
    >
      {slides.map((slide, i) => {
        const active = i === index
        return (
          <div
            key={i}
            inert={!active}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <Image
              src={slide.image.url ?? ''}
              alt={slide.image.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            {showOverlay ? (
              <>
                <div className="absolute inset-0 bg-brand-950/55" />
                <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 text-white">
                  <h2 className="max-w-2xl text-hero font-bold">{slide.headline}</h2>
                  {slide.subheadline ? (
                    <p className="mt-3 max-w-xl text-lg">{slide.subheadline}</p>
                  ) : null}
                  {slide.ctaHref && slide.ctaLabel ? (
                    <Link
                      href={slide.ctaHref}
                      className="mt-6 w-fit rounded bg-gold-500 px-6 py-3 font-semibold text-brand-950 hover:bg-gold-400"
                    >
                      {slide.ctaLabel}
                    </Link>
                  ) : null}
                </div>
              </>
            ) : (
              /* banner already carries its text: keep the copy in the DOM for
                 crawlers, visually hidden (heading law: h2, never h1) */
              <h2 className="sr-only">{slide.headline}</h2>
            )}
          </div>
        )
      })}

      {isCarousel ? (
        <>
          <div
            data-carousel-dots
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Chuyển tới slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-gold-500' : 'bg-white/50'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="absolute bottom-4 right-4 rounded bg-brand-950/70 px-3 py-1.5 text-sm text-white hover:bg-brand-950"
          >
            {playing ? 'Tạm dừng' : 'Phát'}
          </button>
        </>
      ) : null}
    </section>
  )
}
