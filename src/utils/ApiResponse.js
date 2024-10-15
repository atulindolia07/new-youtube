class ApiResponse {
    constructor(
        statusCode,
        data,
        message="Success"
    ){
        this.message = message
        this.success = true
        this.statusCode = statusCode
        this.data = data
    }
}

export {ApiResponse}