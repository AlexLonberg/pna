/* consoleLog.js [ 26.06.2020 : 20:47:47 ] */

import pna from '../index.js'

// Тест для вызова из консоли, результ массива аргументов `args` будет выведен в консоль

// $ node .test/consoleLog.js -c foo --watch bar

const arg = pna({
  alias: { config: ['-c'] },
  bool: ['--watch']
})()

console.log(arg.args)
// [ 
//   [ 'config', [ 'foo', 'bar' ] ], 
//   [ '--watch', true ]
// ]

console.log(arg.map)
// Map(3) { 
//   'config' => 0, 
//   '-c' => 0, 
//   '--watch' => 1 
// }

console.log(arg.get('config'))
// [ 'foo', 'bar' ]