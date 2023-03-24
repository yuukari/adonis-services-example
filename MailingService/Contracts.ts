/* Common */

export enum MailingType {
    DEFAULT = 'default',
    TEMPLATE = 'template'
}

export enum MailingSendStatus {
    PROCESSING = 'processing',
    MODERATION = 'moderation'
}

/* Service */

export type MailingRecipient = {
    phone: string,
    meta: any | null
}

export interface CreateMailingContext {
    recipients: MailingRecipient[],
    type: MailingType,
    meta: {
        yandexCompanyLink: string | null,
        dgisCompanyLink: string | null
    }
}

export interface CreateMailingResult {
    id: number,
    cost: number,
    costFormatted: string
}

/* API */

export interface CreateCampaignParameters {
    name: string,
    type: MailingType,
    text: string,
    from: string | null
}

export interface CampaignInfoResponse {
    name: string,
    type: MailingType,
    text: string,
    from: string,
    counters: {
        totalMsgNum: number,
        totalCost: number
    }
}