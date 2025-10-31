import { NpmRegistry } from '@client-zone/npm'
import { strict as a } from 'assert'

const api = new NpmRegistry()
const [test, only, skip] = [new Map(), new Map(), new Map()]

test.set('getPackage', async function () {
  const result = await api.getPackage(['renamer'])
  a.equal(result.name, 'renamer')
})

test.set('search: over 250 packages', async function () {
  const result = await api.search({ text: 'maintainer:fb' })
  a.ok(result.length > 300)
})

test.set('search', async function () {
  const result = await api.search({ text: 'maintainer:75lb' })
  a.ok(result.length > 100)
}, { timeout: 20000 })

export { test, only, skip }
