import { getDbPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await getDbPool().query('SELECT 1')
    return Response.json({ status: 'ok' })
  } catch (err) {
    console.error('[health] db check failed:', err)
    return Response.json({ status: 'error' }, { status: 503 })
  }
}
