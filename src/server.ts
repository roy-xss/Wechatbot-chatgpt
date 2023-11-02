import express from 'express';
import { WechatyBuilder} from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import config from "./config.js";
import ChatGPT from "./chatgpt.js";


const app = express();
const port = 3000; // You can change the port number as needed

let bot: any = {};
const startTime = new Date();
let chatGPTClient: any = null;

app.get('/', (req, res) => {
  res.send('Wechaty Bot is running!');
});

async function onMessage(msg) {
  // 避免重复发送
  if (msg.date() < startTime) {
    return;
  }
  try {
    const talker = msg.talker();
    const receiver = msg.to();
    const content = msg.text().trim();
    const room = msg.room();
    const alias = (await talker.name()) || (await talker.alias());
    const isText = msg.type() === bot.Message.Type.Text;

    // allow user to use chatgpt
    if (msg.self()) {

    const pattern = RegExp(`^🐻\\s+${config.groupKey}[\\s]*`);
    if (pattern.test(content)) {
      const selfContent = content.replace(pattern, "");
      chatGPTClient.replyMessage(room, selfContent);
      return;
      }
      return;
    }

    if (room && isText) {
      const topic = await room.topic();
      const talker_name = await talker.name();
      console.log(`Group name: ${topic} talker: ${talker_name} content: ${content}`);
      const receiver_name = await receiver.name();
      const pattern = RegExp(`^@(${receiver_name})\\s+${config.groupKey}[\\s]*`);
      if (await msg.mentionSelf()) {
        if (pattern.test(content)) {
          const groupContent = content.replace(pattern, "");
          chatGPTClient.replyMessage(room, groupContent);
          return;
        } else {
          const guide = `usage: @me ${config.groupKey} <your prompt here>`;
          await room.say(guide, talker);
          console.log(
            "Content is not within the scope of the customizition format"
          );
        }
      }
    } else if (isText) {
      console.log(`talker: ${alias} content: ${content}`);
      if (content.startsWith(config.privateKey) || config.privateKey === "") {
        let privateContent = content;
        if (config.privateKey === "") {
          privateContent = content.substring(config.privateKey.length).trim();
        }
        chatGPTClient.replyMessage(talker, privateContent);
      } else {
        const guide = `usage: @me ${config.privateKey} <your prompt here>`;
        msg.say(guide);
        console.log(
          "Content is not within the scope of the customizition format"
        );
      }
    }
  } catch (error) {
    console.log("message-related", error);
    console.trace();
  }

}

function onScan(qrcode) {
  qrcodeTerminal.generate(qrcode, { small: true }); // 在console端显示二维码
  const qrcodeImageUrl = [
    "https://api.qrserver.com/v1/create-qr-code/?data=",
    encodeURIComponent(qrcode),
  ].join("");

  console.log(qrcodeImageUrl);
}

async function onLogin(user) {
  console.log(`${user} has logged in`);
  const date = new Date();
  console.log(`Current time:${date}`);
  // const the_boys = await bot.Room.find({ topic: /^睡觉成功/i});
  // if (the_boys) {
  //   await the_boys.say('ai🐻 启动！');
  // } else {
  //   console.log("Room not found for the specified topic.");
  // }
}

function onLogout(user) {
  console.log(`${user} has logged out`);
}

async function initProject() {
  try {
    chatGPTClient = new ChatGPT();
    bot = WechatyBuilder.build({
      name: "WechatEveryDay",
      puppet: "wechaty-puppet-wechat", // 如果有token，记得更换对应的puppet
      puppetOptions: {
        uos: true,
      },
    });

    bot
      .on("scan", onScan)
      .on("login", onLogin)
      .on("logout", onLogout)
      .on("message", onMessage);

    bot
      .start()
      .then(() => console.log("Start to log in wechat..."))
      .catch((e) => console.error(e));

    /*if (!bot.isLoggedIn()) {
      const the_boys = bot.Room.find({topic: /^睡觉成功/i});
      the_boys.say('🐻冬眠中。。。');
    }*/
  } catch (error) {
    console.log("init error: ", error);
    console.trace();
  }
}

// Start your Wechaty bot when the server starts
initProject();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
