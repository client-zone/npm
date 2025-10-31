import { NpmDownloads } from '@client-zone/npm'
import { strict as a } from 'assert'

const api = new NpmDownloads({ console })
const [test, only, skip] = [new Map(), new Map(), new Map()]

test.set('getTotalPackageDownloads: last month (default)', async function () {
  const result = await api.getTotalPackageDownloads(['renamer'])
  // this.data = result
  /*
  { packages: [ { name: 'renamer', downloads: 104078 } ], total: 104078 }
  */
  a.equal(result.packages.length, 1)
  a.ok(result.total > 50_000 && result.total < 900_000)
})

test.set('getTotalPackageDownloads: last year', async function () {
  const result = await api.getTotalPackageDownloads(['renamer'], 'last-year')
  // this.data = result
  /*
  { packages: [ { name: 'renamer', downloads: 1008638 } ], total: 1008638 }
  */
  a.equal(result.packages.length, 1)
  a.ok(result.total > 900_000)
})

test.set('getTotalPackageDownloads: multiple, last month (default)', async function () {
  const result = await api.getTotalPackageDownloads(['renamer', 'handbrake-js'])
  // this.data = result
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
  const packageNames = (await import('./fixture/fb-npm-packages.js')).default
  /* Doesn't yet support timeout but should do */
  const result = await api.getTotalPackageDownloads(packageNames, 'last-month', { timeout: 40000 })
  // this.data = result
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


/* When not found, the total downloads is set to 0. This alone is not sufficient indication that the package doesn't exist as an existing package could have 0 downloads too. */
test.set('getTotalPackageDownloads: scoped package not found', async function () {
  const result = await api.getTotalPackageDownloads(['@akdfdsaf/jdshfauybsfuyabdflbasdfdksahjsdhksdf'])
  // this.data = result
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

test.set('getPackageDownloadHistory', async function () {
  const result = await api.getPackageDownloadHistory('command-line-args')
  const sum = result.reduce((total, item) => total + item.total, 0)
  // this.data = result
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
  a.ok(sum > 400_000_000)
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
