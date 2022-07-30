import type {
  Group,
  Options,
  IReadonlySet,
  IReadonlyMapString,
  IReadonlyMapList,
  IArguments
} from './types.js'
import {
  readonlySet,
  readonlyMapString,
  readonlyMapList
} from './impl.js'

const argType = {
  isSeparator: 1,
  isArg: 2,
  isVal: 3
} as const
type TArgType = (typeof argType)[keyof (typeof argType)]

const groupType = {
  bool: 4,
  params: 5,
  list: 6,
  unnamed: 7
} as const
type TGroupType = (typeof groupType)[keyof (typeof groupType)]

function createValueHandler (ignoreCase: boolean, lowerCase: boolean): (v: string) => [TArgType, string] {
  // Сепаратор и параметр может иметь любое кол-во дефисов.
  return (v: string): [TArgType, string] => {
    const value = ignoreCase ? v.toLowerCase() : v
    if (/^-+$/.test(value)) {
      return [argType.isSeparator, value]
    }
    if (/^-+[^-]+/.test(value)) {
      return [argType.isArg, value]
    }
    // Значение в оригинальном виде.
    if (!lowerCase) {
      return [argType.isVal, v]
    }
    // Если уже привели к ToLower.
    if (ignoreCase) {
      return [argType.isVal, value]
    }
    return [argType.isVal, v.toLowerCase()]
  }
}

function appendGroup (recipient: Map<string, [TGroupType, string]>, aliases: Group, group: TGroupType, ignoreCase: boolean) {
  for (const [key, a] of Object.entries(aliases)) {
    for (const name of a) {
      recipient.set(ignoreCase ? name.toLowerCase() : name, [group, key])
    }
  }
}

function createGroupHandler (boolParams: Group, namedParams: Group, listParams: Group, ignoreCase: boolean): (v: string) => [TGroupType, string] {
  // Ключом map являются все псевдонимы параметров, -c, --config , ....
  // KeyValue:
  //   Key   - Базовый ключ параметра map["config"] = ..., который будет доступен в приложении.
  //   Value - Группа параметра.
  const list = new Map<string, [TGroupType, string]>()
  appendGroup(list, boolParams, groupType.bool, ignoreCase)
  appendGroup(list, namedParams, groupType.params, ignoreCase)
  appendGroup(list, listParams, groupType.list, ignoreCase)

  // Функция получает параметры только с префиксом дефисов -+*
  // При игнорировании регистра параметры уже преобразованы ToLower.
  return (key: string): [TGroupType, string] => {
    return list.get(key) || [groupType.unnamed, key]
  }
}

const defaultOptions = {
  bool: {} as Group,
  params: {} as Group,
  list: {} as Group,
  ignoreCase: false,
  lowerCase: false
}

/**
 * Разбирает параметры аргументов. 
 * 
 * @param args    Массив аргументов. Обычно это process.argv.slice(2).
 * @param options Необязательный объект опций.
 * @returns IArguments
 */
function parse (args: string[], options?: null | Options): IArguments {
  const opts = { ...defaultOptions, ...(options || undefined) }
  const valueHandler = createValueHandler(opts.ignoreCase, opts.lowerCase)
  const groupHandler = createGroupHandler(opts.bool, opts.params, opts.list, opts.ignoreCase)

  const bool = readonlySet()
  const params = readonlyMapString()
  const list = readonlyMapList()
  const unnamed = readonlyMapList()
  const single = readonlySet()

  let currentKey = ''
  let add: (v: string) => void
  const addSingle = (v: string) => {
    single._add(v)
  }
  const addBool = (v: string) => {
    bool._add(v)
    add = addSingle
  }
  const addParam = (v: string) => {
    params._set(currentKey, v)
    add = addSingle
  }
  const addList = (v: string) => {
    list._set(currentKey, v)
  }
  const addUnnamed = (v: string) => {
    unnamed._set(currentKey, v)
  }
  add = addSingle

  for (const raw of args) {
    const [at, value] = valueHandler(raw)
    switch (at) {
      case argType.isSeparator:
        add = addSingle
        break
      case argType.isArg: {
        const [gt, key] = groupHandler(value)
        switch (gt) {
          case groupType.bool:
            addBool(key)
            break
          case groupType.params:
            currentKey = key
            add = addParam
            break
          case groupType.list:
            currentKey = key
            add = addList
            break
          default: // unnamed
            currentKey = key
            add = addUnnamed
            break
        }
      }
        break
      default: // isVal
        add(value)
        break
    }
  }

  // IArguments
  return {
    get bool (): IReadonlySet {
      return bool
    },
    get params (): IReadonlyMapString {
      return params
    },
    get list (): IReadonlyMapList {
      return list
    },
    get unnamed (): IReadonlyMapList {
      return unnamed
    },
    get single (): IReadonlySet {
      return single
    }
  }
}

/**
 * Разбивает строку аргументов по разделителю.
 * 
 * @param       args Аргументы командной строки.
 * @param  separator Разделитель. По умолчанию используется любое кол-во дефисов "--".
 * @param ignoreCase Если указан сепаратор, установка этого параметра в true проигнорирует регистр символов.
 * @returns Пример "foo bar -- box" -> [["foo", "bar"], ["box"]]
 */
function split (args: string[], separator?: null | string, ignoreCase?: null | boolean): string[][] {
  const test = separator
    ? (ignoreCase ? ((v: string) => v.toLowerCase() === separator.toLowerCase()) : ((v: string) => v === separator))
    : (v: string) => /^-+$/.test(v)

  const res = []
  let current = []
  for (const v of args) {
    if (!test(v)) {
      current.push(v)
      continue
    }
    if (current.length) {
      res.push(current)
      current = []
    }
  }
  if (current.length) res.push(current)
  return res
}

export {
  parse,
  split
}
