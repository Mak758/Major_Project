class ExpressError extends Error {
constructor(message, statusCode) {
super(message);
this.statusCode = statusCode;
this.name = "ExpressError";
}
}

module.exports = ExpressError;
