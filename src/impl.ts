import type {
  IReadonlySet,
  IReadonlyMapString,
  IReadonlyMapList
} from './types.js'

type AddToSet = { _add: (value: string) => void }
type AddToMapString = { _set: (key: string, value: string) => void }
type AddToMapList = { _set: (key: string, value: string) => void }

function readonlySet (): IReadonlySet & AddToSet {
  // Используем массив для сохранения порядка значений.
  const set: string[] = []
  return {
    has (value: string): boolean {
      return set.includes(value)
    },
    values (): string[] {
      return set.slice()
    },
    size (): number {
      return set.length
    },
    // private
    _add (value: string): void {
      if (!set.includes(value)) set.push(value)
    }
  }
}

function readonlyMapString (): IReadonlyMapString & AddToMapString {
  const map = new Map<string, string>()
  return {
    has (key: string): boolean {
      return map.has(key)
    },
    size (): number {
      return map.size
    },
    get (key: string): undefined | string {
      return map.get(key)
    },
    entries (): [string, string][] {
      return [...map.entries()]
    },
    // private
    _set (key: string, value: string): void {
      map.set(key, value)
    }
  }
}

function readonlyMapList (): IReadonlyMapList & AddToMapList {
  const map = new Map<string, IReadonlySet>()
  return {
    has (key: string): boolean {
      return map.has(key)
    },
    size (): number {
      return map.size
    },
    get (key: string): undefined | string[] {
      return map.get(key)?.values()
    },
    entries (): [string, string[]][] {
      const res = []
      for (const [k, v] of map) {
        res.push([k, v.values()] as [string, string[]])
      }
      return res
    },
    hasValue (key: string, value: string): boolean {
      const temp = map.get(key)
      return temp ? temp.has(value) : false
    },
    hasValues (key: string, values: string[]): boolean {
      const temp = map.get(key)
      if (!temp) return false
      for (const item of values) {
        if (!temp.has(item)) return false
      }
      return true
    },
    // private
    _set (key: string, value: string): void {
      let temp = map.get(key) as IReadonlySet & AddToSet
      if (!temp) {
        temp = readonlySet()
        map.set(key, temp)
      }
      temp._add(value)
    }
  }
}

export {
  readonlySet,
  readonlyMapString,
  readonlyMapList
}
