export class MailingApiHttpError extends Error {
    private response: any;

    constructor(response) {
		super(`Request to Mailing API failed: HTTP error ${response.status} - ${response.statusText}`);
		this.response = response;
	}
}

export class MailingApiError extends Error {
	constructor(jsonResponse){
		super(`Request to API failed: service error ${jsonResponse.code} - ${JSON.stringify(jsonResponse.message)}`);
	}
}

export class MailingServiceError extends Error {
	constructor(...args: any){
		super(...args);
	}
}

export class NotEnoughMoneyMailingError extends Error {
	constructor(...args: any){
		super(...args);
	}
}