import arrayify from 'array-back'
import ApiClientBase from '@client-zone/base'
import { Command, Queue } from 'work'

class NpmDownloads extends ApiClientBase {
  /**
  SEE: https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values
  Outputs a single total, e.g.:

  {
   downloads: 31623,
   start: "2014-01-01",
   end: "2014-01-31",
   package: "jquery"
  }

  */
  async getTotalPackageDownloads (packageNames, point = 'last-month') {
    packageNames = arrayify(packageNames)
    const url = `https://api.npmjs.org/downloads/point/${point}`

    const result = {
      packages: [],
      total: 0
    }

    const queue = new Queue()

    /* non-scoped names */
    const nonScopedNames = packageNames.filter(name => !/@/.test(name))
    if (nonScopedNames.length === 1) {
      queue.add(async () => {
        const data = await this.fetchJson(`${url}/${nonScopedNames[0]}`)
        result.packages.push({ name: nonScopedNames[0], downloads: data.downloads })
      })
    } else {
      while (nonScopedNames.length) {
        const names = nonScopedNames.splice(0, 128)
        queue.add(async () => {
          /* bulk query */
          const data = await this.fetchJson(`${url}/${names.join(',')}`)
          for (const prop of Object.keys(data)) {
            result.packages.push({
              name: prop,
              downloads: data[prop] ? data[prop].downloads : 0
            })
          }
        })
      }
    }

    /* scoped names, bulk queries not supported */
    const scopedNames = packageNames.filter(name => /@/.test(name))
    for (const packageName of scopedNames) {
      queue.add(async () => {
        try {
          const json = await this.fetchJson(`${url}/${packageName}`)
          result.packages.push({ name: packageName, downloads: json.downloads })
        } catch (err) {
          if (err.response.status === 404) {
            result.packages.push({ name: packageName, downloads: 0 })
          } else {
            throw err
          }
        }
      })
    }

    await queue.process()

    const statsQueue = new Queue()
    statsQueue.add(async function () {
      result.total = result.packages
        .map(p => p.downloads)
        .reduce((total, curr) => (total += curr), 0)
      return result
    })

    await statsQueue.process()
    return result
  }

  /**
   * Returns all downloads per day for a package.
   * @param {string|Date} options.from
   * @param {string} options.to
   * @param {string} options.period
   * @see https://github.com/npm/registry/blob/main/docs/download-counts.md
   */
  async getPackageDownloadHistory (packageName, options = {}) {
    const results = []
    if (options.from) {
      const dateFormat = new Intl.DateTimeFormat('en-ca') // e.g. 2024-09-13
      const from = typeof options.from === 'string' ? options.from : dateFormat.format(options.from)
      const to = typeof options.to === 'string' ? options.to : dateFormat.format(new Date())
      const url = `https://api.npmjs.org/downloads/range/${from}:${to}/${packageName}`
      results.push(await this.fetchJson(url))
    } else if (options.period) {
      const url = `https://api.npmjs.org/downloads/range/${options.period}/${packageName}`
      results.push(await this.fetchJson(url))
    } else {
      /* Fetch everything - should only be necessary the first time. After then, use `options.since`. */
      const ranges = [
        '2015-01-01:2016-06-30',
        '2016-07-01:2017-12-31',
        '2018-01-01:2019-06-30',
        '2019-07-01:2020-12-31',
        '2021-01-01:2022-06-30',
        '2022-07-01:2022-12-31',
        '2023-01-01:2023-06-30',
        '2023-07-01:2023-12-31',
        '2024-01-01:2024-06-30',
        '2024-07-01:2024-12-31',
        '2025-01-01:2025-06-30',
        '2025-07-01:2025-12-31',
        // '2026-01-01:2026-06-30',
        // '2026-07-01:2026-12-31',
        // '2027-01-01:2027-06-30',
        // '2027-07-01:2027-12-31',
      ]
      const queue = new Queue({ maxConcurrency: 5 })
      for (const range of ranges) {
        const url = `https://api.npmjs.org/downloads/range/${range}/${packageName}`
        queue.add(async () => this.fetchJson(url))
      }
      const processed = await queue.process()
      // console.log(processed)
      results.push(...processed)
    }
    const output = []
    for (const json of results) {
      output.push(...json.downloads)
    }

    return output.map(i => ({ date: i.day, total: i.downloads }))
  }
}

export default NpmDownloads
