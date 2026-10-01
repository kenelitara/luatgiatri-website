import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Renderer } from './Renderer'

/** Minimal Lexical node shape — what Payload actually stores in richText fields. */
const lexical = (text: string) => ({
  root: {
    type: 'root',
    version: 0,
    children: [
      { type: 'paragraph', version: 0, children: [{ type: 'text', version: 0, text }] },
    ],
  },
})

// Minimal typed fixtures matching the Page['layout'] union shape.
const richText = {
  blockType: 'richText',
  body: lexical('Đoạn văn.'),
} as never

const servicePair = {
  blockType: 'servicePair',
  image: undefined,
  heading: 'Kế toán trọn gói',
  body: lexical('Mô tả.'),
  bullets: [{ item: 'Báo cáo thuế' }],
} as never

const faq = {
  blockType: 'faq',
  heading: 'Câu hỏi thường gặp',
  items: [
    { question: 'Thành lập công ty cần gì?', answer: lexical('Giấy tờ.') },
    { question: 'Bao lâu?', answer: lexical('3 ngày.') },
  ],
} as never

function headingLevels(html: string): number[] {
  const matches = [...html.matchAll(/<h([1-6])/g)]
  return matches.map((m) => Number(m[1]))
}

describe('Renderer heading discipline (spec §6.4)', () => {
  it('renders no h1 — the page shell owns the single h1', () => {
    const html = renderToStaticMarkup(<Renderer blocks={[richText, servicePair, faq]} />)
    expect(html).not.toContain('<h1')
  })

  it('never skips heading levels', () => {
    const html = renderToStaticMarkup(<Renderer blocks={[servicePair, faq]} />)
    const levels = headingLevels(html)
    let prev = 1
    for (const level of levels) {
      expect(level - prev).toBeLessThanOrEqual(1)
      prev = level
    }
  })

  it('renders all provided blocks (no silent drops)', () => {
    const html = renderToStaticMarkup(<Renderer blocks={[richText, faq]} />)
    expect(html).toContain('Đoạn văn.')
    expect(html).toContain('Thành lập công ty cần gì?')
  })
})