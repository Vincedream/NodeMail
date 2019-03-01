
## 写在前面


自从用邮箱注册了很多账号后，便会收到诸如以下类似的邮件,刚开始还以为是一张图片，后来仔细一看不是图片呀，好像还是HTML呀，于是好奇宝宝我Google一下，查阅多篇资料后总结出怎么用前端知识和Node做一个这样的“邮件网页”。

![image](http://blogpic.vince.xin/CF951178-3DFD-43D6-9A68-9DBD2706C98B.png)



## 确认主题
知道怎么实现功能后，思考着我该写什么主题呢，用一个HTML模板随便给小伙伴们发个邮件炫个技？不行，作为一个很cool的程序员怎么能这么low呢，最近天气变化幅度大，温度捉摸不定，女朋友总是抱怨穿少了又冷穿多了又热，嗨呀，要不我就写个每天定时给宝宝发送天气预报的邮件，另外想起宝宝喜欢看ONE·一个这个APP上的每日更新，要不发天气预报的同时，再附赠一个“ONE的每日订阅”？机智又浪漫，开始搬砖～

## 剧透

本来是想最后放效果图的，怕你们看到一半就没兴趣了，就在前面剧透一下我最后做出来的效果图吧～

![image](http://blogpic.vince.xin/2C971663-4C02-4CDD-8E13-1C71B8170EB4.png)

## 待解决的问题
**1. 如何获取天气预报和ONE上的data？**

答：获取data有两种方法，第一种方法是获取天气预报和ONE的API，第二种是用node爬虫获取天气预报和ONE网页的信息。后来找了下，发现ONE并没有API接口，为了让两者统一，于是决定使用node上的一个插件叫`cheerio`,配合`superagent`能够很方便地爬取网页上的信息。

**2. 如何做出HTML的这种邮件？**

答：之前学过一段时间的express这个框架，接触到模版引擎这个概念，传入data便可获得html文件，再结合node的fs模块，获取到这个html文件，便可以结合node的邮件插件发送HTML邮件啦！

**3. 如何用node发送邮件？**

感谢无私的开源开发者，开发了一款发送邮件的Node插件`nodemailer`,兼容主流的Email厂商，只需要配置好邮箱账号和smtp授权码，便可以用你的邮箱账号在node脚本上发文件，很cool有没有～

**4. 如何做到每日定时发送？**

其实可以通过各种hack的方式写这么一个定时任务，但是既然node社区有这个定时的轮子，那我们直接用就好了，`node-schedule`是一个有着各种配置的定时任务发生器，可以定时每个月、每个礼拜、每天具体什么时候执行什么任务，这正符合每天早晨定时给宝宝发送邮件的需求。

**一切准备就绪，开始做一次浪漫的程序员**

## 编写代码
### 网页爬虫
这里我们使用到`superagent`和`cheerio`组合来实现爬虫：

- 分析网页DOM结构，如下图所示：

![image](http://blogpic.vince.xin/B7509558-D988-4818-8969-77FE5028882A.png)

- 用superagent来获取指定网页的所有DOM：

``` javascript
superagent.get(URL).end(function(err,res){
    //
}
```
- 用cheerio来筛选superagent获取到的DOM，取出需要的DOM

``` javascript
imgUrl:$(todayOne).find('.fp-one-imagen').attr('src'),
type:$(todayOne).find('.fp-one-imagen-footer').text().replace(/(^\s*)|(\s*$)/g, ""),
text:$(todayOne).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, "")
```
**以下就是爬取ONE的代码，天气预报网页也是一个道理：**

``` javascript
const superagent = require('superagent'); //发送网络请求获取DOM
const cheerio = require('cheerio'); //能够像Jquery一样方便获取DOM节点

const OneUrl = "http://wufazhuce.com/"; //ONE的web版网站

superagent.get(OneUrl).end(function(err,res){
    if(err){
       console.log(err);
    }
    let $ = cheerio.load(res.text);
    let selectItem=$('#carousel-one .carousel-inner .item');
    let todayOne=selectItem[0]; //获取轮播图第一个页面，也就是当天更新的内容
    let todayOneData={  //保存到一个json中
        imgUrl:$(todayOne).find('.fp-one-imagen').attr('src'),
        type:$(todayOne).find('.fp-one-imagen-footer').text().replace(/(^\s*)|(\s*$)/g, ""),
        text:$(todayOne).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, "")
    };
    console.log(todayOneData);
})
```

### EJS模版引擎生成HTML
通过爬虫获取到了数据,那么我们就能够通过将date输入到EJS渲染出HTML，我们在目录下创建js脚本和ejs模版文件：

- app.js

``` javascript
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

```

- mail.ejs

``` javascript
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <h1>
        <%= title %>
    </h1>
</body>
</html>
```

### 用Node发送邮件
这里我们可以发送纯text也可以发送html，注意的是邮箱密码不是你登录邮箱的密码，而是smtp授权码，什么是smtp授权码呢？就是你的邮箱账号可以使用这个smtp授权码在别的地方发邮件，一般smtp授权码在邮箱官网的设置中可以看的到，设置如下注释。

``` javascript
const nodemailer = require('nodemailer'); //发送邮件的node插件

let transporter = nodemailer.createTransport({
    service: '126', // 发送者的邮箱厂商，支持列表：https://nodemailer.com/smtp/well-known/
    port: 465, // SMTP 端口
    secureConnection: true, // SSL安全链接
    auth: {   //发送者的账户密码
      user: '账户@126.com', //账户
      pass: 'smtp授权码', //smtp授权码，到邮箱设置下获取
    }
  });

let mailOptions = {
    from: '"发送者昵称" <地址@126.com>', // 发送者昵称和地址
    to: 'like@vince.studio', // 接收者的邮箱地址
    subject: '一封暖暖的小邮件', // 邮件主题
    text: 'test mail',  //邮件的text
    // html: html  //也可以用html发送  
  };
  
//发送邮件
transporter.sendMail(mailOptions, (error, info) => {  
    if (error) {
    return console.log(error);
    }
    console.log('邮件发送成功 ID：', info.messageId);
});  
```
### Node定时执行任务
这里我们用到了`node-schedule`来定时执行任务，示例如下：


``` javascript
var schedule = require("node-schedule");  

//1. 确定的时间执行
var date = new Date(2017,12,10,15,50,0);  
schedule.scheduleJob(date, function(){  
   console.log("执行任务");
});

//2. 秒为单位执行 
//比如:每5秒执行一次
var rule1     = new schedule.RecurrenceRule();  
var times1    = [1,6,11,16,21,26,31,36,41,46,51,56];  
rule1.second  = times1;  
schedule.scheduleJob(rule1, function(){
    console.log("执行任务");    
});

//3.以分为单位执行
//比如:每5分种执行一次
var rule2     = new schedule.RecurrenceRule();  
var times2    = [1,6,11,16,21,26,31,36,41,46,51,56];  
rule2.minute  = times2;  
schedule.scheduleJob(rule2, function(){  
    console.log("执行任务");    
});  

//4.以天单位执行
//比如:每天6点30分执行
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 6;
rule.minute =30;
var j = schedule.scheduleJob(rule, function(){
 　　　　console.log("执行任务");
        getData();
});
```

## 思路与步骤

当所有的问题都解决后，便是开始结合代码成一段完整的程序，思路很简单，我们来逐步分析：
1. 由于获取数据是异步的，并且不能判断出哪个先获取到数据，这个是可以将获取数据的函数封装成一个Promise对象，最后在一起用Promise.all来判断所有数据获取完毕，再发送邮件

``` javascript
// 其中一个数据获取函数，其他的也是类似
function getOneData(){
    let p = new Promise(function(resolve,reject){
        superagent.get(OneUrl).end(function(err, res) {
            if (err) {
                reject(err);
            }
            let $ = cheerio.load(res.text);
            let selectItem = $("#carousel-one .carousel-inner .item");
            let todayOne = selectItem[0];
            let todayOneData = {
              imgUrl: $(todayOne)
                .find(".fp-one-imagen")
                .attr("src"),
              type: $(todayOne)
                .find(".fp-one-imagen-footer")
                .text()
                .replace(/(^\s*)|(\s*$)/g, ""),
              text: $(todayOne)
                .find(".fp-one-cita")
                .text()
                .replace(/(^\s*)|(\s*$)/g, "")
            };
            resolve(todayOneData)
          });
    })
    return p
}

```
2. 将爬取数据统一处理，作为EJS的参数，发送邮件模板。

``` javascript

function getAllDataAndSendMail(){
    let HtmlData = {};
    // how long with
    let today = new Date();
    let initDay = new Date(startDay);
    let lastDay = Math.floor((today - initDay) / 1000 / 60 / 60 / 24);
    let todaystr =
      today.getFullYear() +
      " / " +
      (today.getMonth() + 1) +
      " / " +
      today.getDate();
    HtmlData["lastDay"] = lastDay;
    HtmlData["todaystr"] = todaystr;

    Promise.all([getOneData(),getWeatherTips(),getWeatherData()]).then(
        function(data){
            HtmlData["todayOneData"] = data[0];
            HtmlData["weatherTip"] = data[1];
            HtmlData["threeDaysData"] = data[2];
            sendMail(HtmlData)
        }
    ).catch(function(err){
        getAllDataAndSendMail() //再次获取
        console.log('获取数据失败： ',err);
    })
}

```
3. 发送邮件具体代码

``` javascript

function sendMail(HtmlData) {
    const template = ejs.compile(
      fs.readFileSync(path.resolve(__dirname, "email.ejs"), "utf8")
    );
    const html = template(HtmlData);
  
    let transporter = nodemailer.createTransport({
      service: EmianService,
      port: 465,
      secureConnection: true,
      auth: EamilAuth
    });
  
    let mailOptions = {
      from: EmailFrom,
      to: EmailTo,
      subject: EmailSubject,
      html: html
    };
    transporter.sendMail(mailOptions, (error, info={}) => {
      if (error) {
        console.log(error);
        sendMail(HtmlData); //再次发送
      }
      console.log("Message sent: %s", info.messageId);
    });
  }
```


## 安装与使用
如果你觉得这封邮件的内容适合你发送的对象，可以按照以下步骤，改少量参数即可运行程序；

1. git clone https://github.com/Vincedream/NodeMail
2. 打开main.js，修改配置项

``` javascript
//纪念日
let startDay = "2016/6/24";

//当地拼音,需要在下面的墨迹天气url确认
const local = "zhejiang/hangzhou";

//发送者邮箱厂家
let EmianService = "163";
//发送者邮箱账户SMTP授权码
let EamilAuth = {
  user: "xxxxxx@163.com",
  pass: "xxxxxx"
};
//发送者昵称与邮箱地址
let EmailFrom = '"name" <xxxxxx@163.com>';

//接收者邮箱地
let EmailTo = "like@vince.studio";
//邮件主题
let EmailSubject = "一封暖暖的小邮件";

//每日发送时间
let EmailHour = 6;
let EmialMinminute= 30;
```
3. 终端输入`npm install`安装依赖，再输入`node main.js`，运行脚本，当然你的电脑不可能不休眠，建议你部署到你的云服务器上运行。


## 最后
冬天到了，是不是也该用程序员的专业知识给身边的人带来一些温暖呢，源代码与demo已经放到github上，要不试一试？

GitHub：[https://github.com/Vincedream/NodeMail](https://github.com/Vincedream/NodeMail)