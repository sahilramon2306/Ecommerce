const generate=(success,message,data)=>{
    let response={
        success:success,
        message:message,
        data:data
    }
    return response
}

module.exports={
    generate:generate
}