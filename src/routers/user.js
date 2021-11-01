const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth")
const {
  sendWelcomeMail,
  sendCancelingMail
} = require("../email/account")
const sharp = require('sharp')
const multer = require('multer')
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error('please upload correct format !'))
    }
    cb(undefined, true)
  }
})

const router = new express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.createToken()
    sendWelcomeMail(user.email, user.name)
    res.status(201).send({
      user,
      token
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.checkCredentials(req.body.email, req.body.password)
    const token = await user.createToken()
    res.send({
      user,
      token
    })
  } catch (e) {
    res.status(400).send(e)
  }
})

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user)
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = await sharp(req.file.buffer).resize({
    width: 250,
    height: 250
  }).png().toBuffer()
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({
    error: error.message
  })
})

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const validUpdates = ["name", "email", "password", "age"];
  const isValidUpdate = updates.every((update) =>
    validUpdates.includes(update)
  );

  if (!isValidUpdate)
    return res.status(400).send({
      error: "invalid updates ! ",
    });
  try {
    const user = req.user
    updates.forEach((update) => {
      user[update] = req.body[update]
    })
    await user.save()
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancelingMail(req.user.email, req.user.name)
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) throw new Error()

    res.set('content-type', 'image/png')
    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
})

module.exports = router;
