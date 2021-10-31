const mongoose = require("mongoose");

try{
  mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
  });
}catch(e){
  res.send(e)
}
