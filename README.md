# vercel-dns

List and update DNS records through Vercels API.  
Want `home.yourdomain.com` to point to your home IP?
This little CLI (and node module) lets you do that easily.

## Installation

```bash
# Install the `vercel-dns` binary globally, for CLI-usage
npm install -g vercel-dns

# Or, install the module locally to use the API
npm install --save vercel-dns
```

## CLI usage

```
$ vercel-dns --help

  List and update DNS records through Vercels API

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
```

## Node usage

Requires Node 14 or above.

```js
import {update, list} from 'vercel-dns'

update({
  value: '193.212.1.10', // IP to update record with
  token: 'yourVercelToken', // Vercel API key
  record: 'rec_vercelRecordId', // Vercel zone ID
}).then((newRecord) => {
  console.log('New record:', newRecord)
})
```

## License

MIT-licensed. See LICENSE.
