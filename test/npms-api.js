import TestRunner from 'test-runner'
import NpmApiClient from '@client-zone/npm/npms-api'
import assert from 'assert'
import fetch from 'node-fetch'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })
const api = new NpmApiClient({ fetch })

tom.test('getPackage', async function () {
  const result = await api.getPackage(['renamer'])
  a.equal(result.collected.metadata.name, 'renamer')
})

tom.test('search: deprecated', async function () {
  const result = await api.search('maintainer:75lb is:deprecated')
  a.ok(result.every(r => r.flags.deprecated))
  a.ok(result.length > 5)
}, { timeout: 20000 })

tom.test('search: maxResults met', async function () {
  const result = await api.search('work', { maxResults: 500 })
  a.equal(result.length, 500)
}, { timeout: 20000 })

export default tom
