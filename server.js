'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const users = require('./routes/users');
const projects = require('./routes/projects');
const axios = require('axios');
const apiPort = 8000;
const socketPort = 7000;

//setup initial pixel grid for socket to track
var allProjects = [];
// addNewProject();
// addNewProject();
// addNewProject();
getProjectsFromDatabase();

async function getProjectsFromDatabase(){
  let responseData;
  await axios.get('http://localhost:8000/api/projects')
    .then(response => {
      responseData = response.data;
    });

    responseData.forEach((project) => {
      let object = {};
      object.id = project.id;
      object.project_name = project.project_name;
      let grid = JSON.parse(project.grid);
      object.grid = grid;
      // console.log(object);
      allProjects.push(object);
    })
  console.log(allProjects);
  // JSON.parse(localStorage.getItem('sessionPersistance'))
}

function setupNewGrid(){
  let  newGrid = [];
  for (var i = 0; i < 20; i++) {
    let row = [];
    for (var j = 0; j < 20; j++) {
      row.push('#FFF');
    }
    newGrid.push(row);
  }
  return newGrid;
}

function addNewProject(){
  let newProject = {};
  newProject.id = allProjects.length + 1;
  newProject.grid = setupNewGrid();
  newProject.projectName = "Project " + newProject.id;
  allProjects.push(newProject);
}

function changePixel(pixel){
  allProjects[pixel.project-1].grid[pixel.y][pixel.x] = pixel.color;
}

io.on('connection', (socket) => {
  socket.on('joinRoom', (room)=> {
    console.log('joining room: ', room);
    socket.join(room);
  });

  socket.on('leaveRoom', (room)=> {
    socket.leave(room);
  });

  socket.on('grid', (room)=>{
    socket.emit('gridUpdated', allProjects[room-1].grid);
  });

  socket.on('pixel', (pixel)=> {
    changePixel(pixel);
    io.in(pixel.project).emit('pixel', pixel);
  });

  socket.on('initialize', () => {
    socket.emit('sendProjectsToClient', allProjects);
  });

  socket.on('addNewProject', ()=> {
    addNewProject();
    socket.emit('sendProjectsToClient', allProjects);
  });

  socket.on('saveProject', (projectid)=> {
    let gridString = JSON.stringify(allProjects[projectid - 1].grid);
    let convertedString = gridString.replace(/[\"]/g, "'");
  });
});

io.listen(socketPort);
console.log("Now listening on port " + socketPort);

//api server
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/users', users);
app.use('/api/projects', projects);

app.use((req, res, next) => {
  res.sendStatus(404);
});

app.listen(apiPort, () => {
  console.log("Now listening on port " + apiPort);
});
