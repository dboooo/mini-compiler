interface InputItem {
  type: string;
  value: string
}

interface AstBody {
  type: string;
  name?: string;
  params?: any;
  value?: string;
}

interface ParserResult extends AstBody {
  body: AstBody[]
}
export function Tokenizer(input: String): InputItem[] {
  var current = 0
  var tokens: InputItem[] = []

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
    // 空格就跳过
    if (WHITE_SPACE.test(char)) {
      current++;
      continue;
    }
    // 数字就是参数
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
    // 如果是文字我们就判断为函数
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

export function Parser(tokens: InputItem[]): ParserResult {
  var current = 0

  function walk(): AstBody {
    var token = tokens[current]

    if (token.type === 'number') {
      current++
      return {
        type: 'NumberLiteral',
        value: token.value
      }
    }
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {
      token = tokens[++current]
      var node: AstBody = {
        type: 'CallExpression',
        name: token.value,
        params: []
      }

      token = tokens[++current]
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk())
        token = tokens[current]
      }

      current++

      return node
    }
    throw new TypeError(token.type)
  }

  var ast: ParserResult = {
    type: 'Program',
    body: []
  }

  while (current < tokens.length) {
    ast.body.push(walk())
  }

  return ast
}

export function Traverser(ast: ParserResult, vistor) {
  function traverseArray(array: any[], parent: any) {
    array.forEach(function (child) {
      traverseNode(child, parent)
    })
  }

  function traverseNode(node: ParserResult, parent) {
    var method = vistor[node.type]

    if (method) {
      method(node, parent)
    }
    switch (node.type) {
      case 'Program':
        traverseArray(node.body, node);
        break;
      case 'CallExpression':
        traverseArray(node.params, node)
        break;
      case 'NumberLiterals':
        break;
      default:
        throw new TypeError(node.type);
    }
  }
  traverseNode(ast, null)
}

// 对ast进行转换
export function Transformer(ast: any) {
  var newAst = {
    type: 'Program',
    body: []
  }

  ast._context = newAst.body

  Traverser(ast, {
    NumberLiteral: function (node, parent) {
      parent._context.push({
        type: 'NumberLiteral',
        value: node.value
      })
    },
    CallExpression: function (node, parent) {
      var expression = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: node.name
        },
        arguments: []
      }

      node._context = expression.arguments

      if (parent.type !== 'CallExpression') {
        expression = {
          type: 'ExpressionStatement',
          expression: expression
        }
      }
      parent._context.push(expression)
    }
  })
  return newAst
}

export function CodeGenerator(node: any): any {
  switch (node.type) {
    case 'Program':
      return node.body.map(CodeGenerator).join('\n');
    case 'ExpressionStatement':
      return (
        CodeGenerator(node.expression) +
        ';'
      );
    case 'CallExpression':
      return (
        CodeGenerator(node.callee) +
        '(' +
        node.arguments.map(CodeGenerator)
          .join(', ') +
        ')'
      );
    case 'Identifier':
      return node.name;
    case 'NumberLiteral':
      return node.value;
    default:
      throw new TypeError(node.type);
  }
}

export function compiler(input) {
  var tokens = Tokenizer(input)
  var ast = Parser(tokens)
  var newAst = Transformer(ast)
  var output = CodeGenerator(newAst)

  return output
}
