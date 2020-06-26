/* index.js [ 25.06.2020 : 23:07:10 ] */

import { strictEqual, deepStrictEqual, throws } from 'assert'
import pna from '../index.js'

const msg = 'Ошибка теста'

describe(`test pna(options?)`, () => {

  it(`parse() // только для покрытия, этот вариант должен выдать путь к текущему файлу ./.test/index.js`, () => {
    let arg = pna({ item: true })()
    let res = arg.get()
    strictEqual(/index\.js$/i.test(res), true, msg)
  })

  it(`parse([]) // пустой массив`, () => {
    let arg = pna()([])
    strictEqual(arg.args.length, 0, msg)
    strictEqual(arg.has(), false, msg)
    strictEqual(arg.get('--foo'), false, msg)
  })

  it(`parse([no, name]) // только неименованные аргументы`, () => {
    let argv = 'no name'.split(/\s+/)
    let arg = pna()(argv)
    strictEqual(arg.args.length, 1, msg)
    strictEqual(arg.has(), true, msg)
    deepStrictEqual(arg.get(null), argv, msg)
  })

  it(`parse(foo - -C file.json --dev -C text.txt) // без установки опций`, () => {
    let argv = 'foo - -C file.json --dev -C text.txt'.split(/\s+/)
    let arg = pna()(argv)
    strictEqual(arg.args.length, 4, msg)
    strictEqual(arg.has(), true, msg)
    strictEqual(arg.has('-'), true, msg)
    strictEqual(arg.has('-C'), true, msg)
    strictEqual(arg.has('--dev'), true, msg)
    // options.ignoreCase=false
    strictEqual(arg.has('-c'), false, msg)
    deepStrictEqual(arg.get('--dev'), [], msg)
    deepStrictEqual(arg.get('-C'), ['file.json', 'text.txt'], msg)
  })

  it(`parse(-C file.json --watch text.txt --bar box --cONFig r.md file.json) // установка alias, ignoreCase и bool`, () => {
    let argv = '-C file.json --watch text.txt --bar box --cONFig r.md file.json'.split(/\s+/)
    let options = {
      alias: {
        '-C': ['--config'],
        bar: ['--bar'],
        w: ['--watch']
      },
      ignoreCase: true,
      bool: ['w']
    }
    let arg = pna(options)(argv)
    strictEqual(arg.args.length, 3, msg)
    strictEqual(arg.has(), false, msg)
    // options.ignoreCase=true
    strictEqual(arg.has('-c'), true, msg)
    strictEqual(arg.has('W'), true, msg)
    //
    strictEqual(arg.get('w'), true, msg)
    strictEqual(arg.get('--watch'), true, msg)
    //
    deepStrictEqual(arg.get('-C'), ['file.json', 'text.txt', 'r.md', 'file.json'], msg)
    deepStrictEqual(arg.get('bar'), ['box'], msg)
  })

  it(`parse(-c foo -w -c foo bar) // только уникальные аргументы`, () => {
    let argv = '-c foo -w -c foo bar'.split(/\s+/)
    let options = {
      uniq: true,
      bool: ['-w']
    }
    let arg = pna(options)(argv)
    strictEqual(arg.args.length, 2, msg)
    strictEqual(arg.has(), false, msg)
    strictEqual(arg.get('-w'), true, msg)
    deepStrictEqual(arg.get('-c'), ['foo', 'bar'], msg)
  })

  it(`parse(cover -c foo -w -c foo bar) // только один аргумент`, () => {
    let argv = 'cover -c foo -w -c foo bar'.split(/\s+/)
    let options = {
      item: true,
      bool: ['-w']
    }
    let arg = pna(options)(argv)
    strictEqual(arg.args.length, 3, msg)
    strictEqual(arg.get('-w'), true, msg)
    deepStrictEqual(arg.get('-c'), 'bar', msg)
  })

  it(`options.alias // ошибки при пересечении аргументов`, () => {
    throws(() => pna({
      alias: { '--config': ['-C'], configFile: ['--config'] }
    }), msg)
    throws(() => pna({
      alias: { '--config': ['-C'], cnf: ['-C'] }
    }), msg)
  })
})