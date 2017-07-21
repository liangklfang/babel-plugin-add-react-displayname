module.exports = transform;
var pathMod = require('path');
const util = require('util');
const t = require('babel-types');
const lifeCycleMthods = require('./lifeCycleMethod');
const lifeMethods = {
  //MethodDefinition
  ClassMethod(path) {
     if(lifeCycleMthods.indexOf(path.node.key.name)!=-1){
      //不需要经过value访问body，直接body就行
        const originalCodeBlockStatementEachMethod = path.node.body;
        const catchClause = t.catchClause(t.identifier("e"), t.BlockStatement([],[]));
        const tryBlock = t.tryStatement(originalCodeBlockStatementEachMethod, catchClause, null);
        path.replaceWith(
          tryBlock
        );
     }
  }
};

function transform (babel) {
  return {
    visitor: {
      ClassDeclaration: function (path, state) {
        if (classHasRenderMethod(path)) {
          //那么我会在他的外面包裹一层try..catch
          const classBody = path.node.body.body;
          //此时classBody会是一个method数组
          path.traverse(lifeMethods, {  });
        }
      }
    }
  }
}

//isKnownComponent(path.node.id.name, state.opts.knownComponents)
//id为Identifier对象，也就是说我们导出的这个函数的名称，在knownComponents这个集合中间
function isKnownComponent(name, knownComponents) {
  return (name && knownComponents && knownComponents.indexOf(name) > -1)
}

//从文件名称得到组件名称
function componentNameFromFilename(filename) {
  var extension = pathMod.extname(filename);
  var name = pathMod.basename(filename, extension)
  return name
}

//这里的path是FunctionExpression
//shouldSetDisplayNameForFuncExpr(path, state.opts.knownComponents)
//是否应该给函数表达式设置displayName属性，path可能是ArrowFunctionDeclaration
function shouldSetDisplayNameForFuncExpr(path, knownComponents) {
  // Parent must be either 'AssignmentExpression' or 'VariableDeclarator' or 'CallExpression' with a parent of 'VariableDeclarator'
  var id
  if (path.parentPath.node.type === 'AssignmentExpression' &&
      path.parentPath.node.left.type !== 'MemberExpression' && // skip static members
      path.parentPath.parentPath.node.type == 'ExpressionStatement' &&
      path.parentPath.parentPath.parentPath.node.type == 'Program') {
    id = path.parentPath.node.left
  }else{
    // if parent is a call expression, we have something like (function () { .. })()
    // move up, past the call expression and run the rest of the checks as usual
    // const jsx=(() => { return (<div></div>)})()
    if(path.parentPath.node.type === 'CallExpression') {
      path = path.parentPath
    }
    //这里是我们常见的调用方式，即父级组件是变量声明的形式，即如下形式:
   //const Username = ({ username }) => <p>The logged in user is: {username}</p>
    if(path.parentPath.node.type === 'VariableDeclarator') {
      if (path.parentPath.parentPath.parentPath.node.type === 'ExportNamedDeclaration' ||
          path.parentPath.parentPath.parentPath.node.type === 'Program') {
        id = path.parentPath.node.id
      //我们的Identifier就是我们的VariableDeclarator对象,即const Username中的Username
      }
    }
  }
  if (id) {
    //如果knownComponents存在，那么我们就要判断我们的identifier的name是否在knownComponents集合里面
    if (id.name && isKnownComponent(id.name, knownComponents)) {
      return true
    }
    //是否返回的jsx对象
    return doesReturnJSX(path.node.body)
  }

  return false
}

/**
 * 判断这个class是否有render方法
 */
function classHasRenderMethod(path) {
  //如果class没有body，直接返回。这里判断是否含有classBody
  if(!path.node.body) {
    return false
  }
  //遍历ClassBody.body，即ClassBody中其他属性
  var members = path.node.body.body
  //获取class中的body数组,如果有一个类型为ClassMethod,而方法名字为render
  for(var i = 0; i < members.length; i++) {
  //https://github.com/babel/babel/tree/7.0/packages/babel-types#classbody
  //即我们的classBody下的body是:body: Array<ClassMethod | ClassProperty> (required)
    if (members[i].type == 'ClassMethod' && members[i].key.name == 'render') {
      return true
    }
  }
  return false
}

