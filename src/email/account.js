const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
})

const sendWelcomeMail = (email, name) => {
  transporter.sendMail({
    from: process.env.USER,
    to: email,
    subject: "Thanks for joining us",
    text: `welcome to task manager app ,${name}, I hope you your time here ,and let us know if you like this app`
  })
}

const sendCancelingMail = (email,name) =>{
  transporter.sendMail({
    from: process.enc.USER,
    to: email,
    subject: "Sorry to see you go!",
    text: `Goodbye ,${name}, I hope to see you back sometime again`
  })
}

module.exports = {
  sendWelcomeMail,
  sendCancelingMail
}
