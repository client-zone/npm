'use strict';

var arrayify = require('array-back');
var ApiClientBase = require('@client-zone/base');

class Queue {
  commands = []
  stats = {
    total: 0,
    complete: 0,
    active: 0
  }

  constructor (options = {}) {
    this.maxConcurrency = options.maxConcurrency || 1;
  }

  add (command, ...args) {
    this.commands.push({ command, args });
    this.stats.total++;
  }

  /**
   * Iterate over `commands` invoking no more than `maxConcurrency` at once. Yield results on receipt.
   */
  /* TODO: yield { command, event: 'start' } or similar, rather than only yielding on completion or emitting a "start" event. Is this async yielding of start/end events possible like it is with events? */
  /* TODO: Real-life updating of slotsAvailable if new commands are added while processing is in progress */
  async * [Symbol.asyncIterator] () {
    while (this.commands.length) {
      const slotsAvailable = Math.min(this.maxConcurrency - this.stats.active, this.commands.length);
      if (slotsAvailable > 0) {
        const toRun = [];
        for (let i = 0; i < slotsAvailable; i++) {
          let { command, args } = this.commands.shift();
          if (!Array.isArray(args)) {
            args = [args];
          }
          let executable;
          if (typeof command === 'function') {
            executable = command;
          } else if (typeof command === 'object' && typeof command.execute === 'function') {
            executable = command.execute.bind(command);
          } else {
            throw new Error('Command structure not recognised')
          }
          /* Execute the command */
          this.stats.active++;
          const commandPromise = executable(...args).then(result => {
            this.stats.active -= 1;
            this.stats.complete += 1;
            return result
          });
          toRun.push(commandPromise);
        }
        const completedCommands = await Promise.all(toRun);
        for (const command of completedCommands) {
          yield command;
        }
      }
    }
  }

  /**
  Returns an array containing the results of each node in the queue.
  */
  async process () {
    const output = [];
    for await (const result of this) {
      output.push(result);
    }
    return output
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
  async getTotalPackageDownloads (packageNames, point = 'last-month') {
    packageNames = arrayify(packageNames);
    const url = `https://api.npmjs.org/downloads/point/${point}`;

    const result = {
      packages: [],
      total: 0
    };

    const queue = new Queue();

    /* non-scoped names */
    const nonScopedNames = packageNames.filter(name => !/@/.test(name));
    if (nonScopedNames.length === 1) {
      queue.add(async () => {
        const data = await this.fetchJson(`${url}/${nonScopedNames[0]}`);
        result.packages.push({ name: nonScopedNames[0], downloads: data.downloads });
      });
    } else {
      while (nonScopedNames.length) {
        const names = nonScopedNames.splice(0, 128);
        queue.add(async () => {
          /* bulk query */
          const data = await this.fetchJson(`${url}/${names.join(',')}`);
          for (const prop of Object.keys(data)) {
            result.packages.push({
              name: prop,
              downloads: data[prop] ? data[prop].downloads : 0
            });
          }
        });
      }
    }

    /* scoped names, bulk queries not supported */
    const scopedNames = packageNames.filter(name => /@/.test(name));
    for (const packageName of scopedNames) {
      queue.add(async () => {
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
      });
    }

    await queue.process();

    const statsQueue = new Queue();
    statsQueue.add(async function () {
      result.total = result.packages
        .map(p => p.downloads)
        .reduce((total, curr) => (total += curr), 0);
      return result
    });

    await statsQueue.process();
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
        '2024-07-01:2024-12-31',
        '2025-01-01:2025-06-30',
        '2025-07-01:2025-12-31',
        // '2026-01-01:2026-06-30',
        // '2026-07-01:2026-12-31',
        // '2027-01-01:2027-06-30',
        // '2027-07-01:2027-12-31',
      ];
      const queue = new Queue({ maxConcurrency: 5 });
      for (const range of ranges) {
        const url = `https://api.npmjs.org/downloads/range/${range}/${packageName}`;
        queue.add(async () => this.fetchJson(url));
      }
      const processed = await queue.process();
      results.push(...processed);
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

class NpmScrape extends ApiClientBase {
  async getDependents (packageName) {
    let inProgress = true;
    let offset = 0;
    const output = [];
    while (inProgress) {
      let html;
      try {
        html = await this.fetchText(`https://www.npmjs.com/browse/depended/${packageName}?offset=${offset}`);
      } catch (err) {
        if (err?.response?.status === 400) {
          html = err.response.body;
          /*
          keep going - update ApiClientBase to NOT throw on 4xx. But then .fetchText would need to return `response` instead of text so maybe just call this.fetch directly if you want to inspect the response.
          */
        } else {
          throw err
        }
      }
      const matches = html.match(/window\.__context__ = (\{.*\})/m);
      if (matches.length) {
        const json = JSON.parse(matches[1]);
        output.push(...json.context.packages);
        // console.log(json.context)
        if (json.context.hasNext === false) {
          inProgress = false;
        }
        offset += json.context.paginationSize;
      } else {
        throw new Error('JSON data not found in page')
      }
    }
    return output
  }
}

exports.NpmDownloads = NpmDownloads;
exports.NpmRegistry = NpmRegistry;
exports.NpmScrape = NpmScrape;
