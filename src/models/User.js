const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./Task')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) throw new Error("not an email");
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 7,
    validate(value) {
      if (value === "password")
        throw new Error("password cant be password");
    },
  },
  age: {
    type: Number,
    validate(value) {
      if (value < 0) throw new Error("age cant be a negative number");
    },
  },
  tokens: [{
    token:{
      type: String,
      reuired: true
    }
  }],
  avatar: {
    type: Buffer
  }
},{
  timestamps: true
})

userSchema.virtual('tasks',{
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

userSchema.methods.toJSON = function (){
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar
  return userObject
}

userSchema.methods.createToken = async function (){
  const user = this
  const token = jwt.sign({_id: user._id.toString()},process.env.JWT_SECRETS)
  user.tokens = user.tokens.concat({token})
  await user.save()
  return token;
}

userSchema.statics.checkCredentials = async (email, password) => {
  const user = await User.findOne({
    email
  })
  if (!user) {
    throw new Error('unable to login')
  }
  const isUser = await bcryptjs.compare(password,user.password)

  if (!isUser) {
    throw new Error('unable to login')
  }
  return user
}

userSchema.pre('save', async function(next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcryptjs.hash(user.password, 8)
  }
  next()
})

userSchema.pre('remove', async function(next) {
  const user = this
  await Task.deleteMany({owner: user._id})
  next()
})

const User = mongoose.model("User", userSchema)

module.exports = User
