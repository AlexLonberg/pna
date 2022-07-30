import { parse, split } from './index.js'

// DOC jest expect https://jestjs.io/ru/docs/expect

test('parse([]))', () => {
  const res = parse(['a', 'B'], { ignoreCase: true, lowerCase: true })
  expect(res.bool.size()).toBe(0)
  expect(res.params.size()).toBe(0)
  expect(res.list.size()).toBe(0)
  expect(res.unnamed.size()).toBe(0)
  expect(res.single.size()).toBe(2)
  expect(res.single.values()).toEqual(['a', 'b'])
})

test('parse([...], {bool, list, lowerCase}))', () => {
  const rawArgs = ['--array1', 'FOO', 'bar', '--', 'xxx', '-bool', 'value', '--array2', 'box']
  const res = parse(rawArgs, {
    bool: {
      bool: ['-bool']
    },
    list: {
      array: ['--array1', '--array2']
    },
    ignoreCase: false,
    lowerCase: true
  })
  expect(res.bool.has('bool')).toBe(true)
  expect(res.list.has('array')).toBe(true)
  expect(res.list.get('array')).toEqual(['foo', 'bar', 'box'])
  expect(res.single.values()).toEqual(['xxx', 'value'])
})

test('parse([...]))', () => {
  const rawArgs = ['-c', 'config.json', 'foo', '--port', '--dev', 'bar', '--targets', 'box', 'box', 'some', '--', 'desk', '-unnamed', 'aaa', 'bbb', 'ccc']
  const res = parse(rawArgs, {
    bool: {
      MODE_DEV: ['-D', '--DEV', '--DEVELOPMENT'],
      MODE_PROD: ['--prod', '--production']
    },
    params: {
      CONFIG_FILE: ['-C'],
      PORT: ['--port']
    },
    list: {
      targets: ['--targets', '-t']
    },
    ignoreCase: true
    // lowerCase: false
  })
  expect(res.bool.has('MODE_DEV')).toBe(true)
  expect(res.params.get('CONFIG_FILE')).toBe('config.json')
  expect(res.params.has('PORT')).toBe(false)
  expect(res.list.get('targets')).toEqual(['box', 'some'])
  expect(res.unnamed.get('-unnamed')).toEqual(['aaa', 'bbb', 'ccc'])
  expect(res.single.values()).toEqual(['foo', 'bar', 'desk'])
  const pe = res.params.entries()
  expect(pe[0]).toEqual(['CONFIG_FILE', 'config.json'])
  const ae = res.list.entries()
  expect(ae[0]?.[0]).toBe('targets')
  expect(ae[0]?.[1]).toEqual(['box', 'some'])
  expect(res.list.hasValue('targets', 'box')).toBe(true)
  expect(res.list.hasValue('targets', '???')).toBe(false)
  expect(res.list.hasValue('???', '???')).toBe(false)
  expect(res.list.hasValues('targets', ['box', 'some'])).toBe(true)
  expect(res.list.hasValues('targets', ['box', 'some', '???'])).toBe(false)
  expect(res.list.hasValues('???', [])).toBe(false)
})

test('split([]) => [])', () => {
  expect(split([]).length).toBe(0)
})

test('split([\'foo\', \'bar\', \'--\', \'box\']) => [[\'foo\', \'bar\'], [\'box\']])', () => {
  const rawArgs = ['foo', 'bar', '-----', 'box']
  const res = split(rawArgs)
  const expected1 = ['foo', 'bar']
  const expected2 = ['box']
  expect(res.length).toBe(2)
  expect(res[0]).toEqual(expected1)
  expect(res[1]).toEqual(expected2)
})

test('split(..., -P, true)', () => {
  const rawArgs = ['foo', 'bar', '-p', 'box']
  expect(split(rawArgs, '-P').length).toBe(1)
  expect(split(rawArgs, '-P', true).length).toBe(2)
})
