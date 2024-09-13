import NpmApiClient from '@client-zone/npm/npms'
import { strict as a } from 'assert'

// const tom = new Tom({ maxConcurrency: 2 })
const api = new NpmApiClient()
const [test, only, skip] = [new Map(), new Map(), new Map()]

test.set('getPackage', async function () {
  const result = await api.getPackage(['renamer'])
  a.equal(result.collected.metadata.name, 'renamer')
})

test.set('search: deprecated', async function () {
  const result = await api.search('maintainer:75lb is:deprecated')
  a.ok(result.every(r => r.flags.deprecated))
  a.ok(result.length > 5)
}, { timeout: 20000 })

test.set('search: maxResults met', async function () {
  const result = await api.search('work', { maxResults: 500 })
  a.equal(result.length, 500)
}, { timeout: 20000 })

export { test, only, skip }
