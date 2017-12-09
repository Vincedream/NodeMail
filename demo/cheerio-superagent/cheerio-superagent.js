const superagent = require('superagent'); //发送网络请求获取DOM
const cheerio = require('cheerio'); //能够像Jquery一样方便获取DOM节点

const OneUrl = "http://wufazhuce.com/"; //ONE的web版网站

superagent.get(OneUrl).end(function(err,res){
    if(err){
       console.log(err);
    }
    let $ = cheerio.load(res.text);
    let selectItem=$('#carousel-one .carousel-inner .item');
    let todayOne=selectItem[0];
    let todayOneData={
        imgUrl:$(todayOne).find('.fp-one-imagen').attr('src'),
        type:$(todayOne).find('.fp-one-imagen-footer').text().replace(/(^\s*)|(\s*$)/g, ""),
        text:$(todayOne).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, "")
    }
    console.log(todayOneData)
})