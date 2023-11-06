import { ChatGPTClient } from "@waylaidwanderer/chatgpt-api";
import config from "./config.js";
import { FileBox }  from 'file-box';
import OpenAI from "openai";

const clientOptions = {
  // (Optional) Support for a reverse proxy for the completions endpoint (private API server).
  // Warning: This will expose your `openaiApiKey` to a third party. Consider the risks before using this.
  // reverseProxyUrl: "",
  // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
  modelOptions: {
    // You can override the model name and any other parameters here, like so:
    model: "gpt-3-turbo-16k",
    // I'm overriding the temperature to 0 here for demonstration purposes, but you shouldn't need to override this
    // for normal usage.
    temperature: 0.5,
    // Set max_tokens here to override the default max_tokens of 1000 for the completion.
    // max_tokens: 1000,
  },
  // (Optional) Davinci models have a max context length of 4097 tokens, but you may need to change this for other models.
  // maxContextTokens: 4097,
  // (Optional) You might want to lower this to save money if using a paid model like `text-davinci-003`.
  // Earlier messages will be dropped until the prompt is within the limit.
  // maxPromptTokens: 3097,
  // (Optional) Set custom instructions instead of "You are ChatGPT...".
  // promptPrefix: 'You are Bob, a cowboy in Western times...',
  // (Optional) Set a custom name for the user
  // userLabel: 'User',
  // (Optional) Set a custom name for ChatGPT
  // chatGptLabel: 'ChatGPT',
  // (Optional) Set to true to enable `console.debug()` logging
  debug: false,
};

const cacheOptions = {
  // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
  // This is used for storing conversations, and supports additional drivers (conversations are stored in memory by default)
  // For example, to use a JSON file (`npm i keyv-file`) as a database:
  // store: new KeyvFile({ filename: 'cache.json' }),
};

export default class ChatGPT {
  private chatGPT: any;
  private chatOption: any;
  constructor() {
    this.chatGPT = new ChatGPTClient(
      config.OPENAI_API_KEY,
      {
        ...clientOptions,
        reverseProxyUrl: config.reverseProxyUrl,
      },
      cacheOptions
    );
    this.chatOption = {};
    // this.test();
  }

  async test() {
    const response = await this.chatGPT.sendMessage("hello");
    console.log("response test: ", response);
  }

  async getChatGPTReply(content, contactId) {
    const data = await this.chatGPT.sendMessage(
      content,
      this.chatOption[contactId]
    );

    const { response, conversationId, messageId } = data;
    this.chatOption = {
      [contactId]: {
        conversationId,
        parentMessageId: messageId,
      },
    };
    console.log("response: ", response);
    // response is a markdown-formatted string
    return response;
  }

  // openai = new OpenAI();
  // async getDallEImage(content) {
  //   try {
  //     const response = await this.openai.images.generate({
  //       prompt: content,
  //     });
  //     const image_url = response.data[0].url;
  //     // const image = await this.chatGPT.images.generate({ prompt: content });
  //     console.log("image created");
  //     return image_url;
  //   } catch (error) {
  //     console.log("error:", error);
  //     throw error; // Optionally, re-throw the error to handle it further upstream
  //   }
  // }
  openai = new OpenAI({
    apiKey: "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"
  });
  async getDallEImage(content) {
    const image = await this.openai.images.generate({
      prompt: content,
    });
    const url = image.data[0].url;
    console.log("image_url: ", url);
    return url;
  }

  async replyMessage(contact, content) {
    const { id: contactId } = contact;
    try {
      if (
        content.trim().toLocaleLowerCase() ===
        config.resetKey.toLocaleLowerCase()
      ) {
        this.chatOption = {
          ...this.chatOption,
          [contactId]: {},
        };
        await contact.say("对话已被重置");
        return;
      }
      const message = await this.getChatGPTReply(content, contactId);
      // const image_url = await this.getDallEImage(content);
      if (
        (contact.topic && contact?.topic() && config.groupReplyMode) ||
        (!contact.topic && config.privateReplyMode)
      ) {
        // const result = "你的问题:\n" + content + "\n-----------\n" + "机器🐻:\n" + message;
        const result = message;
        await contact.say(result);
        // if (typeof image_url === 'string') {
        //   const fileBox = FileBox.fromUrl(image_url);
        //   await contact.say(fileBox);
        // } else {
        //   // Handle the case where image_url is not a valid URL.
        //   console.error('image_url is not a valid URL');
        // }
        return;
      } else {
        const result = message;
        await contact.say(result);
        // if (typeof image_url === 'string') {
        //   const fileBox = FileBox.fromUrl(image_url);
        //   await contact.say(fileBox);
        // } else {
        //   // Handle the case where image_url is not a valid URL.
        //   console.error('image_url is not a valid URL');
        // }
      }
    } catch (e: any) {
      console.error(e);
      if (e.message.includes("timed out")) {
        await contact.say(
          content +
            "\n-----------\nERROR: Please try again, ChatGPT timed out for waiting response."
        );
      }
      if (e.message.includes("internal_error")) {
        await contact.say(
          content +
            "\n-----------\nERROR: Please try again later, ChatGPT is experiencing internal server error."
        );
      }
    }
  }

}
