const code = `
    class Main extends React.Component{
     shouldComponentUpdate(){
       if(true){
         return true;
       }else{
        return false;
       }
     }
     render(){
       if(true){
         return "hello";
       }else{
        return "bye";
       }
     }
    }
`;
const newPlugin = require("../src/index");
  var babel = require('babel-core');
  var out = babel.transform(code, {
    // "babel-preset-es2015","babel-preset-react","babel-preset-stage-0"
    presets:[],
    plugins: [newPlugin]
  });
console.log('out---',out.code);
