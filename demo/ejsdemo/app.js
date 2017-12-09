const ejs = require('ejs'); //ejs模版引擎
const fs  = require('fs'); //文件读写
const path = require('path'); //路径配置

//传给EJS的数据
let data={
    title:'nice to meet you~'
}

//将目录下的mail.ejs获取到，得到一个模版
const template = ejs.compile(fs.readFileSync(path.resolve(__dirname, 'mail.ejs'), 'utf8'));
//将数据传入模版中，生成HTML
const html = template(data);

console.log(html)
