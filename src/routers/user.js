const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth")
const {
  sendWelcomeMail,
  sendCancelingMail
} = require("../email/account")

const router = new express.Router();

router.route('/api/v1/users')
.post(async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.createToken()
    //sendWelcomeMail(user.email, user.name)
    res.status(201).send({
      user,
      token
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.route('/api/v1/users/login').post(async (req, res) => {
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

router.route('/api/v1/users/logout').post(auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.route('/api/v1/users/logoutAll').post( auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

router.route('/api/v1/users/me')
.patch(auth, async (req, res) => {
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
}).delete(auth, async (req, res) => {
  try {
    const user = req.user
    await user.remove()
    sendCancelingMail(user.email, user.name)
    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
}).get(auth, async (req, res) => {
  res.send(req.user)
});

module.exports = router;
