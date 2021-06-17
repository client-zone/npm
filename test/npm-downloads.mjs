import TestRunner from 'test-runner'
import NpmDownloadsClient from '../npm-downloads.mjs'
import NpmApiClient from '../npm-api.mjs'
import fetch from 'node-fetch'
import assert from 'assert'
const a = assert.strict
const Tom = TestRunner.Tom

const tom = new Tom({ maxConcurrency: 2 })
const api = new NpmDownloadsClient({ fetch })
const npmApi = new NpmApiClient({ fetch })

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

tom.test('getTotalDownloadsQueue: multiple > 256', async function () {
  const packageList = await npmApi.getPackagesByMaintainer('fb')
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

tom.test('getDailyDownloadsAll', async function () {
  const downloads = await api.getDailyDownloadsAll('command-line-args')
  a.ok(downloads.total > 1000000)
  a.ok(downloads.items.length > 1500)
})

tom.test('getDailyDownloadsAll: handle package not found', async function () {
  const downloads = await api.getDailyDownloadsAll('aaasssdddfff')
  a.equal(downloads.total, 0)
})

tom.test('getDailyDownloadsAll since', async function () {
  const downloads = await api.getDailyDownloadsAll('command-line-args', { since: '2019-10-25' })
  a.ok(downloads.total > 1000)
  a.ok(downloads.items.length > 2)
})

tom.test('getDailyDownloads', async function () {
  const result = await api.getDailyDownloads(['renamer'])
  a.equal(result.packages.length, 1)
  a.ok(result.total > 100)
})

tom.test('getDailyDownloads with period', async function () {
  const result = await api.getDailyDownloads(['renamer'], 'last-week')
  a.equal(result.packages.length, 1)
  a.equal(result.packages[0].downloads.length, 7)
  a.ok(result.total > 100)
})

tom.test('getDailyDownloads multiple', async function () {
  const result = await api.getDailyDownloads(['renamer', 'handbrake-js'])
  a.equal(result.packages.length, 2)
  a.equal(result.packages[0].downloads.length, 30)
  a.equal(result.packages[1].downloads.length, 30)
  a.ok(result.total > 10000)
})

tom.test('getDailyDownloads scoped', async function () {
  const result = await api.getDailyDownloads(['@types/node'])
  a.equal(result.packages.length, 1)
  a.ok(result.total > 1000000)
})

tom.test('getDailyDownloads mixed multiple', async function () {
  const result = await api.getDailyDownloads(['@types/node', '@types/lodash', 'npm'])
  a.equal(result.packages.length, 3)
  a.ok(result.total > 50000000)
})

tom.test('getUserTotalDownloadsQueue', async function () {
  const job = api.getUserTotalDownloadsQueue('75lb', { limit: 10 })
  const result = await job.process()
  a.ok(result.packageNames.length)
  a.ok(result.items.length)
  a.ok(result.total > 200)
}, { timeout: 20000 })

export default tom
