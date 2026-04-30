import joi from "joi"
const vaild_schema = (schema)=>{

return (req, res,next)=>{

    const result = schema.validate(req.body , {abortEarly:false}) // حتى القبول لو مش موجود 

if (result.error){

    const messagelist = result.error.details.map((ele)=>ele.message)
    return next(new Error (messagelist , {cause:500}))
}

return next()

}


}


export default vaild_schema