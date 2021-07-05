import TestRunner from 'test-runner'
import NpmDownloads from '@75lb/npm-api/downloads'
import NpmRegistry from '@75lb/npm-api/registry'
import fetch from 'node-fetch'
import assert from 'assert'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })
const api = new NpmDownloads({ fetch })
const npmRegistry = new NpmRegistry({ fetch })

tom.test('getTotalDownloadsQueue', async function () {
  const queue = api.getTotalDownloadsQueue(['renamer'])
  const result = await queue.process()
  a.equal(result.packages.length, 1)
  a.ok(result.total > 100)
})

tom.test('getTotalDownloadsQueue: multiple', async function () {
  const queue = api.getTotalDownloadsQueue(['renamer', 'handbrake-js'])
  const result = await queue.process()
  a.equal(result.packages.length, 2)
  a.ok(result.total > 100)
})

tom.skip('getTotalDownloadsQueue: multiple > 256', async function () {
  const packageList = await npmRegistry.getPackagesByMaintainer('fb')
  const packageNames = packageList.map(p => p.name)
  const queue = api.getTotalDownloadsQueue(packageNames)
  const result = await queue.process()
  a.ok(result.packages.length > 256)
}, { timeout: 40000 })

tom.test('getTotalDownloadsQueue: scoped package not found', async function () {
  const queue = api.getTotalDownloadsQueue(['@akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf'])
  const result = await queue.process()
  a.equal(result.packages.length, 1)
  a.equal(result.total, 0)
})

tom.test('getPackageDownloadHistory', async function () {
  const downloads = await api.getPackageDownloadHistory('command-line-args')
  a.ok(downloads.total > 1000000)
  a.ok(downloads.items.length > 1500)
})

tom.test('getPackageDownloadHistory: handle package not found', async function () {
  const downloads = await api.getPackageDownloadHistory('aaasssdddfff')
  a.equal(downloads.total, 0)
})

tom.test('getPackageDownloadHistory since', async function () {
  const downloads = await api.getPackageDownloadHistory('command-line-args', { since: '2019-10-25' })
  a.ok(downloads.total > 1000)
  a.ok(downloads.items.length > 2)
})

tom.test('getPackageDownloadsRange', async function () {
  const result = await api.getPackageDownloadsRange(['renamer'])
  a.equal(result.packages.length, 1)
  a.ok(result.total > 100)
})

tom.test('getPackageDownloadsRange with period', async function () {
  const result = await api.getPackageDownloadsRange(['renamer'], 'last-week')
  a.equal(result.packages.length, 1)
  a.equal(result.packages[0].downloads.length, 7)
  a.ok(result.total > 100)
})

tom.test('getPackageDownloadsRange multiple', async function () {
  const result = await api.getPackageDownloadsRange(['renamer', 'handbrake-js'])
  a.equal(result.packages.length, 2)
  a.equal(result.packages[0].downloads.length, 30)
  a.equal(result.packages[1].downloads.length, 30)
  a.ok(result.total > 10000)
})

tom.test('getPackageDownloadsRange scoped', async function () {
  const result = await api.getPackageDownloadsRange(['@types/node'])
  a.equal(result.packages.length, 1)
  a.ok(result.total > 1000000)
})

tom.test('getPackageDownloadsRange mixed multiple', async function () {
  const result = await api.getPackageDownloadsRange(['@types/node', '@types/lodash', 'npm'])
  a.equal(result.packages.length, 3)
  a.ok(result.total > 50000000)
})

tom.test('getUserTotalDownloadsQueue', async function () {
  const job = api.getUserTotalDownloadsQueue('75lb', { limit: 10 })
  const result = await job.process()
  // this.data = result
  a.ok(result.packageNames.length)
  a.ok(result.items.length)
  a.ok(result.total > 200)
}, { timeout: 20000 })

export default tom
