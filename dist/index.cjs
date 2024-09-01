'use strict';

var arrayify = require('array-back');
var ApiClientBase = require('@client-zone/base');
var work = require('work');

/*‡
__Registry (extends ApiClientBase)__

`new RegistryAPI()`

See the [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md).
*/

class NpmRegistry extends ApiClientBase {
  /*‡
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
    const url = new URL(`https://registry.npmjs.org/-/v1/search`);
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
  getTotalDownloadsQueue (packageNames, point = 'last-month') {
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
      maxConcurrency: 10,
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
        maxConcurrency: 5,
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
   * @param {string} options.since
   * @param {string} options.period
   * @param {string} options.totalOnly
   * @param {string} options.groupByMonth
   */
  async getPackageDownloadHistory (packageName, options = {}) {
    const promises = [];
    if (options.since) {
      const url = `https://api.npmjs.org/downloads/range/${options.since}:2099-12-31/${packageName}`;
      promises.push(this.fetchJson(url));
    } else if (options.period) {
      const url = `https://api.npmjs.org/downloads/range/${options.period}/${packageName}`;
      promises.push(this.fetchJson(url));
    } else {
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
        promises.push(this.fetchJson(url));
      }
    }
    let output;
    try {
      const results = await Promise.all(promises);
      output = {
        start: results[0].start,
        end: results[0].end,
        package: results[0].package,
        items: [],
        total: 0
      };
      for (const json of results) {
        output.end = json.end;
        output.items.push(...json.downloads);
        output.total += json.downloads.reduce((total, curr) => {
          return (curr.downloads || 0) + total
        }, 0);
      }
    } catch (err) {
      if (err.response.status === 404) {
        output = {
          start: '',
          end: '',
          package: packageName,
          items: [],
          total: 0
        };
      } else {
        throw err
      }
    }

    if (options.totalOnly) {
      delete output.items;
    } else {
      output.items = output.items.map(i => ({ date: i.day, total: i.downloads }));

      if (options.groupByMonth) {
        /* group downloads by month */
        const months = new Map();
        for (const d of output.items) {
          const month = d.date.substr(0, 7);
          const monthTotal = (months.has(month) ? months.get(month) : 0) + d.total;
          months.set(month, monthTotal);
        }
        output.items = Array.from(months).map(m => ({ date: m[0], total: m[1] }));
      }
    }
    return output
  }


  /* Too similar to getPackageDownloadsHistory */
  async getPackageDownloadsRange (packageNames, period = 'last-month') {
    packageNames = arrayify(packageNames);
    const result = { packages: [] };
    const baseUrl = 'https://api.npmjs.org/downloads/range';

    /* non-scoped names */
    const nonScopedNames = packageNames.filter(name => !/@/.test(name));
    if (nonScopedNames.length === 1) {
      const json1 = await this.fetchJson(`${baseUrl}/${period}/${nonScopedNames[0]}`);
      result.packages.push({ name: nonScopedNames[0], downloads: json1.downloads });
    } else {
      const json1 = await this.fetchJson(`${baseUrl}/${period}/${nonScopedNames.slice(0, 128).join(',')}`);
      let json2 = {};
      if (nonScopedNames.length > 128) {
        /* And what if there are more than 256 packages?  */
        json2 = await this.fetchJson(`${baseUrl}/${period}/${nonScopedNames.slice(128, 256).join(',')}`);
      }


      for (const packageName of nonScopedNames) {
        const downloads = json1[packageName] || json2[packageName]
          ? (json1[packageName] || json2[packageName]).downloads
          : 0;
        result.packages.push({ name: packageName, downloads });
      }
    }

    /* scoped names - fetching multiple packages not supported */
    const scopedNames = packageNames.filter(name => /@/.test(name));
    for (const packageName of scopedNames) {
      const json = await this.fetchJson(`${baseUrl}/${period}/${packageName}`);
      result.packages.push({ name: packageName, downloads: json.downloads });
    }

    result.total = result.packages.reduce((total, curr) => {
      total += curr.downloads.reduce((total2, curr2) => (total2 += curr2.downloads), 0);
      return total
    }, 0);
    return result
  }
}

exports.NpmDownloads = NpmDownloads;
exports.NpmRegistry = NpmRegistry;
exports.NpmsApi = NpmRegistry;
