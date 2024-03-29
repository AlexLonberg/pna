
# Parse node arguments

```
    npm i @lonberg/pna
```

Разбор аргументов командной строки.

- [Использование](#использование)
- [Опции](#опции)
- [Установка из github](#установка-из-github)

## Использование

```ts
import { parse } from '@lonberg/pna'
// >>> -c config.json qwerty -P --targets FOO bar -- desk -T box
const rawArgs = process.argv.slice(2)

const args: IArguments = parse(rawArgs, {
  bool: {
    // Ключ это желаемое имя параметра при доступе к IArguments.
    // Значение это массив псевдонимов используемых в командной строке.
    MODE_DEV: ['-D', '--dev'],
    MODE_PROD: ['-P', '--prod']
  },
  params: {
    config: ['-c', '--config']
  },
  list: {
    targets: ['--targets', '-T']
  },
  // Игнорировать регистр символов для параметров.
  ignoreCase: false,
  // Явно привести все значения параметров к нижнему регистру.
  lowerCase: true
})

// Результатом будет интерфейс с полями для каждой подгруппы параметров
// и методами has(...), get(...), hasValues(...) и т.п.
IArguments: {
  bool: ['MODE_PROD']
  params: {config: 'config.json'}
  list: {targets: ['foo', 'bar', 'box']}
  // Параметры которые не определены.
  // Параметром считается любое значение с ведущими дефисами -*, кроме сепаратора.
  // Сепаратор(любое кол-во дефисов --) не входит в результат.
  // Все значения следующие за таким параметром, окажутся в одном массиве.
  unnamed: {}
  // Значения которые не вошли ни в одну из подгрупп. 
  single: ['qwerty', 'desk']
}
```

При необходимости предварительно разбить список аргументов используйте:

```ts
import { split } from '@lonberg/pna'

const a = split(['foo', 'bar', '--', 'box'], '', false)
// [
//   ['foo', 'bar'],
//   ['box']
// ]
```

## Опции

Каждая из опций, как и сам объект опций, являются необязательными.

```ts
type Options = {
  // Псевдонимы для булевых параметров.
  bool?: {[k: string]: string[]} // Group
  // Псевдонимы для именованных одиночных параметров.
  // Значением будет следующий элемент массива,
  // если он не является именем параметра.
  params?: Group
  // Псевдонимы для массивоподобных параметров.
  // Значением будет массив всех элементов до следующего параметра.
  // Массивы могут объединяться, например '-a foo -- -a bar' -> [foo, bar]
  list?: Group
  // Игнорирование регистра символов параметров.
  // Это не влияет на значения следующие за параметрами.
  // Например параметр "-c foo", равносилен "-C foo",
  // но метод hasValue("-c", "FOO") вернет false.
  ignoreCase?: boolean
  // Явно привести все значения параметров к нижнему регистру.
  lowerCase?: boolean
}
```

Все доступные типы:

```ts
import {
  type Group,
  type Options,
  type IReadonlySet,
  type IReadonlyMap,
  type IReadonlyMapString,
  type IReadonlyMapList,
  type IArguments,
  parse,
  split  
} from '@lonberg/pna'
```

## Установка из github

```
    git clone https://github.com/AlexLonberg/pna.git custom_dir_name
    npm i ./custom_dir_name
```

`npm i <local_dir>` установит зависимости и выполнить `npm run postinstall`.
Локальная установка, в отличие от NPM, генерирует source map `--declarationMap` со ссылками на оригинальные `src/*.ts` файлы.
