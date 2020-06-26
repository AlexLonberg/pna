
# Parse node arguments

    npm i @lonberg/pna

Разбирает аргументы командной строки.

- [Использование](#использование)
- [Options: {}](#options-)
  - [Options.alias:{}](#optionsalias)
  - [Options.ignoreCase:boolean](#optionsignorecaseboolean)
  - [Options.item:boolean](#optionsitemboolean)
  - [Options.uniq:boolean](#optionsuniqboolean)
  - [Options.bool:string[]](#optionsboolstring)
- [npa(options?):function](#npaoptionsfunction)
- [parser(argv?):{}](#parserargv)
  - [Arg.args:Array](#argargsarray)
  - [Arg.map:Map](#argmapmap)
  - [Arg.has(p?):boolean](#arghaspboolean)
  - [Arg.get(p?):false|[]|string|null|true](#arggetpfalsestringnulltrue)

## Использование

```js
import pna from '@lonberg/pna'

const options = {
  alias: {
    'foo': ['--foo', '-F'],
    '-B': ['--bar']
  },
  uniq: true
}

// Обратите внимание, возвращается функция обработки массива аргументов
const parser = pna(options)

// Пример командной строки
// $ node app.js -F any --bar --foo any

// Опционально можно передать собственный массив argv
// По умолчанию используется `process.argv.slice(2)`
// [-F any --bar --foo any]

// Вызов парсера возвратит объект
const arg = parser(argv)
// => { args, map, has(), get() }

arg.has('foo')
// => true
arg.has('-F')
// => true

// При установке `uniq:true`, аргумент для параметра foo, не дублируется
arg.get('foo')
// => ['any']
```

Смотри простой пример в [.test/consoleLog.js](./.test/consoleLog.js)

## Options: {}

Необязательный объект опций.

```js
const options = {
  // Псевдонимы для параметров
  alias: {
    'foo': ['--foo', '-F'],
    '-B': ['--bar']
  },
  ignoreCase: false,
  item: false,
  uniq: false,
  bool: []
}
```

### Options.alias:{}

Псевдонимы параметров.

При разборе аргументов, последние добавляются в элемент массива соответствующий параметру командной строки.

Имена параметров используют общепринятый дефис (`-- | -`).

    $ node app.js -c foo bar --separator -c box
    // аргументы "foo", "bar" и "box", будут соответствовать параметру "-c"
    args => ['-c', ['foo','bar','box']]

Валидные параметры:

    --foo -F
    // ... и это
    --
    // ... и один дефис
    -

Невалидные:

    bar
    // окружено кавычками
    "-"

Использование `options.alias` позволяет:

* указать несколько псевдонимов параметра
* использовать, для доступа к аргументам, имя параметра без дефиса

```js
// $ node app.js -C foo --config bar

alias: {
  '--config': ['-C']
}
// arg.args => ['--config', ['foo', 'bar'] ]
arg.has('--config')
// => true

// имя свойства может быть указано и без дефиса
alias: {
  configFile: ['--config', '-C']
}
// arg.args => ['configFile', ['foo', 'bar'] ]
arg.get('configFile')
// => ['foo', 'bar'] 

arg.has('-C')
// => true
```

Независимо от того, были ли указаны псевдонимы или нет, доступ к аргументам можно получить с помощью любого имени.

```js
// $ node app.js -C foo --config bar
arg.has('-C')
// => true
```

![bomb](./bomb.png)

Неверная установка `alias`, пересечение с уже имеющимися параметрами, выбрасывает исключение.

```js
options.alias: {
  '--config': ['-C'],
  'configFile': ['--config'], // error
  '-c': ['-C']                // error
}

const parser = pna(options)
// Error(`Aliases intersection`)

```

### Options.ignoreCase:boolean

По умолчанию регистр параметров НЕ игнорируется. Если установить в `true`, все параметры (`--FOO`), в том числе и имена свойств `options.alias`, будут приведены к нижнему регистру.

Опция не затрагивает массивы аргументов.

```js
alias:{ c:['--config', '-C'], ignoreCase:true }

// $ node app.js -c FILE.JSON

// При вызове методов имена так же приводятся к нижнему регистру
arg.has('--coNFIg')
// => true

// Аргументы всегда сохранят регистр символов
arg.get('c')
// => ['FILE.JSON']
```

### Options.item:boolean

Не использовать массив аргументов. Это всегда возвратит только один последний аргумент.

```js
item:true

// $ node app.js -c file.json settings.json

// Возвратит строку с последним аргументом,
//   а не массив ["file.json","settings.json"]
arg.get('-c')
// => "settings.json"

```

### Options.uniq:boolean

Установка в `true`, позволяет избежать дублирования аргументов.

Эта опция игнорируется при использовании `item:true`.

Обратите внимание: регистр аргументов не меняется, а значит возможны неуникальные элементы:

```js
uniq:true

// $ node app.js -c file.json --foo -c file.json file.JSON

// "file.json" будет добавлен только один раз
// ... но не "file.JSON"
arg.get('-c')
// => ['file.json', 'file.JSON']
```

### Options.bool:string[]

Список булевых параметров. Могут быть указаны как любые имена в `options.alias`.

Если приложение использует булевые параметры, установленные в неопределенном месте, перечислите их имена в `options.bool`.

```js
const options = {
  alias: { w:['--watch'] },
  bool: [
    '--dev',
    // используйте любое имя псевдонима, включая имя свойтсва
    'w'
  ]
}

// $ node app.js -c --watch file.json --dev main.json

const arg = npa(options)()

// Обратите внимание, аргументы идущие за булевым параметром,
//   относятся к предшетствующему параметру
arg.has('w')
// => true
arg.has('--dev')
// => true
arg.get('-c')
// => ["file.json", "main.json"]
```

## npa(options?):function

Подготавливает [опции](#options-) и возвращает функцю [парсера](#parserargv).

```js
// parser(argv?) может использоваться многократно
const parser = pna(options?)
```

Можно сразу вызвать:

```js
// $ node app.js --watch
const arg = npa({bool:['--watch']})()
arg.has('--watch')
// => true
```

## parser(argv?):{}

Парсер вызывается с единственным необязательным параметром `argv` массива аргументов.

По умолчанию используется `process.argv.slice(2)`, но вы можете передать любой массив:

```js
const arg = parser(['-g', 'a', 'b'])
arg.get('-g')
// => ['a', 'b']
```

Вызов парсера возвращает объект:

```js
{
  args: Array, // [[parameterName, [arg1, arg2...]], ...]
  map: Map,    // {parameterName:index, ...}
  has(p?): boolean,
  get(p?): false|[]|string|null|true,
}
```

### Arg.args:Array

Массив аргументов подобный вызову метода `Object.entries()`.

Каждый элемент массива содержит:

* `0:string` - имя параметра или `null` для первых аргументов не соответствующих ни одному параметру
* `1:*`      - аргументы соответствующие параметру, смотри варианты [array[1]](#arggetpfalsestringnulltrue)


Если указаны все `options.alias`, это позволяет быстро создать валидный объект:

```js
const options = {
  alias: { config:['-c'], watch:['--watch'], dev:['--dev'] },
  bool: [ 'watch', 'dev' ]
}

// $ node app.js -c --watch file.json --dev main.json

const arg = npa(options)()

Object.fromEntries(arg.args)
// => { config:["file.json", "main.json"], watch:true, dev:true }
```

Замечание: в массиве аргументов может быть не установлено ни одного параметра, или первым аргументам не предшедствует ни один параметр,
тогда первый элемент массива `args` будет содержать неименованные аргументы.

```js
// Строка ниже содержит неименованный аргумент file.txt
//  $ node app.js file.txt -c config.json

const arg = npa()()
// arg.args =>
// [
//   [ null, ["file.txt"] ],
//   [ "-c", ["config.json"] ]
// ]

```

### Arg.map:Map

Экзкмпляр `Map`, где ключами являются все существующие параметры, включая псевдонимы, а значениями индекс массива `args`.

```js
// $ node app.js -c foo
const arg = npa()()

// Для получения только массива аргументов, используйте метод Arg.get(p?),
//   здесь это только для примера
const i = arg.map.get('-c')
const item = arg.args[i]
// => ["-c", ["foo"]]
```

### Arg.has(p?):boolean

Проверка установки параметра.

```js
// $ node app.js -c
const arg = npa()()

// Даже если параметр не содержит аргументов, вернет истину
arg.has('-c')
// => true
```

### Arg.get(p?):false|[]|string|null|true

Возвращает аргументы соответствующие имени параметра, или массив неименованных аргументов.

Результатом вызова могут быть:

* `false`    - если параметр не установлен
* `string[]` - массив аргументов соответстующих имени параметра
* `string`   - строка, если использована опция `options.item:true`
* `null`     - если использована опция `options.item:true` и параметр не содержит аргументов
* `true`     - для булевых параметров, если установлена опция `options.bool`

```js
// $ node app.js file.txt -c
const arg = npa()()

// Вернет неименованные параметры
arg.get()
// => ["file.txt"]

// Вернет пустой массив
arg.get('-c')
// => []
```
