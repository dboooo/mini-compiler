import * as compiler from '../src/mini-compiler'
import { describe, expect, it, test } from "vitest";

describe('Compiler', () => {
  const origin = "(add 2 (subtract 4 2))"
  const tokens = compiler.tokenizer(origin)
  const ast = compiler.parser(tokens)
  // tokens
  test('tokens', () => {
    const expected = [
      { type: 'paren', value: '(' },
      { type: 'name', value: 'add' },
      { type: 'number', value: '2' },
      { type: 'paren', value: '(' },
      { type: 'name', value: 'subtract' },
      { type: 'number', value: '4' },
      { type: 'number', value: '2' },
      { type: 'paren', value: ')' },
      { type: 'paren', value: ')' }
    ]
    expect(tokens).toEqual(expected)
  })
  test('parser', () => {
    const expected = {
      type: 'Program',
      body: [{
        type: 'CallExpression',
        name: 'add',
        params: [{
          type: 'NumberLiteral',
          value: '2'
        }, {
          type: 'CallExpression',
          name: 'subtract',
          params: [{
            type: 'NumberLiteral',
            value: '4'
          }, {
            type: 'NumberLiteral',
            value: '2'
          }]
        }]
      }]
    }
    expect(ast).toEqual(expected)
  })
  test('transformer', () => {
    const newAst = compiler.transformer(ast)
    const expected = {
      type: 'Program',
      body: [{
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'add'
          },
          arguments: [{
            type: 'NumberLiteral',
            value: '2'
          }, {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'subtract'
            },
            arguments: [{
              type: 'NumberLiteral',
              value: '4'
            }, {
              type: 'NumberLiteral',
              value: '2'
            }]
          }]
        }
      }]
    }

    expect(newAst).toEqual(expected)
  })
})