import NpmScrape from '@client-zone/npm/scrape'
import { strict as a } from 'assert'

const api = new NpmScrape({ console })
const [test, only, skip] = [new Map(), new Map(), new Map()]

/**
 * Currently blocked by Cloudflare. Could be fixed by using Puppeteer.
 */
skip.set('getDependents', async function () {
  const result = await api.getDependents('jsdoc-api')
  // this.data = result.length
  a.ok(result.length > 60)
})

export { test, only, skip }
