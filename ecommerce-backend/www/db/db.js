// let dataAPI;
// const mode=process.env.NODE_ENV;
require('dotenv').config();
const mongoose=require('mongoose');
const server=require('../rest/server');

const startDB=(app)=>{
      try{
        mongoose.connect(process.env.MONGO_URL);
        mongoose.connection.on('error',(err)=>{
            console.log(`database error :${err}`)
        })
        mongoose.connection.on('open',(err)=>{
            if(err)
            {
                console.log(`database error:${JSON.stringify(err)}`)
                process.exit(1)
            }
            else
            {
                console.log(`database connection succsss for Ecommerce.`)
                server.startServer(app)
            }
        })
    }catch(err)
    {
        console.log(`Database connection open Error :${err}`)
    }
  

}
mongoose.set('debug',true)

module.exports={
    startDB:startDB
}