import { Heading } from '../Heading'
import type { Page } from '@/payload-types'

type TokenMatrixBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'tokenMatrix' }>

export function TokenMatrixView({ block }: { block: TokenMatrixBlock }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-section">
      <Heading>{block.heading}</Heading>
      {block.sections?.map((section, si) => (
        <div key={si} className="mb-8">
          <Heading level={3}>{section.title}</Heading>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-800">
                {(section.columns ?? []).map((col, ci) => (
                  <th key={ci} scope="col" className="py-2 pr-4 font-semibold">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(section.rows ?? []).map((row, ri) => (
                <tr key={ri} className="border-b border-brand-50">
                  {(row.cells ?? []).map((cell, ci) => (
                    <td key={ci} className="py-2 pr-4">{cell.value}</td>
                  ))}
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