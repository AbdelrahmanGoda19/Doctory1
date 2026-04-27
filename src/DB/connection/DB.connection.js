import mongoose from "mongoose"

const DBConnection = async(req , res)=>{
    await mongoose.connect(process.env.CONNECTION_STRING).then(res=>{
        console.log('db connected');
        
    }).catch(err=>{console.log('DB CONNECTION ERROR' , err);
    })
}

export default DBConnection