// https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-display-name/src/index.js#L62-L77
// crawl up the ancestry looking for possible candidates for displayName inference
function findCandidateNameForExpression(path) {
  var id
  path.find(function (path) {
    //如果是赋值表达式，那么取到左侧的变量名称
    if (path.isAssignmentExpression()) {
      id = path.node.left;
      // name ="qinliang";，那么id就是"name"
    // } else if (path.isObjectProperty()) {
      // id = path.node.key;
    // 如果是变量声明，那么我们也会获取到变量的名称
    } else if (path.isVariableDeclarator()) {
      //const name ="qinliang";
      //此时得到的id也是name
      id = path.node.id;
    } else if (path.isStatement()) {
      // we've hit a statement, we should stop crawling u
      // 如果我们已经找到了statement，那么表示我们的scope已经被遍历完了，此时我们
      // 不再向上查找了1
      return true;
    }
    // we've got an id! no need to continue
    if (id) return true;
  });
  //我们返回找到的Identifier对象
  return id
}

//其中path是FunctionDeclaration对象
// doesReturnJSX(path.node.body)
/**
 * 其中body是BlockStatement对象，即函数体部分
 */
function doesReturnJSX (body) {
  if (!body) return false
    //如果body不存在那么就是空，直接返回
    //注意：不知道什么时候会走到这里的if逻辑
  if (body.type === 'JSXElement') {
    return true
  }
 //如果直接返回jsx，那么返回true
  var block = body.body
  if (block && block.length) {
    var lastBlock = block.slice(0).pop()
     //得到第一个对象returnStatement
    if (lastBlock.type === 'ReturnStatement') {
      return lastBlock.argument.type === 'JSXElement'
    }
  }
  return false
}

 // setDisplayNameAfter(path, path.node.id, babel.types)
 /**
  * [setDisplayNameAfter 从ClassDeclaration往上寻找父级节点，找到能够插入我们的displayName的代码]
  * @param {[type]} path        ClassDeclaration对象
  * @param {[type]} nameNodeId  我们的Identifier对象，path.node.id，其中id就是identifier
  * @param {[type]} t           babel.types属性
  * @param {[type]} displayName 设置我们的displayName
  */
function setDisplayNameAfter(path, nameNodeId, t, displayName) {
  if (!displayName) {
    displayName = nameNodeId.name
  }
  //如果没有displayName参数，那么我们的displayName就是我们的class的名称
  var blockLevelStmnt
  //在classDeclration对象下面寻找节点
  //https://github.com/thejameskyle/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#find-a-specific-parent-path
  //有些时候你需要向上遍历我们的AST树直到某一个条件已经满足了。此时我们的回调函数会被传入父节点，如果这个回调函数返回了
  //true那么我们直接返回这个NodePath
  //方法:path.findParent((path) => path.isObjectExpression());
  //方法2：path.find((path) => path.isObjectExpression());会包含当前的path
  path.find(function (path) {
    //find方法里面的path就是我们classDeclaration中的所有的path
    if (path.parentPath.isBlock()) {
      //也就是父级节点是BlockStatement即可
      //https://npmdoc.github.io/node-npmdoc-babel-core/build..beta..travis-ci.org/apidoc.html#apidoc.element.babel-core.traverse.NodePath.prototype.isBlock
      //下面是isBlock方法
      //isBlock = function (opts) {
      //   return t[typeKey](this.node, opts);
      // }
      // 通过这里的结果我们可以知道:我们的Program对象也是isBlock
      blockLevelStmnt = path
      return true
    }
  })

  if (blockLevelStmnt) {
    var trailingComments = blockLevelStmnt.node.trailingComments
    //去掉了尾注释
    delete blockLevelStmnt.node.trailingComments
    //删除BlockStatement的尾逗号
    var setDisplayNameStmn = t.expressionStatement(t.assignmentExpression(
      '=',
      t.memberExpression(nameNodeId, t.identifier('displayName')),
      t.stringLiteral(displayName)
    ))
    //插入我们的displayName
    blockLevelStmnt.insertAfter(setDisplayNameStmn)
  }
}
