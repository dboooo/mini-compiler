interface TokenItem {
  type: string;
  value: string
}

interface Ast<T = any[]> {
  type: string;
  body: T extends TokenItem[] ? TokenItem[] : AstBody[]
}

interface AstBody {
  type: string;
  name: string;
  params: any;
}

// 假设传入tokenizer的值: (add 2 (subtract 4 2))

export function tokenizer(input: string): TokenItem[] {
  var current = 0
  var tokens: TokenItem[] = []

  // 用于判断用的
  var WHITE_SPACE = /\s/
  var NUMBERS = /[0-9]/
  var LETTERS = /[a-z]/i

  while (current < input.length) {
    // 存储当前字符
    var char = input[current]

    if (char === '(') {
      tokens.push({
        type: 'paren',
        value: '('
      });
      current++;
      continue;
    }
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')'
      });
      current++;
      continue;
    }
    if (char === '"') {
      let value = ""
      char = input[current++]
      while (char != '"') {
        value += char
        char = input[++current]
      }
      tokens.push({
        type: 'string',
        value
      })
      char = input[++current]
      continue;
    }
    if (WHITE_SPACE.test(char)) {
      current++;
      continue;
    }
    if (NUMBERS.test(char)) {
      let value = ''

      while (NUMBERS.test(char)) {
        value += char as unknown
        char = input[++current]
      }

      tokens.push({
        type: 'number',
        value
      })
      continue
    }
    if (LETTERS.test(char)) {
      let value = ''
      while (LETTERS.test(char)) {
        value += char
        char = input[++current]
      }
      tokens.push({
        type: 'name',
        value
      });

      continue;
    }

    // 当传入的字符串以上都没有匹配到，那就报错
    throw new TypeError('I dont know what this character is: ' + char);

  }
  return tokens
}

// 例如生成的tokens的值会是 
// [
//   { type: 'paren', value: '(' },
//   { type: 'name', value: 'add' },
//   { type: 'number', value: '2' },
//   { type: 'paren', value: '(' },
//   { type: 'name', value: 'subtract' },
//   { type: 'number', value: '4' },
//   { type: 'number', value: '2' },
//   { type: 'paren', value: ')' },
//   { type: 'paren', value: ')' }
// ]
export function parser(tokens: TokenItem[]): Ast {
  var current = 0
  var ast: Ast = {
    type: 'Program',
    body: []
  }

  function go() {

  }

  return ast
}

// 那么经过oarser的值就会是: 
// {
//   type: 'Program',
//   body: [{
//     type: 'CallExpression',
//     name: 'add',
//     params: [{
//       type: 'NumberLiteral',
//       value: '2'
//     }, {
//       type: 'CallExpression',
//       name: 'subtract',
//       params: [{
//         type: 'NumberLiteral',
//         value: '4'
//       }, {
//         type: 'NumberLiteral',
//         value: '2'
//       }]
//     }]
//   }]
// }


export function compiler(input: string) {
  var tokens = tokenizer(input)
  var ast = parser(tokens)
}
