export class PaymentApiHttpError extends Error {
    private response: any;

    constructor(response) {
		super(`Request to API failed: HTTP error ${response.status} - ${response.statusText}`);
		this.response = response;
	}
}

export class PaymentApiError extends Error {
	constructor(jsonResponse){
		super(`Request to API failed: service error ${jsonResponse.pg_error_code} - ${jsonResponse.pg_error_description}`);
	}
}

export class PaymentServiceError extends Error {
	constructor(...args: any){
		super(...args);
	}
}