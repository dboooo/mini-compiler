export enum TokenTypes {
  Paren = 'paren',
  Name = 'name',
  Number = 'number',
  String = 'string'
}

export interface Token {
  type: TokenTypes
  value: string
}

export enum NodeTypes {
  NumberLiteral = "NumberLiteral",
  Program = "Program",
  StringLiteral = "StringLiteral",
  CallExpression = "CallExpression",
}

export type ChildNode =
  | NumberLiteralNode
  | StringLiteralNode
  | CallExpressionNode

export interface NumberLiteralNode {
  type: NodeTypes.NumberLiteral;
  value: string;
}

export interface StringLiteralNode {
  value: string;
  type: NodeTypes.StringLiteral;
}

export interface CallExpressionNode {
  type: NodeTypes.CallExpression
  name: string
  params: ChildNode[]
  context?: ChildNode[]
}

export interface RootNode {
  type: NodeTypes.Program
  body: ChildNode[]
  context?: ChildNode[]
}

type ParentNode = RootNode | CallExpressionNode | undefined
type MethodFn = (node: RootNode | ChildNode, parent: ParentNode) => void
interface VisitorOpt {
  enter: MethodFn
  exit?: MethodFn
}

export interface Vistor {
  Program?: VisitorOpt
  NumberLiteral?: VisitorOpt;
  CallExpression?: VisitorOpt;
  StringLiteral?: VisitorOpt;
}

// 假设传入tokenizer的值: (add 2 (subtract 4 2))

export function tokenizer(input: string) {
  var current = 0
  var tokens: Token[] = []

  // 用于判断用的
  var WHITE_SPACE = /\s/
  var NUMBERS = /[0-9]/
  var LETTERS = /[a-z]/i

  while (current < input.length) {
    // 存储当前字符
    var char = input[current]

    if (char === '(') {
      tokens.push({
        type: TokenTypes.Paren,
        value: '('
      });
      current++;
      continue;
    }
    if (char === ')') {
      tokens.push({
        type: TokenTypes.Paren,
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
        type: TokenTypes.String,
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
        type: TokenTypes.Number,
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
        type: TokenTypes.Name,
        value
      });

      continue;
    }

    // 当传入的字符串以上都没有匹配到，那就报错
    throw new TypeError('I dont know what this character is: ' + char);

  }
  return tokens
}

export function parser(tokens: Token[]) {
  let current = 0
  let token = tokens[current]
  let root: RootNode = {
    type: NodeTypes.Program,
    body: []
  }

  function walk(): ChildNode {
    if (token.type === TokenTypes.Number) {
      current++
      return {
        type: NodeTypes.NumberLiteral,
        value: token.value
      }
    }
    if (token.type === TokenTypes.String) {
      current++
      return {
        type: NodeTypes.StringLiteral,
        value: token.value
      }
    }
    if (
      token.type === TokenTypes.Paren &&
      token.value === '('
    ) {
      token = tokens[++current]
      let node: CallExpressionNode = {
        type: NodeTypes.CallExpression,
        name: token.value,
        params: []
      }
      token = tokens[++current]
      while (
        !(token.type === TokenTypes.Paren && token.value === ')')
      ) {
        node.params.push(walk())
        token = tokens[current]
      }

      current++
      return node
    }

    throw new Error("can't find this type: " + token.type)
  }

  while (current < tokens.length) {
    root.body.push(walk())
  }

  return root
}

export function traverser(ast: RootNode, vistor: Vistor) {
  function traverseArray(node: ChildNode[], parent: ParentNode) {
    node.forEach((child) => {
      traverNode(child, parent)
    })
  }

  function traverNode(node: RootNode | ChildNode, parent?: ParentNode) {
    // 进入
    const methods = vistor[node.type]

    if (methods) {
      methods.enter(node, parent)
    }

    switch (node.type) {
      case NodeTypes.Program:
        traverseArray(node.body, node);
        break;
      case NodeTypes.CallExpression:
        traverseArray(node.params, node);
        break;
      case NodeTypes.NumberLiteral:
        break;
      default:
        break;
    }

    if (methods?.exit && methods) {
      methods.exit(node, parent)
    }
  }

  traverNode(ast)
}

export function transformer(ast: RootNode) {
  const newAst = {
    type: NodeTypes.Program,
    body: []
  }

  traverser(ast, {
    'NumberLiteral': {
      enter(node, parent) {
        if (node.type === NodeTypes.NumberLiteral) {
          parent?.context?.push({
            type: NodeTypes.NumberLiteral,
            value: node.value
          })
        }
      }
    },
    'CallExpression': {
      enter(node, parent) {
        if (node.type === NodeTypes.CallExpression) {
          let expression: any = {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: node.name,
            },
            arguments: [],
          };


          node.context = expression.arguments;

          if (parent?.type !== NodeTypes.CallExpression) {
            expression = {
              type: "ExpressionStatement",
              expression,
            };
          }

          parent?.context?.push(expression);
        }
      }
    }
  }
  )
  return newAst
}

function codeGenerator(node: any): any {
  switch (node.type) {
    case "Program":
      return node.body.map(codeGenerator).join("");
    case "ExpressionStatement":
      return codeGenerator(node.expression) + ";";
    case "NumberLiteral":
      return node.value;
    case "CallExpression":
      return (
        node.callee.name + "(" + node.arguments.map(codeGenerator).join(", ") + ")"
      );
  }
}

export function compiler(input: string) {
  let tokens = tokenizer(input);
  let ast = parser(tokens);
  let newAst = transformer(ast);
  let output = codeGenerator(newAst);

  // and simply return the output!
  return output;
}
