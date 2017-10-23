process.env.NODE_ENV = 'test';
const knex = require('../knex');
const chai = require('chai');
const assert = chai.assert;
const {
  getProjectsFromDatabase,
  sendProjectToDatabase,
  getProjectById,
  getIndexOfProject,
  setupNewGrid,
  addNewProject,
  sendFinishedProjectToDatabase,
  deleteUnfinishedProject,
  galleryArt,
  changePixel
} = require('../utilities');

const fiveBy = [["#FFF","#FFF","#FFF","#FFF","#FFF"], ["#FFF","#FFF","#FFF","#FFF","#FFF"],
["#FFF","#FFF","#FFF","#FFF","#FFF"],
["#FFF","#FFF","#FFF","#FFF","#FFF"],
["#FFF","#FFF","#FFF","#FFF","#FFF"]];

describe('setUpNewGrid', function(){
  it('should return an empty array if x or y are less than 1', function(){
    assert.deepEqual(setupNewGrid(0, 10), []);
    assert.deepEqual(setupNewGrid(10, 0), []);
    assert.notDeepEqual(setupNewGrid(10, 10), []);
  });

  it('should return a proper 5x5 array if 5 and 5 are passed in', function() {
    assert.deepEqual(setupNewGrid(5, 5), fiveBy);
  });
});

describe('database tests', function(){
  beforeEach(function(done) {
    knex.migrate.rollback()
    .then(function() {
      knex.migrate.latest()
      .then(function() {
        return knex.seed.run()
        .then(function() {
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    knex.migrate.rollback()
    .then(function() {
      done();
    });
  });

  describe('getProjectsFromDatabase', function(){
    it('should return an array of all open projects in the database', function(){
      return getProjectsFromDatabase().then((projects) =>{
        assert.equal(projects.length, 1);
      });
    });
  });

  describe('getProjectById function test', function(){
    it('should return the proper project when called', function(){
      return getProjectsFromDatabase().then((projects) =>{
        assert.equal(getProjectById(projects, 1).id, 1);
      });
    });
  });

  describe('getIndexOfProject function test', function(){
    it('should return the proper index when called', function(){
      return getProjectsFromDatabase().then((projects) =>{
        assert.equal(getIndexOfProject(projects, 1), 0);
      });
    })
  });

  describe('addNewProject test', function (){
    it('should properly add a new project to the database', async function(){
      // try {
      var results = await getProjectsFromDatabase();
      assert.equal(results.length, 1);
      let probject = {name: 'foo', x: 20, y: 20};
      await addNewProject(results, probject);
      assert.equal(results.length, 2);
      // } catch(err) {
      //   console.log(err);
      //   // done(err);
      // }
    });
  });

  describe('Gallery Art test', function(){
    it('should properly retrieve finished art work from the database', function(){
      return galleryArt().then((projects) => {
        assert.equal(projects.length, 1);
      });
    });
  });

  describe('sendFinishedProjectToDatabase', function(){
    it('should remove a project from the current projects and add it to the finished art gallery.', async function(){
      let projects = await getProjectsFromDatabase();
      await sendFinishedProjectToDatabase(projects, 1);
      let gallery = await galleryArt();
      projects2 = await getProjectsFromDatabase();
      assert.equal(gallery.length, 2);
      assert.equal(projects2.length, 0);
    });
  });

  describe('deleteUnfinishedProject', function(){
    it('should remove an open from the database', async function(){
      await deleteUnfinishedProject(1);
      let projects = await getProjectsFromDatabase();
      assert.equal(projects.length, 0)
    });
  });

  describe('sendProjectToDatabase', function(){
    it('should save the current state of a project to a database', async function(){
      let pixel = { x: 0, y: 0, color: '#000', project: 1 };
      let projects = await getProjectsFromDatabase();
      let testProject1 = await getProjectById(projects, 1);
      changePixel(projects, pixel);
      await sendProjectToDatabase(projects, 1);
      let endProjects = await getProjectsFromDatabase();
      let testProject2 = await getProjectById(endProjects, 1);
      assert.notEqual(testProject1.grid, testProject2.grid);
    });
  });

  describe('Change Pixel', function(){
    it('should properly change a pixel in a project', async function(){
      let pixel = { x: 0, y: 0, color: '#000', project: 1 };
      let projects = await getProjectsFromDatabase();
      let grid1 = [];
      Object.assign(grid1, projects[0].grid);
      changePixel(projects, pixel);
      let grid2 = [];
      Object.assign(grid2, projects[0].grid);
      assert.notEqual(grid1, grid2);
    });
  });
});