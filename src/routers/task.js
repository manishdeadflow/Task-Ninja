const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth")

const router = new express.Router();

router.route('/api/v1/tasks')
.post(auth, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      owner: req.user._id
    });
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
}).get(auth, async (req, res) => {
  const match = {}
  const sort = {}
  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }
  if(req.query.sortBy){
    const value = req.query.sortBy.split(':')
    sort[value[0]] = value[1] === 'desc' ? -1 : 1
  }
  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    })
    res.status(200).send(req.user.tasks);
  } catch (e) {
    res.status(404).send(e);
  }
});

router.route('/api/v1/tasks/:id')
.get(auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({
      _id,
      owner: req.user._id
    });
    if (!task) return res.status(404).res.send();
    res.status(200).send(task);
  } catch (e) {
    res.status(404).send(e);
  }
}).patch(auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const validUpdates = ["description", "completed"];
  const isValidUpdate = updates.every((update) =>
    validUpdates.includes(update)
  );

  if (!isValidUpdate)
    return res.status(400).send({
      error: "invalid upadtes !",
    });
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    })

    if (!task) return res.status(404).send();

    updates.forEach((update) => task[update] = req.body[update])
    await task.save()

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
}).delete(auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!task) return res.status(404).send();
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
