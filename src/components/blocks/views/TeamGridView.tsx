import Image from 'next/image'
import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type TeamGridBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'teamGrid' }>

export function TeamGridView({ block }: { block: TeamGridBlock }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-section">
      <Heading>{block.heading}</Heading>
      <div className="grid gap-6 md:grid-cols-2">
        {block.members?.map((member, i) => {
          const author = typeof member === 'object' ? member : null
          const photo = author?.photo && typeof author.photo === 'object' ? author.photo : null
          return (
            <div key={i} className="rounded bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                {photo?.url ? (
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <Heading level={3}>{author?.name}</Heading>
                  {author?.credentials ? (
                    <p className="text-sm text-brand-600">{author.credentials}</p>
                  ) : null}
                </div>
              </div>
              {author?.bio ? (
                <p className="mt-3 text-sm leading-6 text-brand-800">{author.bio}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
