import { mkdir, writeFile } from 'node:fs/promises'

const ORIGIN = 'https://luatgiatri.com'
const PAGES = {
  'home': '/',
  'gioi-thieu': '/gioi-thieu/',
  'thanh-lap-doanh-nghiep-tron-goi': '/thanh-lap-doanh-nghiep-tron-goi/',
  'dich-vu-ke-toan': '/dich-vu-ke-toan/',
  'hoa-don-dien-tu': '/hoa-don-dien-tu/',
  'chu-ky-so-token': '/chu-ky-so-token/',
  'dich-vu-lien-ket': '/dich-vu-lien-ket/',
  'ho-tro-doanh-nghiep': '/ho-tro-doanh-nghiep/',
  'lien-he': '/lien-he/',
}

await mkdir('seed/raw', { recursive: true })

for (const [name, path] of Object.entries(PAGES)) {
  const res = await fetch(ORIGIN + path, { headers: { 'user-agent': 'elitara-rebuild-capture/1.0' } })
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  const html = await res.text()
  if (!html.includes('Luật Gia Trí')) throw new Error(`${path}: page does not mention the brand — wrong page?`)
  await writeFile(`seed/raw/${name}.html`, html, 'utf8')
  console.log(`${name}: ${(html.length / 1024).toFixed(1)} KB`)
}
console.log('captured', Object.keys(PAGES).length, 'pages')