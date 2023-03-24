import PaymentAPI from "./PaymentAPI";

import Company from "App/Models/Company";
import Payment from "App/Models/Payment";
import PaymentError from "App/Models/PaymentError";

import { checkSignature } from "./Helpers";
import { PaymentStatus } from "./Contracts";


export default class PaymentService {
    public async create(company: Company, amount: number){
        const payment = await Payment.create({
            amount,
            meta: JSON.stringify({
                company_id: company.id
            })
        });

        const result = await PaymentAPI.initPayment({
            orderId: payment.id,
            amount,
            description: 'Пополнение баланса для рассылки сообщений',

            companyId: company.id
        });

        return result.url;
    }

    public async processCallback(callbackData){
        checkSignature(callbackData);

        const payment = await Payment.findOrFail(callbackData.pg_order_id);
        const paymentMeta = JSON.parse(payment.meta);

        if (payment.status != PaymentStatus.CREATED)
            return;

        payment.status = PaymentStatus.PAYED;
        await payment.save();

        const company = await Company.findOrFail(paymentMeta.company_id);
        company.balance += parseInt(callbackData.pg_amount);
        await company.save();
    }

    public async logError(orderId: number, error: Error){
        await PaymentError.create({
            paymentId: orderId,
            message: error.message,
            name: error.name,
            stack: error.stack
        });
    }
}