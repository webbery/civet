// const parser = require('@babel/parser')
// const traverse = require('@babel/traverse').default
// const generator = require('@babel/generator').default
// const t = require('@babel/types')
// dependency resolver
// let DependencyResolver = function (AST) {}

// module.exports = function(source){
//   const ast = parser.parse(source,{ sourceType: 'module'})
//   traverse(ast, {
//     CallExpression(path){ 
//       if(t.isMemberExpression(path.node.callee) && t.isIdentifier(path.node.callee.object, {name: "console"})){
//         path.remove()
//       }
//     }
//   })
//   const output = generator(ast, {}, source);
//   return output.code
// }
