import TestRunner from 'test-runner'
import NpmApiClient from '../npm-api.mjs'
import assert from 'assert'
import fetch from 'node-fetch'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })
const api = new NpmApiClient({ fetch })

tom.test('getPackage', async function () {
  const result = await api.getPackage(['renamer'])
  a.equal(result.name, 'renamer')
})

tom.test('getPackageNpms', async function () {
  const result = await api.getPackageNpms(['renamer'])
  a.equal(result.collected.metadata.name, 'renamer')
})

tom.test('npm dependents', async function () {
  const dependents = await api.npmDependents('command-line-args')
  a.ok(dependents > 10)
})

tom.test('npm dependents 2', async function () {
  const dependents = await api.npmDependents('lws-request-monitor')
  a.ok(dependents > 0)
})

export default tom
