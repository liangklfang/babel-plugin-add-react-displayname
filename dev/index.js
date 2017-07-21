// const code = `
// class Component3a extends React.Component {
//   render() {
//     return React.createElement('div', null);
//   }
// }
// //这里是注释
// `;
// const newPlugin = require("../index");
//   var babel = require('babel-core');
//   var out = babel.transform(code, {
//     plugins: [newPlugin]
//   });
// console.log('out---',out.code);
//此时我们的输出内容为:
//class Component3a extends React.Component {
//   render() {
//     return React.createElement('div', null);
//   }
// }
// Component3a.displayName = 'Component3a';



// const code = `
//    export default function (props) {
//     return (<div>
//               say hello
//             </div>)
//   }
// `;
// const newPlugin = require("../index");
//   var babel = require('babel-core');
//   var out = babel.transform(code, {
//     presets:["babel-preset-es2015","babel-preset-react","babel-preset-stage-0"],
//     plugins: [newPlugin]
//   });
// console.log('out---',out.code);
//输出内容为如下:
// "use strict";
// Object.defineProperty(exports, "__esModule", {
//           value: true
// });
// exports.default = _uid;
// function _uid(props) {
//           return React.createElement(
//                     "div",
//                     null,
//                     "say hello"
//           );
// }
// _uid.displayName = "unknown";


//例子3：通过export而不是export default导出的情况
// const code = `
//    export function Test(props) {
//     return (<div>
//               say hello
//             </div>)
//   }
// `;
// const newPlugin = require("../index");
//   var babel = require('babel-core');
//   var out = babel.transform(code, {
//     presets:["babel-preset-es2015","babel-preset-react","babel-preset-stage-0"],
//     plugins: [newPlugin]
//   });
// console.log('out---',out.code);
//输出结果如下（注意exports.Test是stage-0修改后的结果）:
//Object.defineProperty(exports, "__esModule", {
//           value: true
// });
// exports.Test = Test;
// function Test(props) {
//           return React.createElement(
//                     "div",
//                     null,
//                     "say hello"
//           );
// }
// Test.displayName = "Test";


//例子4：我们的没有导出的情况，那么父级节点就是program
// const code = `
//     function Test(props) {
//     return (<div>
//               say hello
//             </div>)
//   }
// `;
// const newPlugin = require("../index");
//   var babel = require('babel-core');
//   var out = babel.transform(code, {
//     presets:["babel-preset-es2015","babel-preset-react","babel-preset-stage-0"],
//     plugins: [newPlugin]
//   });
// console.log('out---',out.code);
//打包后的结果为如下内容:
//"use strict";
// function Test(props) {
//           return React.createElement(
//                     "div",
//                     null,
//                     "say hello"
//           );
// }
// Test.displayName = "Test";


//例子5：函数声明添加displayName的值
//下面的例子没有被添加任何属性
// const code = `
//     var func = function(agr1,arg2){
//      return (<div>hello world</div>)
//   }
// `;
// const newPlugin = require("../index");
//   var babel = require('babel-core');
//   var out = babel.transform(code, {
//     presets:["babel-preset-es2015","babel-preset-react","babel-preset-stage-0"],
//     plugins: [newPlugin]
//   });
// console.log('out---',out.code);
//输出结果如下:
//var func = function func(agr1, arg2) {
//   return React.createElement(
//     "div",
//     null,
//     "hello world"
//   );
// };
// func.displayName = "func";

//例子6：箭头函数添加displayName
//下面的例子没有被添加任何属性
// const code = `
//     const Username = ({ username }) => <p>The logged in user is: {username}</p>
// `;
// const newPlugin = require("../index");
//   var babel = require('babel-core');
//   var out = babel.transform(code, {
//     presets:["babel-preset-es2015","babel-preset-react","babel-preset-stage-0"],
//     plugins: [newPlugin]
//   });
// console.log('out---',out.code);
//打包后得到下面的代码
// var Username = function Username(_ref) {
//     var username = _ref.username;
//     return React.createElement(
//         "p",
//         null,
//         "The logged in user is: ",
//         username
//     );
// };
// Username.displayName = "Username";
