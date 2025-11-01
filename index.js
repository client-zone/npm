/**
 * @module @client-zone/npm
 */

import arrayify from 'array-back'
import ApiClientBase from '@client-zone/base'
import { Command, Queue } from 'work'

/**
 * An isomorphic API client to access npm download and registry data.
 *
 * @typicalname npm
 * @alias module:@client-zone/npm
 */
class NpmApi extends ApiClientBase {

  /**
   * @param {string[]} - One or more package names
   * @param [point] {string} - One of the point values described in the [docs](https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values).
   * @see https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values
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
   * Returns daily download totals for a package over a given time period.
   *
   * @param {string} - npm package name
   * @param [options] {object}
   * @param [options.period] {string} - One of the point values specified [here](https://github.com/npm/registry/blob/main/docs/download-counts.md#parameters) (e.g. `last-day`, `last-week` etc). Either specify `options.period` or `options.from` (and optionally `options.to`) but not both.
   * @param [options.from] {string|Date} - Time period start date.
   * @param [options.to] {string|Date} - Time period end date. If `from` is specified but `to` is not, `to` defaults to today's date.
   * @see https://github.com/npm/registry/blob/main/docs/download-counts.md
   */
  async getPackageDownloadHistory (packageName, options = {}) {
    const results = []
    if (options.from) {
      const dateFormat = new Intl.DateTimeFormat('en-ca') // e.g. 2024-09-13
      options.to ||= new Date()
      if (options.from instanceof Date) options.from = dateFormat.format(options.from)
      if (options.to instanceof Date) options.to = dateFormat.format(options.to)
      const url = `https://api.npmjs.org/downloads/range/${options.from}:${options.to}/${packageName}`
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
      results.push(...processed)
    }
    const output = []
    for (const json of results) {
      output.push(...json.downloads)
    }

    return output.map(i => ({ date: i.day, total: i.downloads }))
  }

    /**
   * [Docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage). [Response data](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md).
   *
   * @param {string} - package name
   * @param [options] {object}
   * @param [options.latest] {boolean} - Include only the latest version, not all versions
   * @param [options.abbreviated] {boolean} - Include only the install data. Doesn't appear to work with `latest`.
   */
  async getPackage (packageName, options = {}) {
    const fetchOptions = {
      mode: 'cors',
      headers: {}
    }
    if (options.abbreviated) {
      fetchOptions.headers.accept = 'application/vnd.npm.install-v1+json'
    }
    return this.fetchJson(`https://registry.npmjs.org/${packageName}${options.latest ? '/latest' : ''}`, fetchOptions)
  }

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   *
   * @param [options] {object}
   * @param [options.size] {number} - Max 250
   * @param [options.text] {string} - Full-text search string
   * @example
   * npm.search({ text: `maintainer:75lb` })
   * npm.search({ text: `author:75lb`, size: 10 })
   */
  async search (options = {}) {
    options.size ||= 250
    const url = new URL('https://registry.npmjs.org/-/v1/search')
    for (const key of Object.keys(options)) {
      url.searchParams.set(key, options[key])
    }
    const data = await this.fetchJson(url)
    let finished = !(data.total > data.objects.length)
    while (!finished) {
      url.searchParams.set('from', data.objects.length)
      const moreData = await this.fetchJson(url)
      data.objects.push(...moreData.objects)
      finished = !(data.total > data.objects.length)
    }
    return data.objects.map(o => o.package)
  }
}

export default NpmApi
