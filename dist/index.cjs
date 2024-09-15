'use strict';

var arrayify = require('array-back');
var ApiClientBase = require('@client-zone/base');
var work = require('work');

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
      const dateFormat = new Intl.DateTimeFormat('en-ca'); // e.g. 2024-09-13
      const from = typeof options.from === 'string' ? options.from : dateFormat.format(options.from);
      const to = typeof options.to === 'string' ? options.to : dateFormat.format(new Date());
      const url = `https://api.npmjs.org/downloads/range/${from}:${to}/${packageName}`;
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
      const queue = new work.Queue({ maxConcurrency: 5 });
      for (const range of ranges) {
        const url = `https://api.npmjs.org/downloads/range/${range}/${packageName}`;
        queue.add(new work.Job({
          fn: async () => this.fetchJson(url)
        }));
      }
      results.push(...(await queue.process()));
    }
    const output = [];
    for (const json of results) {
      output.push(...json.downloads);
    }

    return output.map(i => ({ date: i.day, total: i.downloads }))
  }
}

/*
See: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
*/

class NpmRegistry extends ApiClientBase {
  /**
   * Not CORS-friendly.
   * Docs: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage
   * Response data: https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md
   *
   * [options.latest]{boolean} - Include only the latest version, not all versions
   * [options.abbreviated]{boolean} - Include only the install data. Doesn't appear to work with `latest`.
   */
  async getPackage (packageName, options = {}) {
    const fetchOptions = {
      mode: 'cors',
      headers: {}
    };
    if (options.abbreviated) {
      fetchOptions.headers.accept = 'application/vnd.npm.install-v1+json';
    }
    return this.fetchJson(`https://registry.npmjs.org/${packageName}${options.latest ? '/latest' : ''}`, fetchOptions)
  }

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   * [options.size]{number} - Max 250
   * [options.text]{string} - Full-text search string
   * @example
   * registryApi.search({ text: `maintainer:75lb` })
   * registryApi.search({ text: `author:75lb`, size: 10 })
   */
  async search (options = {}) {
    options.size ||= 250;
    const url = new URL('https://registry.npmjs.org/-/v1/search');
    for (const key of Object.keys(options)) {
      url.searchParams.set(key, options[key]);
    }
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
}

/*
npms.io data seems old. Command-line-args was updated 2 months ago, this is wrong: "updated 3 years ago by 75lb"
@see https://npms.io/search?q=maintainer%3A75lb
*/

class NpmsApi extends ApiClientBase {
  async getPackage (packageName) {
    return this.fetchJson(`https://api.npms.io/v2/package/${packageName}`, {
      mode: 'cors'
    })
  }

  /**
   * Uses npms.io.. Same as the npm registry data, adding score and flags (e.g. deprecated, unstable).
   * This method returns more packages than registry.search.
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
