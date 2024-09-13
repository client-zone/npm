'use strict';

var arrayify = require('array-back');
var ApiClientBase = require('@client-zone/base');
var work = require('work');

/* ‡
__Registry (extends ApiClientBase)__

`new RegistryAPI()`

See the [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md).
*/

class NpmRegistry extends ApiClientBase {
  /* ‡
  not CORS-friendly. Docs [here](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage).
  */
  async getPackage (packageName, options = {}) {
    return this.fetchJson(`https://registry.npmjs.org/${packageName}${options.latest ? '/latest' : ''}`, {
      mode: 'cors'
    })
  }

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   */
  async search (options = {}) {
    const url = new URL('https://registry.npmjs.org/-/v1/search');
    for (const key of Object.keys(options)) {
      url.searchParams.set(key, options[key]);
    }
    console.log(url.href);
    const data = await this.fetchJson(url);
    let finished = !(data.total > data.objects.length);
    while (!finished) {
      url.searchParams.set('from', data.objects.length);
      const moreData = await this.fetchJson(url);
      data.objects.push(...moreData.objects);
      finished = !(data.total > data.objects.length);
    }
    return data.objects.map(o => o.package)
  }

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   */
  async getPackagesByMaintainer (user) {
    return this.search({ text: `maintainer:${user}`, size: 250 })
  }
}

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
  getTotalPackageDownloads (packageNames, point = 'last-month') {
    packageNames = arrayify(packageNames);
    const url = `https://api.npmjs.org/downloads/point/${point}`;

    const result = {
      packages: [],
      total: 0
    };

    const queue = new work.Queue({
      name: `Collect package downloads: ${point}`
    });

    /* non-scoped names */
    const nonScopedNames = packageNames.filter(name => !/@/.test(name));
    if (nonScopedNames.length === 1) {
      queue.add(new work.Job({
        name: 'Get single package non-scoped downloads: ' + nonScopedNames[0],
        fn: async () => {
          const data = await this.fetchJson(`${url}/${nonScopedNames[0]}`);
          result.packages.push({ name: nonScopedNames[0], downloads: data.downloads });
        }
      }));
    } else {
      while (nonScopedNames.length) {
        const names = nonScopedNames.splice(0, 128);
        queue.add(new work.Job({
          name: 'Get batch of scoped downloads: ' + names.length,
          fn: async () => {
            /* bulk query */
            const data = await this.fetchJson(`${url}/${names.join(',')}`);
            for (const prop of Object.keys(data)) {
              result.packages.push({
                name: prop,
                downloads: data[prop] ? data[prop].downloads : 0
              });
            }
          }
        }));
      }
    }

    /* scoped names, bulk queries not supported */
    const scopedNames = packageNames.filter(name => /@/.test(name));
    for (const packageName of scopedNames) {
      queue.add(new work.Job({
        name: 'Get scoped package downloads: ' + packageName,
        fn: async () => {
          try {
            const json = await this.fetchJson(`${url}/${packageName}`);
            result.packages.push({ name: packageName, downloads: json.downloads });
          } catch (err) {
            if (err.response.status === 404) {
              result.packages.push({ name: packageName, downloads: 0 });
            } else {
              throw err
            }
          }
        }
      }));
    }

    queue.onSuccess = new work.Job({
      name: 'Compute totals',
      fn: function () {
        result.total = result.packages
          .map(p => p.downloads)
          .reduce((total, curr) => (total += curr), 0);
        return result
      }
    });
    return queue
  }

  getUserDownloadHistory (user, options) {
    options = Object.assign({
      maxConcurrency: 3,
      limit: Infinity,
      groupByMonth: true,
      includeIndividualPackageDownloads: false
    }, options);
    const dateTotals = new Map();
    const result = {
      // packageNames: [],
      total: 0,
      items: [],
      packageDownloads: []
    };
    const api = this;
    const npmApi = new NpmRegistry(this.options);
    const job = new work.Job({
      name: 'getUserDownloadHistory',
      fn: async function () {
        this.scope.packages = await npmApi.getPackagesByMaintainer(user);
      },
      onSuccess: new work.Loop({
        name: 'Get download stats for each package',
        maxConcurrency: 3,
        for: function () {
          return { var: 'pkg', of: this.scope.packages.slice(0, options.limit) }
        },
        Node: class LoopJob extends work.Job {
          async fn () {
            this.name = this.scope.pkg.name;
            const pkg = this.scope.pkg;
            const downloads = await api.getPackageDownloadHistory(pkg.name, options);
            for (const item of downloads.items) {
              const total = dateTotals.has(item.date) ? dateTotals.get(item.date) : 0;
              dateTotals.set(item.date, total + item.total);
            }

            result.packageDownloads.push(downloads);
            // result.packageNames.push(downloads.package)
            result.total += downloads.total;
            result.items = Array.from(dateTotals).map(r => ({ date: r[0], total: r[1] }));
          }
        },
        onSuccess: new work.Job({
          name: 'Return result',
          fn: () => result
        })
      })
    });

    return job
  }

  /**
   * Returns all downloads per day for a package.
   * @param {string|Date} options.from
   * @param {string} options.to
   * @param {string} options.period
   * @see https://github.com/npm/registry/blob/main/docs/download-counts.md
   */
  async getPackageDownloadHistory (packageName, options = {}) {
    const results = [];
    if (options.from) {
      typeof options.from === 'string' ? options.from : new Intl.DateTimeFormat('en-ca').format(options.from);
      const defaultTo = new Intl.DateTimeFormat('en-ca').format(new Date()); // e.g. 2024-09-13
      const url = `https://api.npmjs.org/downloads/range/${options.from}:${options.to || defaultTo}/${packageName}`;
      results.push(await this.fetchJson(url));
    } else if (options.period) {
      const url = `https://api.npmjs.org/downloads/range/${options.period}/${packageName}`;
      results.push(await this.fetchJson(url));
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
        '2024-07-01:2024-12-31'
      ];
      for (const range of ranges) {
        const url = `https://api.npmjs.org/downloads/range/${range}/${packageName}`;
        results.push(await this.fetchJson(url));
      }
    }
    const output = [];
    for (const json of results) {
      output.push(...json.downloads);
    }

    return output.map(i => ({ date: i.day, total: i.downloads }))
  }
}

/**
__Registry (extends ApiClientBase)__

`new RegistryAPI()`

See the [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md).
*/

class NpmsApi extends ApiClientBase {
  async getPackage (packageName) {
    return this.fetchJson(`https://api.npms.io/v2/package/${packageName}`, {
      mode: 'cors'
    })
  }

  /**
   * Uses npms.io.. Same as the npm registry data, adding score and flags (e.g. deprecated, unstable).
   * @see https://api-docs.npms.io/
   * @param [options.from] {string} - The offset in which to start searching from (max of 5000). Default value: 0.
   */
  async search (query, options = {}) {
    options = Object.assign({
      size: 250,
      from: 0,
      maxResults: 2000
    }, options);
    const results = [];
    let finished = false;

    while (!finished) {
      const url = new URL('https://api.npms.io/v2/search');
      url.searchParams.set('q', query);
      url.searchParams.set('from', results.length + options.from);
      url.searchParams.set('size', options.size);
      const data = await this.fetchJson(url);
      results.push(...data.results);
      finished = results.length === data.total || results.length >= options.maxResults;
    }
    return results
  }
}

exports.NpmDownloads = NpmDownloads;
exports.NpmRegistry = NpmRegistry;
exports.NpmsApi = NpmsApi;
