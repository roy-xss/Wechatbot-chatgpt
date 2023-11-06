import OpenAI from "openai";
export default class ChatGPT {
    private chatGPT;
    private chatOption;
    constructor();
    test(): Promise<void>;
    getChatGPTReply(content: any, contactId: any): Promise<any>;
    openai: OpenAI;
    getDallEImage(content: any): Promise<string | undefined>;
    replyMessage(contact: any, content: any): Promise<void>;
}
