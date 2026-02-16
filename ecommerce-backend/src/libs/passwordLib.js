const bcrypt = require('bcryptjs')

const getHashed = async(password)=>{
  const salt = await bcrypt.genSalt(10); 
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

const passwordVerify = async(password,hash)=>{
    return bcrypt.compare(password,hash)
}


module.exports = {
    getHashed:getHashed,
    passwordVerify:passwordVerify
}