import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const includes = [
  'name',
  'version',
  'description',
  'author',
  'repository',
  'homepage',
  'license',
  'keywords',
  'type'
]

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, 'npm')

function distReplace (/** @type{string} */value) {
  if (!value.startsWith('./dist')) throw 'error'
  return value.replace('./dist', '.')
}

function exportsReplace ( /** @type{{ [k: string]: { import: string, types: string } }} */ exp) {
  const obj = {}
  for (const [key, { import: i, types }] of Object.entries(exp)) {
    obj[key] = { import: distReplace(i), types: distReplace(types) }
  }
  return obj
}

void function () {
  copyFileSync(join(root, 'README.md'), join(dist, 'README.md'))
  copyFileSync(join(root, 'LICENSE.md'), join(dist, 'LICENSE.md'))
  const origin = JSON.parse(
    readFileSync(
      join(root, 'package.json'),
      { encoding: 'utf8' }
    ))
  const obj = {}
  for (const [key, value] of Object.entries(origin)) {
    if (key === 'main' || key === 'types') {
      obj[key] = distReplace(value)
    } else if (key === 'exports') {
      obj[key] = exportsReplace(value)
    } else if (includes.includes(key)) {
      obj[key] = value
    }
  }
  writeFileSync(
    join(dist, 'package.json'),
    JSON.stringify(obj, null, 2),
    { encoding: 'utf8' }
  )
}()
