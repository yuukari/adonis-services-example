import Env from '@ioc:Adonis/Core/Env';
import fetch from "node-fetch";

import { CampaignInfoResponse, CreateCampaignParameters, MailingType, MailingRecipient, MailingSendStatus } from './Contracts';
import { MailingApiError, MailingApiHttpError } from './Exceptions';

export default class MailingAPI {
    public static async createCampaign(params: CreateCampaignParameters): Promise<number>{
        const body = new URLSearchParams();

        body.append('data[name]', params.name);
        body.append('data[text]', params.text);
        body.append('data[type]', (params.type == MailingType.TEMPLATE ? 3 : 2).toString());

        if (params.from != null)
            body.append('data[from]', params.from);

        const response = await this.makeRequest('Campaign/Create', 'POST', body);
        return response;
    }

    public static async addRecipientsToCampaign(id: number, recipients: MailingRecipient[]){
        const body = new URLSearchParams();

        body.append('id', id.toString());

        for (const i in recipients){
            const recipient = recipients[i];

            body.append(`recipients[${i}][recipient]`, recipient.phone);

            if (recipient.meta != null && recipient.meta.name != undefined)
                body.append(`recipients[${i}][name]`, recipient.meta.name);
        }

        await this.makeRequest('Campaign/AddRecipients', 'POST', body);
    }

    public static async getCampaignInfo(id: number): Promise<CampaignInfoResponse>{
        const body = new URLSearchParams();

        body.append('id', id.toString());

        const response = await this.makeRequest('Campaign/GetInfo', 'POST', body);
        
        return {
            name: response.name,
            text: response.text,
            type: response.type == 3 ? MailingType.TEMPLATE : MailingType.DEFAULT,
            from: response.from,

            counters: {
                totalMsgNum: response.counters.totalMsgNum,
                totalCost: response.counters.totalCost
            }
        }
    }

    public static async sendCampaign(id: number): Promise<MailingSendStatus>{
        const body = new URLSearchParams();

        body.append('id', id.toString());

        const response = await this.makeRequest('Campaign/Send', 'POST', body);

        return response == 0 ? MailingSendStatus.PROCESSING : MailingSendStatus.MODERATION;
    }

    private static async makeRequest(path: string, method: 'GET' | 'POST', body: URLSearchParams){
        const response = await fetch(`https://api.mobizon.kz/service/${path}?output=json&apiKey=${Env.get('MAILING_API_KEY')}`, {
            method,
            body
        });

        if (!response.ok)
            throw new MailingApiHttpError(response);

        const json = await response.json();

        if (json.code != 0)
            throw new MailingApiError(json);

        return json.data;
    }
}