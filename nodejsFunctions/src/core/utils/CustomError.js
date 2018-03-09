//@flow

export default class CustomError extends Error {
    code : number;

    constructor(errMessage: string, code : number) {
        super(errMessage);
        this.code = code;
    }
}