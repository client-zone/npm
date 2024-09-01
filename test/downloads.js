import NpmDownloads from '@client-zone/npm/downloads'
import NpmRegistry from '@client-zone/npm/registry'
import { strict as a } from 'assert'

const api = new NpmDownloads()
const npmRegistry = new NpmRegistry()
const [test, only, skip] = [new Map(), new Map(), new Map()]

test.set('getTotalDownloadsQueue', async function () {
  const queue = api.getTotalDownloadsQueue(['renamer'])
  const result = await queue.process()
  a.equal(result.packages.length, 1)
  a.ok(result.total > 100)
})

test.set('getTotalDownloadsQueue: multiple', async function () {
  const queue = api.getTotalDownloadsQueue(['renamer', 'handbrake-js'])
  const result = await queue.process()
  a.equal(result.packages.length, 2)
  a.ok(result.total > 100)
})

skip.set('getTotalDownloadsQueue: multiple > 256', async function () {
  const packageList = await npmRegistry.getPackagesByMaintainer('fb')
  const packageNames = packageList.map(p => p.name)
  const queue = api.getTotalDownloadsQueue(packageNames)
  const result = await queue.process()
  a.ok(result.packages.length > 256)
}, { timeout: 40000 })

test.set('getTotalDownloadsQueue: scoped package not found', async function () {
  const queue = api.getTotalDownloadsQueue(['@akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf'])
  const result = await queue.process()
  a.equal(result.packages.length, 1)
  a.equal(result.total, 0)
})

test.set('getPackageDownloadHistory', async function () {
  const downloads = await api.getPackageDownloadHistory('command-line-args')
  a.ok(downloads.total > 1000000)
  a.ok(downloads.items.length > 1500)
})

test.set('getPackageDownloadHistory: handle package not found', async function () {
  const downloads = await api.getPackageDownloadHistory('aaasssdddfff')
  a.equal(downloads.total, 0)
})

test.set('getPackageDownloadHistory since', async function () {
  const downloads = await api.getPackageDownloadHistory('command-line-args', { since: '2019-10-25' })
  a.ok(downloads.total > 1000)
  a.ok(downloads.items.length > 2)
})

test.set('getPackageDownloadsRange', async function () {
  const result = await api.getPackageDownloadsRange(['renamer'])
  a.equal(result.packages.length, 1)
  a.ok(result.total > 100)
})

test.set('getPackageDownloadsRange with period', async function () {
  const result = await api.getPackageDownloadsRange(['renamer'], 'last-week')
  a.equal(result.packages.length, 1)
  a.equal(result.packages[0].downloads.length, 7)
  a.ok(result.total > 100)
})

test.set('getPackageDownloadsRange multiple', async function () {
  const result = await api.getPackageDownloadsRange(['renamer', 'handbrake-js'])
  a.equal(result.packages.length, 2)
  a.equal(result.packages[0].downloads.length, 30)
  a.equal(result.packages[1].downloads.length, 30)
  a.ok(result.total > 10000)
})

test.set('getPackageDownloadsRange scoped', async function () {
  const result = await api.getPackageDownloadsRange(['@types/node'])
  a.equal(result.packages.length, 1)
  a.ok(result.total > 1000000)
})

test.set('getPackageDownloadsRange mixed multiple', async function () {
  const result = await api.getPackageDownloadsRange(['@types/node', '@types/lodash', 'npm'])
  a.equal(result.packages.length, 3)
  a.ok(result.total > 50000000)
})

test.set('getUserDownloadHistory', async function () {
  const job = api.getUserDownloadHistory('75lb', { limit: 2 })
  const result = await job.process()
  a.ok(result.packageDownloads.length)
  a.ok(result.items.length)
  a.ok(result.total > 200)
}, { timeout: 20000 })

export { test, only, skip }
