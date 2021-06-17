import TestRunner from 'test-runner'
import NpmApiClient from '../npm-api.mjs'
import assert from 'assert'
import fetch from 'node-fetch'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })
const npmApi = new NpmApiClient({ fetch })

tom.test('getPackagesByMaintainer', async function () {
  const result = await npmApi.getPackagesByMaintainer('75lb')
  a.ok(result.length > 100)
})

tom.test('getPackagesByMaintainer - over 250 packages', async function () {
  const result = await npmApi.getPackagesByMaintainer('substack')
  a.ok(result.length > 900)
})

tom.skip('search', async function () {
  const result = await npmApi.search('maintainer:75lb')
  this.data = result
  a.ok(result.length > 5)
}, { timeout: 20000 })

tom.test('search: deprecated', async function () {
  const result = await npmApi.search('maintainer:75lb is:deprecated')
  a.ok(result.every(r => r.flags.deprecated))
  a.ok(result.length > 5)
}, { timeout: 20000 })

tom.test('search: maxResults met', async function () {
  const result = await npmApi.search('work', { maxResults: 1000 })
  a.equal(result.length, 1000)
}, { timeout: 20000 })

export default tom
