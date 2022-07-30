
/**
 * Группа параметров.
 */
type Group = {
  /**
   * Ключом является желаемое имя параметра, которое будет использовано в методах IArguments.
   * Значение ключа это массив возможных псевдонимов.
   */
  [k: string]: string[]
}

/**
 * Опции.
 */
type Options = {
  /** Псевдонимы для булевых параметров. */
  bool?: Group
  /** Псевдонимы для именованных одиночных параметров. */
  params?: Group
  /** Псевдонимы для массивоподобных параметров. */
  list?: Group

  /**
   * Игнорирование регистра символов параметров. Это не влияет на значения следующие за параметрами.
   * Например параметр "-c foo", равносилен "-C foo", но метод hasValue("-c", "FOO") вернет false.
   * Значения хранятся в map и не меняют регистр символов.
   */
  ignoreCase?: boolean

  /**
   * Явно привести все значения параметров к нижнему регистру.
   */
  lowerCase?: boolean
}

interface IReadonlySet {

  /**
   * Наличие значения.
   * @param value 
   */
  has (value: string): boolean

  /**
   * Возвращает список всех значений в виде массива.
   */
  values (): string[]

  /**
   * Кол-во значений.
   */
  size (): number
}

interface IReadonlyMap {

  /**
   * Наличие параметра.
   * @param value 
   */
  has (key: string): boolean

  /**
   * Кол-во ключей в IReadonlyMap.
   */
  size (): number
}

/**
 * Интерфейс для одиночных параметров.
 */
interface IReadonlyMapString extends IReadonlyMap {

  /**
   * Возвращает значение для ключа.
   * @param key 
   */
  get (key: string): undefined | string

  /**
   * Возвращает массив пар key/value
   */
  entries (): [string, string][]
}

/**
 * Интерфейс для массивоподобных параметров.
 */
interface IReadonlyMapList extends IReadonlyMap {

  /**
   * Проверяет наличие значения для указанного параметра.
   * @param key 
   * @param value 
   */
  hasValue (key: string, value: string): boolean

  /**
   * Альтернатива hasValue(...), позволяющая проверить несколко значений для параметра.
   * @param key 
   * @param values 
   */
  hasValues (key: string, values: string[]): boolean

  /**
   * Возвращает значение для ключа.
   * @param key 
   */
  get (key: string): undefined | string[]

  /**
   * Возвращает массив пар key/value
   */
  entries (): [string, string[]][]
}

/**
 * Интерфейс аргументов.
 */
interface IArguments {
  /**
   * Булевые аргументы.
   */
  readonly bool: IReadonlySet
  /**
   * Именованные одиночные параметры.
   * Значением будет только следующий элемент массива, если он не является именем параметра.
   */
  readonly params: IReadonlyMapString
  /**
   * Массивоподобные параметры.
   * Значением будет список аргументов до следующего параметра.
   */
  readonly list: IReadonlyMapList
  /**
   * Параметры которым не определен псевдоним - все элементы с префиксом `-*`.
   */
  readonly unnamed: IReadonlyMapList
  /**
   * Значения которые не вошли ни в одну из подгрупп.
   */
  readonly single: IReadonlySet
}

export type {
  Group,
  Options,
  IReadonlySet,
  IReadonlyMap,
  IReadonlyMapString,
  IReadonlyMapList,
  IArguments
}
