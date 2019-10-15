const express = require('express');

const server = express(); //express exporta uma funcao

server.use(express.json())

//midle
server.use((req, res, next) => {
  console.time('Request')
  console.log(`Metodo: ${req.method}; URL: ${req.url}`);

  next();

  console.timeEnd('Request');
  
});

function checkUsersExists (req, res, next) {
  if (!req.body.name) {
    return res.status(400).json({error: 'User name is required'})
  }

  return next();
}

function checkUserInArray(req, res, next) {
  const user = users[req.params.index];
  if (!user) {
    return res.status(400).json({error: 'User does not exist'})
  }

  req.user = user;

  return next();
}

// Request body
// localhost

const users = ['Diego', 'Claudio', 'Victor'];

// /teste?nome=Paulo
server.get('/teste', (req, res) => {
  const nome = req.query.nome
  return res.json({message : `Hello World ${nome}`});
});

server.get('/users/:index', checkUserInArray, (req, res) => {
  return res.json({message : req.user});
});

server.post('/users', checkUsersExists,(req, res) => {
  const {name} = req.body;

  users.push(name);

  return res.json(users);
});

server.get('/users', (req, res) => {
  //const id = req.params.id; ou podemos fazer assim:
  return res.json({message : users});
});


server.put('/users/:index', checkUserInArray, checkUsersExists, (req, res) => {
  const {name} = req.body;
  const {index} = req.params;
  users[index] = name;

  return res.json(users);
});

server.delete('/users/:index', checkUserInArray, (req, res) => {
  const {index} = req.params;
  users.splice(index, 1);

  return res.send();
});

server.listen(3000);