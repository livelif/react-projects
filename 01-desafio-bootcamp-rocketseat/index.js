const express = require('express');
const server = express();
server.use(express.json())


const projects = [];
var requisitionCount = 0;

function countRequest(req, res, next) {
  console.log(requisitionCount++);
  return next();
}

function checkIdInArray(req, res, next) {
  const project = projects[req.params.id];
  if (!project) {
    return res.status(400).json({error: 'Project does not exist'})
  }
  console.log("project exist");
  return next();
}


server.post('/projects', countRequest, (req, res) => {
  const {id} = req.body;
  const {title} = req.body;
  const {tasks} = req.body;
  const project = {"id":id, "title":title, "tasks":tasks};
  projects.push(project);
  return res.json(projects);
});

server.get('/projects', countRequest, (req, res) => {
  return res.json(projects);
});

server.delete('/projects/:id', countRequest, checkIdInArray, (req, res) => {
  const {id} = req.params;
  projects.splice(id, 1);
  res.send();
});

server.put('/projects/:id', countRequest, checkIdInArray, (req, res) => {
  const {id} = req.params;
  const updatedTitle = req.body.title; 
  projects[id].title = updatedTitle;
  res.json(projects[id]);
});

server.post('/projects/:id/tasks', countRequest, checkIdInArray, (req, res) => {
  const {id} = req.params;
  const titleNewTask = req.body.title;
  addTask(id, titleNewTask);
  res.json(projects[id]);
});

function addTask(idProject, newTask) {
  projects[idProject].tasks.push(newTask);
  console.log('new task added');
}


server.listen(3000);