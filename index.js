/* index.js [ 25.06.2020 : 23:07:29 ] */

const isInt = Number.isInteger
const isArray = Array.isArray
const ArrayFilter = Array.prototype.filter
const SToLowerCase = String.prototype.toLowerCase
const isObject = (any) => (typeof any === 'object' && any !== null)
const isString = (any) => (typeof any === 'string' && any.length)
const isValid = (any) => (isString(any) && /^-.*/.test(any))

const pals = (alias, bool, ignoreCase) => {
  let all = []
  let entries = []
  // alias
  for (let [p, a] of Object.entries(alias)) {
    let arr = []
    if (isArray(a)) {
      arr.push(...ArrayFilter.call(a, (v) => isValid(v)))
    }
    let n = ignoreCase ? (arr.map((v) => SToLowerCase.call(v)), SToLowerCase.call(p)) : p
    if (isValid(n)) {
      arr.push(n)
    }
    let tmp = []
    arr.forEach((v) => {
      if (all.includes(v)) {
        throw new Error(`Aliases intersection`)
      }
      if (!tmp.includes(v)) {
        tmp.push(v)
        entries.push([v, n])
      }
    })
    all.push(n, ...arr)
  }
  // bool
  let bl = new Map()
  let filter = (b) => {
    let a = entries.find(([v, n]) => (v === b || n === b))
    if (a) {
      a = a[1]
      bl.set(b, a)
      entries.filter(([v, n]) => (
        (a === n) ? (bl.set(v, a), false) : true)
      )
    } else if (isValid(b)) {
      bl.set(b, b)
    }
  }
  for (let b of bool) {
    if (isString(b)) {
      if (ignoreCase) {
        b = SToLowerCase.call(b)
      }
      if (!bl.has(b)) {
        filter(b)
      }
    }
  }
  return [
    new Map(entries), bl,
    ignoreCase
      ? (p) => (p ? SToLowerCase.call(p) : null)
      : (p) => (p || null)
  ]
}

const parse = (argv, alias, bool, ignoreCase, item, uniq) => {
  let args = []
  let ci = -1
  let map = new Map()

  let add = (origin, a, data) => {
    let i = map.get(a)
    if (!isInt(i)) {
      i = args.push([a, data]) - 1
      map.set(a, i)
    }
    map.has(origin) || map.set(origin, i)
    return i
  }

  for (let a of argv) {
    // parameters
    if (isValid(a)) {
      let origin = ignoreCase ? (a = SToLowerCase.call(a)) : a
      // bool
      if (bool.has(a)) {
        add(origin, bool.get(a), true)
        continue
      }
      // parameter
      if (alias.has(a)) {
        a = alias.get(a)
      }
      ci = add(origin, a, (item ? null : []))
    }
    // arguments
    else {
      if (ci === -1) {
        ci = args.push([null, (item ? null : [])]) - 1
        map.set(null, ci)
      }
      if (item) {
        args[ci][1] = a
      } else if (!uniq || !args[ci][1].includes(a)) {
        args[ci][1].push(a)
      }
    }
  }
  return [args, map]
}

/**
 * Parse node arguments
 * 
 * @param {{}}                       [options] Опционально. Опции.
 * @param {{}}                 [options.alias] Объект вида:    
 *                                              * foo:["--alias", "-A"] - параметры --alias и -A будут переименованы в "foo"   
 *                                              * ["--bar"]:["-B"]      - параметры --bar и -B будут переименованы в "--bar"   
 *                                               В массивах допустимы только строки с префиксом "-", остальные элементы игнорируются.
 * @param {boolean} [options.ignoreCase=false] По умолчанию регистр символов не игнорируется. Если установить в true, все параметры (--FOO),
 *                                               в том числе и имена свойств `options.alias` будут переведены в нижний регистр.
 * @param {boolean}       [options.item=false] По умолчанию каждый аргумент после "--foo a b -B", будет упакован в массив --foo:["a","b"].
 *                                               При установке в true, будет сохранен только один последний элемент или null(если нет аргумента) --foo:"b"
 * @param {boolean}       [options.uniq=false] Если `options.item:false`. Добавлять только уникальные элементы параметра.
 * @param {array}               [options.bool] Список булевых параметров. Могут быть указаны как имена в `options.alias`.
 * @return {function} Возвратит функцию разбора аргументов parse(argv), 
 * @description 
 * 
 */
export default (options) => {
  let { alias, ignoreCase, item, uniq, bool } = isObject(options) ? options : {}
  let fl = (isObject(alias) ? 1 : ((alias = {}), 0)) | (isArray(bool) ? 1 : ((bool = []), 0))
  let [als, bl, mdp] = fl
    ? pals(alias, bool, ignoreCase)
    : [new Map(), new Map(), (p) => (p || null)]
  /**
   * Parse node arguments
   * 
   * @param {array} [argv] Optional. Default process.argv.slice(2)
   * @return {{}}
   */
  return (argv) => {
    let [args, map] = parse(
      isArray(argv) ? argv : process.argv.slice(2),
      als, bl, ignoreCase, item, uniq
    )
    return {
      /** Массив entries подобный вызову метода Object.entries(). */
      args,
      /** Экземпляр Map, где имя ключа соответствует установленным параметрам, а значение указывает на индекс массива args. */
      map,
      /**
       * Проверка существования параметра.   
       * При установленном `options.ignoreCase:true`, метод автоматически переводит аргумент `p` в нижней регистру.
       *
       * @param {null|string} [p]
       * @returns {boolean}
       */
      has(p) {
        return map.has(mdp(p))
      },
      /**
       * Получение массива параметров или единственного параметра при `options.item:true`
       * 
       * @param {null|string} [p] При `null` будет возвращен массив аргументов не соответствующий ни одному параметру 
       * @returns {[]|*|false|true} Возвращает:
       *                        * false     - если параметр не установлен
       *                        * string:[] - массив аргументов
       *                        * string    - при `options.item:true`
       *                        * null      - при `options.item:true` и если у параметра нет аргументов
       *                        * true      - для булевых параметров, если установлена опция `options.bool`
       */
      get(p) {
        let i = map.get(mdp(p))
        return isInt(i) ? args[i][1] : false
      }
    }
  }
}
