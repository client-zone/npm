import TestRunner from 'test-runner'
import NpmRegistry from '@75lb/npm-api/registry'
import assert from 'assert'
import fetch from 'node-fetch'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })
const api = new NpmRegistry({ fetch })

tom.test('getPackage', async function () {
  const result = await api.getPackage(['renamer'])
  a.equal(result.name, 'renamer')
})

tom.test('getPackagesByMaintainer', async function () {
  const result = await api.getPackagesByMaintainer('75lb')
  a.ok(result.length > 100)
})

tom.test('getPackagesByMaintainer - over 250 packages', async function () {
  const result = await api.getPackagesByMaintainer('substack')
  a.ok(result.length > 900)
})

tom.test('search', async function () {
  const result = await api.search({ text: 'maintainer:75lb' })
  a.ok(result.length > 100)
}, { timeout: 20000 })

export default tom
