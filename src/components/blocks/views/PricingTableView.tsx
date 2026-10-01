import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type PricingTableBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'pricingTable' }>

export function PricingTableView({ block }: { block: PricingTableBlock }) {
  const threeCols = block.columns === 'service-term-fee'
  return (
    <section className="mx-auto max-w-4xl px-4 py-section">
      {block.heading ? <Heading>{block.heading}</Heading> : null}
      {block.groups?.map((group, gi) => (
        <div key={gi} className="mb-8">
          {group.title ? <Heading level={3}>{group.title}</Heading> : null}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-800">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Dịch vụ
                </th>
                {threeCols ? (
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Thời hạn
                  </th>
                ) : null}
                <th scope="col" className="py-2 font-semibold">
                  Phí
                </th>
              </tr>
            </thead>
            <tbody>
              {group.rows?.map((row, ri) => (
                <tr key={ri} className="border-b border-brand-50">
                  <td className="py-2 pr-4">{row.service}</td>
                  {threeCols ? <td className="py-2 pr-4">{row.term}</td> : null}
                  <td className="py-2 font-semibold text-gold-700">{row.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {block.note ? <p className="mt-2 text-sm text-brand-600">{block.note}</p> : null}
    </section>
  )
}
