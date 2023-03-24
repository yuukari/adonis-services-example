import Env from '@ioc:Adonis/Core/Env';

import md5 from "md5";
import random from 'random';
import { PaymentServiceError } from './Exceptions';

export function generateSalt(): string {
    return md5(random.int(0, 999999).toString());
}

export function signRequest(method: string, body: URLSearchParams): string {
    const signatureArray: string[] = [];
    const bodyKeys: string[] = [];

    for (const key of body.keys()){
        bodyKeys.push(key);
    }

    signatureArray.push(method);
    bodyKeys.sort().forEach((key) => {
        if (key != 'pg_sig')
            signatureArray.push(body.get(key)!);
    });

    return md5(signatureArray.join(';') + ';' + Env.get('MERCHANT_SECRET'));
}

export function checkSignature(requestFields){
    const signatureArray: string[] = [];

    signatureArray.push('callback');
    Object.keys(requestFields).sort().forEach((key) => {
        if (key != 'pg_sig')
            signatureArray.push(requestFields[key]);
    });

    const signature = md5(signatureArray.join(';') + ';' + Env.get('MERCHANT_SECRET'));

    if (signature != requestFields['pg_sig'])
        throw new PaymentServiceError('Wrong payment signature');
}