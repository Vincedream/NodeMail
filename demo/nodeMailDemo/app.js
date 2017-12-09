const nodemailer = require('nodemailer'); //发送邮件的node插件

let transporter = nodemailer.createTransport({
    service: '126', // 发送者的邮箱厂商，支持列表：https://nodemailer.com/smtp/well-known/
    port: 465, // SMTP 端口
    secureConnection: true, // SSL安全链接
    auth: {   //发送者的账户密码
      user: 'artistcoder@126.com', //账户
      pass: 'huajinbo1997', //smtp授权码，到邮箱设置下获取
    }
  });

let mailOptions = {
    from: '"vince" <artistcoder@126.com>', // 发送者昵称和地址
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