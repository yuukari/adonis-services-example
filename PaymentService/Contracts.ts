export interface InitPaymentParameters {
    orderId: number,
    amount: number,
    description: string
    
    companyId: number
}

export interface InitPaymentResult {
    id: number,
    signature: string,
    url: string
}

export enum PaymentType {
    COMPANY_BALANCE_DEPOSIT = 'company_balance_deposit'
}

export enum PaymentStatus {
    CREATED = 'created',
    PAYED = 'payed',
    EXPIRED = 'expired'
}