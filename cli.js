#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import updateNotifier from 'update-notifier'
import width from 'string-width'
import meow from 'meow'
import {list, update} from './api.js'

const pkgPath = path.join(new URL('.', import.meta.url).pathname, 'package.json')

// eslint-disable-next-line no-sync
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const trim = (item) => `${item || ''}`.trim()

updateNotifier({pkg}).notify()

const cli = meow(
  `
  Usage
    $ vercel-dns list|update --domain <domain> --record <recordId> --token <apiToken>

  Options
    --current-ip Use the current, public IPv4 address as the new value
    --value <someValue> Value to set for the record
    --ttl <ttl> TTL for the domain record
    --domain <domain> Domain name to list records for
    --record <recordId> DNS record ID to update
    --token <apiToken> API token used for authentication

  Examples
    # List DNS records your API key has access to
    $ vercel-dns list --token myApiToken

    # Update a record with a specific value
    $ vercel-dns --domain my.domain --record recordId --value 193.212.1.10 --token myApiToken

    # Update a record with your current external IP
    $ vercel-dns --domain home.my.domain --record recordId --current-ip --token myApiToken

  Environment variables (fallbacks for missing flags)
    --domain = VERCEL_DOMAIN_NAME
    --record = VERCEL_RECORD_ID
    --token = VERCEL_API_TOKEN
`,
  {
    importMeta: import.meta,
    flags: {
      currentIp: {
        type: 'boolean',
      },
      value: {
        type: 'string',
      },
      ttl: {
        type: 'number',
      },
      domain: {
        type: 'string',
      },
      record: {
        type: 'string',
      },
      token: {
        type: 'string',
      },
    },
  }
)

/* eslint-disable no-process-env */
const options = {
  domain: process.env.VERCEL_DOMAIN_NAME,
  record: process.env.VERCEL_RECORD_ID,
  apiToken: process.env.VERCEL_API_TOKEN,
  ...cli.flags,
}
/* eslint-enable no-process-env */

/* eslint-disable no-console */
function printList(domains) {
  domains.forEach((domain) => {
    console.log(`${domain.name}`)

    const records = domain.records.map((record) =>
      [''].concat(
        [
          `ID: ${record.id}`,
          record.name,
          record.ttl,
          'IN',
          record.type,
          record.value,
        ].map(trim)
      )
    )

    const columnWidths = []
    for (let i = 0; records.length && i < records[0].length; i++) {
      columnWidths[i] = records.reduce((max, curr) => Math.max(max, width(curr[i])), 1)
    }

    const printable = records
      .map((columns) => columns.map((val, i) => val.padEnd(columnWidths[i])).join('  '))
      .join('\n')

    console.log(printable)
    console.log('')
  })
}
/* eslint-enable no-console */

const [command] = cli.input
if (command === 'update') {
  update(options)
} else if (command === 'list') {
  list(options).then(printList)
} else {
  console.error('ERROR: Command must be one of `list`, `update`')
  cli.showHelp()
}
