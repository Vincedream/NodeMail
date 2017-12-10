const superagent = require("superagent"); //发送网络请求获取DOM
const cheerio = require("cheerio"); //能够像Jquery一样方便获取DOM节点
const nodemailer = require("nodemailer"); //发送邮件的node插件
const ejs = require("ejs"); //ejs模版引擎
const fs = require("fs"); //文件读写
const path = require("path"); //路径配置
const schedule = require("node-schedule");
//配置项

//纪念日
let startDay = "2016/6/24";

//当地拼音,需要在下面的墨迹天气url确认
const local = "xiangtan";

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


let HtmlData = {};
const OneUrl = "http://wufazhuce.com/";
const WeatherUrl = "https://tianqi.moji.com/weather/china/hunan/" + local;

function getData() {
  //计算在一起多久
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

  superagent.get(OneUrl).end(function(err, res) {
    if (err) {
      console.log(err);
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
    HtmlData["todayOneData"] = todayOneData;
    // console.log(todayOneData)
    checkOver();
  });

  superagent.get(WeatherUrl).end(function(err, res) {
    if (err) {
      console.log(err);
    }
    let threeDaysData = [];
    let weatherTip = "";
    let $ = cheerio.load(res.text);
    $(".wea_tips").each(function(i, elem) {
      weatherTip = $(elem)
        .find("em")
        .text();
    });
    HtmlData["weatherTip"] = weatherTip;
    checkOver();
  });

  superagent.get(WeatherUrl).end(function(err, res) {
    if (err) {
      console.log(err);
    }
    let threeDaysData = [];
    let weatherTip = "";
    let $ = cheerio.load(res.text);
    $(".forecast .days").each(function(i, elem) {
      const SingleDay = $(elem).find("li");
      threeDaysData.push({
        Day: $(SingleDay[0])
          .text()
          .replace(/(^\s*)|(\s*$)/g, ""),
        WeatherImgUrl: $(SingleDay[1])
          .find("img")
          .attr("src"),
        WeatherText: $(SingleDay[1])
          .text()
          .replace(/(^\s*)|(\s*$)/g, ""),
        Temperature: $(SingleDay[2])
          .text()
          .replace(/(^\s*)|(\s*$)/g, ""),
        WindDirection: $(SingleDay[3])
          .find("em")
          .text()
          .replace(/(^\s*)|(\s*$)/g, ""),
        WindLevel: $(SingleDay[3])
          .find("b")
          .text()
          .replace(/(^\s*)|(\s*$)/g, ""),
        Pollution: $(SingleDay[4])
          .text()
          .replace(/(^\s*)|(\s*$)/g, ""),
        PollutionLevel: $(SingleDay[4])
          .find("strong")
          .attr("class")
      });
    });

    HtmlData["threeDaysData"] = threeDaysData;
    checkOver();
  });
}

function checkOver() {
  if (
    HtmlData.todayOneData !== undefined &&
    HtmlData.threeDaysData !== undefined &&
    HtmlData.weatherTip !== undefined
  ) {
    console.log(HtmlData);
    sendMail();
  }
}

function sendMail() {
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
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
      HtmlData = {};
      getData(); //当登录、发送邮件失败，再次执行任务;
    }
    console.log("Message sent: %s", info.messageId);
    HtmlData = {}; //清除数据以便下次再次发送
  });
}

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = EmailHour;
rule.minute = EmialMinminute;
var j = schedule.scheduleJob(rule, function() {
  console.log("执行任务");
  getData();
});
