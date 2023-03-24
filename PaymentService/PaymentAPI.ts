import Env from '@ioc:Adonis/Core/Env';

import fetch from "node-fetch";
import { Parser } from "xml2js";

import { InitPaymentParameters, InitPaymentResult } from "./Contracts";
import { PaymentApiHttpError, PaymentApiError } from './Exceptions';
import { generateSalt, signRequest } from './Helpers';

export default class PaymentAPI {
    public static async initPayment(params: InitPaymentParameters): Promise<InitPaymentResult> {
        const body = new URLSearchParams();

        body.append('pg_order_id', params.orderId.toString());
        body.append('pg_amount', params.amount.toString());
        body.append('pg_description', params.description);
        body.append('pg_param1', params.companyId.toString());

        const response = await this.makeRequest('init_payment.php', body);

        return {
            id: response.pg_payment_id[0],
            signature: response.pg_sig[0],
            url: response.pg_redirect_url[0]
        }
    }

    private static async makeRequest(method: string, body: URLSearchParams){
        body.append('pg_merchant_id', Env.get('MERCHANT_ID').toString());
        body.append('pg_salt', generateSalt());
        body.append('pg_request_method', 'POST');

        body.append('pg_result_url', Env.get('MERCHANT_RESULT_URL'));
        body.append('pg_success_url', Env.get('MERCHANT_SUCCESS_URL'));
        body.append('pg_failure_url', Env.get('MERCHANT_FAIL_URL'));

        body.append('pg_testing_mode', Env.get('MERCHANT_TESTING_MODE') ? '1' : '0');
        body.append('pg_sig', signRequest(method, body));

        const response = await fetch(`https://api.paybox.money/${method}`, {
            method: 'POST',
            body
        });

        if (!response.ok)
            throw new PaymentApiHttpError(response);

        const parser = new Parser();

        const xml = await response.text();
        const parsedXml = await parser.parseStringPromise(xml);

        const jsonResponse = parsedXml.response;

        if (jsonResponse.pg_status[0] == 'error')
            throw new PaymentApiError(jsonResponse);

        return jsonResponse;
    }
}