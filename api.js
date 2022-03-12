import publicIp from 'public-ip'
import fetch from 'node-fetch'

const required = ['token', 'record']
const requiredForList = ['token']
const baseUrl = 'https://vercel.com/api'

async function getDomains(options) {
  const allDomains = []

  let next = 0
  while (next !== null) {
    const url = next ? `${baseUrl}/v5/domains?until=${next}` : `${baseUrl}/v5/domains`
    const response = await fetch(url, {
      headers: {authorization: `Bearer ${options.token}`},
    })

    const {domains = [], pagination = {next: null}} = await response.json()
    next = pagination.next
    allDomains.push(...domains)
  }

  const seen = new Set()
  return allDomains.filter((domain) => !seen.has(domain.id) && seen.add(domain.id))
}

async function getRecord(options) {
  const url = `${baseUrl}/v4/domains/records/${options.record}`
  const response = await fetch(url, {
    headers: {authorization: `Bearer ${options.token}`},
  })

  const body = await response.json()
  if (body.error && body.error.message) {
    throw new Error(body.error.message)
  }

  return body
}

async function updateRecord(options, newRecord) {
  const url = `${baseUrl}/v4/domains/records/${options.record}`
  const response = await fetch(url, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      authorization: `Bearer ${options.token}`,
    },
    body: JSON.stringify(newRecord),
    method: 'PATCH',
  })

  const body = await response.json()
  if (body.error && body.error.message) {
    throw new Error(body.error.message)
  }

  return body
}

export async function update(options) {
  required.forEach((opt) => {
    if (!options[opt]) {
      throw new Error(`Option "${opt}" must be specified`)
    }
  })

  const {value, currentIp, ttl: newTTL} = options
  if (!value && !currentIp && !newTTL) {
    throw new Error('Must set one of `value`, `current-ip`, `ttl`')
  }

  if (value && currentIp) {
    throw new Error('Cannot use both `current-ip` AND `value`')
  }

  const [currentRecord, ip] = await Promise.all(
    currentIp ? [getRecord(options), publicIp.v4()] : [getRecord(options)]
  )

  const newValue = currentIp ? ip : value.trim()
  const {name, type, ttl: currentTTL, value: currentValue} = currentRecord
  const newRecord = {name, type, ttl: newTTL, value: newValue}

  const valueChanged = newValue && newValue !== currentValue
  const ttlChanged = newTTL && newTTL !== currentTTL

  if (!valueChanged && !ttlChanged) {
    // Record is still valid, falling back
    return currentRecord
  }

  // Record is outdated, update
  await updateRecord(options, newRecord)
  return newRecord
}

export async function list(options) {
  requiredForList.forEach((opt) => {
    if (!options[opt]) {
      throw new Error(`Option "${opt}" must be specified`)
    }
  })

  const domains = await (options.domain ? [{name: options.domain}] : getDomains(options))

  for (const domain of domains) {
    const allRecords = []

    let next = 0
    while (next !== null) {
      const url = next
        ? `${baseUrl}/v4/domains/${domain.name}/records?until=${next}`
        : `${baseUrl}/v4/domains/${domain.name}/records`

      const response = await fetch(url, {
        headers: {authorization: `Bearer ${options.token}`},
      })

      const body = await response.json()
      const {records = [], pagination = {next: null}, error} = body

      if (error && error.message) {
        throw new Error(error.message)
      }

      next = pagination.next
      allRecords.push(...records)
    }

    const seen = new Set()
    domain.records = allRecords.filter(
      (record) => !seen.has(record.id) && seen.add(record.id)
    )
  }

  return domains
}
