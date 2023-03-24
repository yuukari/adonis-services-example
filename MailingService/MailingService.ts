import View from "@ioc:Adonis/Core/View";
import Route from "@ioc:Adonis/Core/Route";
import Env from "@ioc:Adonis/Core/Env";
import { DateTime } from "luxon";

import MailingAPI from "./MailingAPI";

import { CreateMailingContext, CreateMailingResult, MailingSendStatus, MailingType } from "./Contracts";
import { MailingStatus } from "Contracts/enums";
import { formatMoney } from "App/Helpers/Helpers";

import Company from "App/Models/Company";
import Mailing from "App/Models/Mailing";
import Setting from "App/Models/Setting";

import { NotEnoughMoneyMailingError } from "./Exceptions";

export default class MailingService {
    private defaultText = 'Недавно вы посещали компанию {company_name}. Мы будем очень рады, если вы оставите отзыв о нас: {link}';
    private templateText = 'Здравствуйте, {name}! Недавно вы посещали компанию {company_name}. Мы будем очень рады, если вы оставите отзыв о нас: {link}';

    public async create(company: Company, ctx: CreateMailingContext): Promise<CreateMailingResult>{
        const mailingLink = Route.builder()
            .params([company.id])
            .make('mailing.index');

        const text = (ctx.type == MailingType.DEFAULT ? this.defaultText : this.templateText)
            .replace('{company_name}', company.name)
            .replace('{link}', `https://${Env.get('APP_DOMAIN')}${mailingLink}`);

        const campaignID = await MailingAPI.createCampaign({
            name: `Рассылка ${View.GLOBALS.excerpt(company.name, 30, { suffix: '' })} от ${DateTime.now().toFormat('dd.MM.yyyy HH:mm')}`,
            text,
            type: ctx.type,

            from: null
        });

        company.related('mailingMeta').updateOrCreate({ companyId: company.id }, {
            lastNumbers: '[]',
            yandexCompanyLink: ctx.meta.yandexCompanyLink,
            dgisCompanyLink: ctx.meta.dgisCompanyLink
        });

        const mailing = await Mailing.create({
            campaignId: campaignID,
            companyId: company.id,

            text,
            type: ctx.type,

            meta: JSON.stringify({
                recipients: ctx.recipients,
                yandexCompanyLink: ctx.meta.yandexCompanyLink,
                dgisCompanyLink: ctx.meta.dgisCompanyLink
            })
        });

        // Добавляем получателей в рассылку
        await MailingAPI.addRecipientsToCampaign(campaignID, ctx.recipients);

        // Получаем итоговую стоимость рассылки
        const campaignInfo = await MailingAPI.getCampaignInfo(campaignID);

        // Добавляем наценку на рассылку
        const settings = await Setting.first();
        const totalCost = Math.round(campaignInfo.counters.totalCost) + (campaignInfo.counters.totalCost % 1) + settings!.mailingMargin;

        mailing.cost = totalCost;
        await mailing.save();

        return {
            id: mailing.id,
            cost: totalCost,
            costFormatted: formatMoney(totalCost)
        }
    }

    public async send(company: Company, mailing: Mailing): Promise<MailingSendStatus>{
        // Проверка средств на балансе компании
        if (mailing.cost! > company.balance)
            throw new NotEnoughMoneyMailingError();

        // Получаем ID компании рассылки и используем ее в запросе к API
        const campaignID = mailing.campaignId;
        const campaignStatus = await MailingAPI.sendCampaign(campaignID);

        // Если все успешно, списываем сумму с баланса компании
        company.balance -= mailing.cost!;
        await company.save();

        mailing.status = campaignStatus == MailingSendStatus.MODERATION ? MailingStatus.MODERATION : MailingStatus.PROCESSING;
        await mailing.save();

        return campaignStatus;
    }
}