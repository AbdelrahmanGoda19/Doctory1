import nodemailer from "nodemailer"

const send_email =async ({to , html })=>{

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:{   // الجهة الى هتبعت
        user: process.env.SMTP_USER,
pass: process.env.SMTP_PASS
    }


})

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are missing. Set SMTP_USER and SMTP_PASS in .env")
}

const info = await transport.sendMail({
    from : process.env.EMAIL_FROM || process.env.SMTP_USER ,
    to ,
    subject :"Verify Your Email In Doctory " ,
    html 
})
 

return info.rejected.length==0? true :false

}

export default send_email