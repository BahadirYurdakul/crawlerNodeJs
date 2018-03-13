//@flow

export default class ErrorWithCode extends Error {
    code : number;

    constructor(errMessage: string, code : number) {
        super(errMessage);
        this.code = code;
    }
}