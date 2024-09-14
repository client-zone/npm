import NpmDownloads from '@client-zone/npm/downloads'
import NpmRegistry from '@client-zone/npm/registry'
import { strict as a } from 'assert'

const api = new NpmDownloads({
  logger: { log: console.warn }
})
const npmRegistry = new NpmRegistry()
const [test, only, skip] = [new Map(), new Map(), new Map()]

test.set('getTotalPackageDownloads: last month (default)', async function () {
  const queue = api.getTotalPackageDownloads(['renamer'])
  const result = await queue.process()
  /*
  { packages: [ { name: 'renamer', downloads: 71549 } ], total: 71549 }
  */
  a.equal(result.packages.length, 1)
  a.ok(result.total > 50000)
})

test.set('getTotalPackageDownloads: multiple, last month (default)', async function () {
  const queue = api.getTotalPackageDownloads(['renamer', 'handbrake-js'])
  const result = await queue.process()
  /*
  {
    packages: [
      { name: 'renamer', downloads: 71549 },
      { name: 'handbrake-js', downloads: 3023 }
    ],
    total: 74572
  }
  */
  a.equal(result.packages.length, 2)
  a.ok(result.total > 50000)
})

test.set('getTotalPackageDownloads: > 256 packages', async function () {
  const packageList = await npmRegistry.getPackagesByMaintainer('fb')
  const packageNames = packageList.map(p => p.name)
  /* Doesn't support timeout but should do */
  const queue = api.getTotalPackageDownloads(packageNames, 'last-month', { timeout: 40000 })
  const result = await queue.process()
  /*
  {
     packages: [
       { name: 'react', downloads: 105947970 },
       { name: 'react-dom', downloads: 97665933 },
       { name: 'react-is', downloads: 428621033 },
       { name: 'scheduler', downloads: 116742157 },
       etc...
     ],
     total: 2042518656
   }
  */
  a.ok(result.packages.length > 256)
  a.ok(result.total > 50000)
})

test.set('getTotalPackageDownloads: scoped package not found', async function () {
  const queue = api.getTotalPackageDownloads(['@akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf'])
  const result = await queue.process()
  /*
  {
    packages: [
      {
        name: '@akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf',
        downloads: 0
      }
    ],
    total: 0
  }
  */
  a.equal(result.packages.length, 1)
  a.equal(result.total, 0)
})

only.set('getPackageDownloadHistory', async function () {
  const result = await api.getPackageDownloadHistory('command-line-args')
  /*
  [
    { date: '2015-03-15', total: 116 },
    { date: '2015-03-16', total: 294 },
    { date: '2015-03-17', total: 302 },
    { date: '2015-03-18', total: 336 },
    etc
  ]
  */
  a.ok(result.length > 1500)
})

test.set('getPackageDownloadHistory: handle package not found', async function () {
  try {
    await api.getPackageDownloadHistory('aaasssdddfff')
  } catch (err) {
    /* should return a bespoke client-zone/npm err with the base error as the cause */
    a.equal(err.response.status, 404)
  }
})

test.set('getPackageDownloadHistory: from, to', async function () {
  const result = await api.getPackageDownloadHistory('command-line-args', { from: '2019-10-25', to: '2019-10-30' })
  /*
  [
    { date: '2019-10-25', total: 65433 },
    { date: '2019-10-26', total: 17572 },
    { date: '2019-10-27', total: 13221 },
    { date: '2019-10-28', total: 61587 },
    { date: '2019-10-29', total: 68324 },
    { date: '2019-10-30', total: 67366 }
  ]
  */
  a.equal(result.length, 6)
})

skip.set('TODO: support AbortController signals in get methods')

export { test, only, skip }
