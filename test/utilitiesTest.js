process.env.NODE_ENV = 'test';
const knex = require('../knex');
const chai = require('chai');
require('dotenv').config();
const assert = chai.assert;
const jwt = require('jwt-simple');
const {
  getProjectsFromDatabase,
  sendProjectToDatabase,
  sendFinishedProjectToDatabase,
  getProjectById,
  getIndexOfProject,
  addNewProject,
  setupNewGrid,
  deleteUnfinishedProject,
  galleryArt,
  changePixel,
  getProjectFromDbById,
  galleryRatings,
  checkMyGallery,
  checkUserPermissionOnProject,
  promoteProjectToPublic
} = require('../routes/projects');

const {
  addUserPermission,
  checkForUser,
  getUserProjectsArray,
  getNameFromToken,
  getIdFromToken,
  removeUserPermission,
  getIdFromUsername,
  addHashToUser,
  checkForUserHash,
  verifyUser
} = require('../routes/users');

const {
  addRating,
  avgRating,
  deleteRating,
  getRatingByUser
} = require('../routes/ratings');

const {
  flagProject,
  getFlagCount,
  checkIfUserFlagged
} = require('../routes/flags');

const fiveBy = [["#FFF","#FFF","#FFF","#FFF","#FFF"], ["#FFF","#FFF","#FFF","#FFF","#FFF"],
["#FFF","#FFF","#FFF","#FFF","#FFF"],
["#FFF","#FFF","#FFF","#FFF","#FFF"],
["#FFF","#FFF","#FFF","#FFF","#FFF"]];

const testUser = { email: 'bob@foo.com', username: 'Bob', user_id: 7, isMod: false };
const timestamp = new Date().getTime();
testToken = jwt.encode({ sub: testUser.user_id, iat: timestamp }, process.env.JWT_KEY);

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
  beforeEach(async function() {
    await knex.migrate.rollback()
    await knex.migrate.latest()
    await knex.seed.run()
  });

  afterEach(() => knex.migrate.rollback());

  describe('getProjectsFromDatabase', () => {
    it('should return an array of all open projects in the database', async () => {
      let projects = await getProjectsFromDatabase();
      assert.equal(projects.length, 1);
    });
  });

  describe('getProjectFromDbById', () => {
    it('should return a single project from database by id passed in', async () => {
      let project = await getProjectFromDbById(1);
      assert.equal(project.project_id, 1);
    });
  });

  describe('getProjectById function test', () => {
    it('should return the proper project when called', async () => {
      let projects = await getProjectsFromDatabase();
      assert.equal(getProjectById(projects, 1).project_id, 1);
    });
  });

  describe('getIndexOfProject function test', () => {
    it('should return the proper index when called', async () => {
      let projects = await getProjectsFromDatabase();
      assert.equal(getIndexOfProject(projects, 1), 0);
    })
  });

  describe('addNewProject test', () => {
    it('should properly add a new project to the database', async () => {
      let results = await getProjectsFromDatabase();
      assert.equal(results.length, 1);
      let probject = { name: 'foo', x: 20, y: 20, token: testToken };
      await addNewProject(results, probject);
      assert.equal(results.length, 2);
    });
    it('should properly add an entry to the users_projects table', async () => {
      //token for jhl user in database id: 1
      let token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImlhdCI6MTUxNjEzNjMxNTc2NX0.ULJrMww3VFATt7cs5aD1gyNz6WZhadMWSjuTP692Z1g';
      let probject = { name: 'foo', x: 20, y: 20, token: token };
      let projects = await getProjectsFromDatabase();
      await addNewProject(projects, probject);
      let userArray = await getUserProjectsArray(projects, token);
      assert.equal(userArray.length, 2);
    });
  });

  describe('Gallery Art test', () => {
    it('should properly retrieve finished art work from the database', async () => {
      let projects = await galleryArt();
      assert.equal(projects.length, 1);
    });
  });

  describe('sendFinishedProjectToDatabase', () => {
    it('should remove a project from the current projects and add it to the finished art gallery.', async () => {
      let projects = await getProjectsFromDatabase();
      await sendFinishedProjectToDatabase(projects, 1);
      let gallery = await galleryArt();
      projects2 = await getProjectsFromDatabase();
      assert.equal(gallery.length, 2);
      assert.equal(projects2.length, 0);
    });
  });

  describe('deleteUnfinishedProject', () => {
    it('should remove an open from the database', async () => {
      await deleteUnfinishedProject(1);
      let projects = await getProjectsFromDatabase();
      assert.equal(projects.length, 0)
    });
  });

  describe('sendProjectToDatabase', () => {
    it('should save the current state of a project to a database', async () => {
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

  describe('Change Pixel', () => {
    it('should properly change a pixel in a project', async () => {
      let pixel = { x: 0, y: 0, color: '#000', project: 1 };
      let projects = await getProjectsFromDatabase();
      let grid1 = [...projects[0].grid];
      changePixel(projects, pixel);
      let grid2 = [...projects[0].grid];
      assert.notEqual(grid1, grid2);
    });
  });

  describe('Get User Projects', () => {
    it('should properly retrieve a list of active projects belonging to a user', async () => {
      //token for jhl user in database id: 1
      let token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImlhdCI6MTUxNjEzNjMxNTc2NX0.ULJrMww3VFATt7cs5aD1gyNz6WZhadMWSjuTP692Z1g';
      let projects = await getProjectsFromDatabase();
      let userArray = await getUserProjectsArray(projects, token);
      assert.equal(userArray.length, 1);
    });
  });

  describe('Check For User', () => {
    it('should return a user id if the user exists in the database', async () => {
      let usernameTest = await checkForUser("jhl", null);
      let emailTest = await checkForUser(null, "jon@lindell.com");
      let nullTest = await checkForUser("foo", "bar");
      assert.equal(usernameTest, 1);
      assert.equal(emailTest, 1);
      assert.equal(nullTest, null);
    });
  });

  describe('Add User Permission', () => {
    it('should properly add a user permission in the users_projects database', async () => {
      let davesToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiZGF2ZSIsInN1YiI6MiwiaWF0IjoxNTE2Mzg4NjQ3NTY3fQ.Bru4csmkCbKQZEsrXhZkEaeGpCVsEWrcuHgvMZkJg_I'
      let goodTest = await addUserPermission(2, 1);
      let projects = await getProjectsFromDatabase();
      let userArray = await getUserProjectsArray(projects, davesToken);
      assert.equal(userArray.length, 1);
      let badTest = await addUserPermission(7, 12);
      assert.equal(goodTest, "success");
      assert.equal(badTest, "error");
    });
  });

  describe('Get Id From a Username', () => {
    it('should take in a username and return the associated user_id', async () => {
      let result;
      result = await getIdFromUsername('jhl');
      assert.equal(result, 1);
    });
  });

  describe('Remove User Permission', () => {
    it('should remove a user permission from the users_projects database', async () => {
      let davesToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiZGF2ZSIsInN1YiI6MiwiaWF0IjoxNTE2Mzg4NjQ3NTY3fQ.Bru4csmkCbKQZEsrXhZkEaeGpCVsEWrcuHgvMZkJg_I'
      let goodTest = await addUserPermission(2, 1);
      let projects = await getProjectsFromDatabase();
      let userArray = await getUserProjectsArray(projects, davesToken);
      assert.equal(userArray.length, 1);
      let removeTest = await removeUserPermission(2, 1)
      let userArray2 = await getUserProjectsArray(projects, davesToken);
      assert.equal(userArray2.length, 0);
    });
  });

  describe('Ratings Tests', () => {
    it('should properly add and update a users rating', async () => {
      let result = await addRating(1,1,3);
      assert.equal(result.project_id, 1);
      let result2 = await addRating(1,1,5);
      let rating = await getRatingByUser(1, 1);
      assert.equal(rating, 5);
      let result3 = await addRating(1,7,5);
      assert.equal(result3, -1);
    });

    it('should properly get a project rating', async () => {
      let result = await addRating(1,1,3);
      let rating = await getRatingByUser(result.project_id, 1);
      assert.equal(rating, 3);
    });

    it('should properly delete a rating', async () => {
      let result = await addRating(1,1,3);
      let rating = await getRatingByUser(result.project_id, 1);
      assert.equal(rating, 3);
      await deleteRating(1,1);
      let rating2 = await getRatingByUser(result.project_id, 1);
      assert.equal(rating2, -1);
    });

    it('should properly fetch average ratings for a project', async () => {
      let result = await addRating(1,1,3);
      let rating = await getRatingByUser(result.project_id, 1);
      assert.equal(rating, 3);
      let result2 = await addRating(2,1,9);
      let rating2 = await getRatingByUser(result2.project_id, 2);
      assert.equal(rating2, 9);
      let avgResult = await avgRating(1);
      assert.equal(avgResult, 6)
    });
  });

  describe('checkUserPermissionOnProject', () => {
    it('should properly check if a user has permission on a specific project', async () => {
      let result = await checkUserPermissionOnProject(1,1);
      assert.equal(result, true);
      let result2 = await checkUserPermissionOnProject(7,1);
      assert.equal(result2, false);
    });
  });

  describe('checkMyGallery', () => {
    it('should properly return a gallery of projects a user has permissions for', async () => {
      let projects = await getProjectsFromDatabase();
      let token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImlhdCI6MTUxNjEzNjMxNTc2NX0.ULJrMww3VFATt7cs5aD1gyNz6WZhadMWSjuTP692Z1g';
      let checkedGallery = await checkMyGallery(projects, token);
      assert.equal(checkedGallery.length, 1);
      let davesToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiZGF2ZSIsInN1YiI6MiwiaWF0IjoxNTE2Mzg4NjQ3NTY3fQ.Bru4csmkCbKQZEsrXhZkEaeGpCVsEWrcuHgvMZkJg_I';
      let davesGallery = await checkMyGallery(projects, davesToken);
      assert.equal(davesGallery.length, 0);
    });
  });

  describe('promoteProjectToPublic', () => {
    it('should properly set the is_public flag on a project to true', async () => {
      let gallery1 = await galleryArt();
      assert.equal(gallery1[0].is_public, false);
      let result = await promoteProjectToPublic(2);
      let gallery2 = await galleryArt();
      assert.equal(gallery2[0].is_public, true);
    });
  });

  describe('Add Flag', () => {
    it('should properly add a flag in the flags database', async () => {
      let goodTest = await flagProject(1, 1);
      assert.equal(goodTest, 'success');
      let badTest = await flagProject(1,1);
      assert.equal(badTest, 'flag already exists');
    });
  });

  describe('Get Flag Count', () => {
    it('should return the number of flags a project has when given a project id', async () => {
      let flag1 = await flagProject(1, 1);
      let flag2 = await flagProject(2, 1);
      assert.equal(flag1, 'success');
      assert.equal(flag2, 'success');
      let flagCount = await getFlagCount(1);
      assert.equal(flagCount, 2);
    });
  });

  describe('checkIfUserFlagged', () => {
    it('should return true if the user has flagged a project, false otherwise', async () => {
      let flag1 = await flagProject(1, 1);
      assert.equal(flag1, 'success');
      let result1 = await checkIfUserFlagged(1,1);
      assert.equal(result1, true);
      let result2 = await checkIfUserFlagged(2,1);
      assert.equal(result2, false);
    });
  });

  describe('addHashToUser', () => {
    it('should add a hash to a user in the database', async () => {
      let result = await addHashToUser(1, "omgwtfbbq");
      assert.equal(result, true);
      let result2 = await addHashToUser(7, "ascopaubsdfawefb");
      assert.equal(result2, false);
    });
  });

  describe('checkForUserHash', () => {
    it('should return a userid if the hash is found in the database, otherwise false', async () => {
      let result = await addHashToUser(1, "omgwtfbbq");
      assert.equal(result, true);
      let result2 = await checkForUserHash('omgwtfbbq');
      assert.equal(result2, 1);
    });
  });

  describe('verifyUser', () => {
    it('should flip a users verification status from false to true', async () => {
      let result1 = await verifyUser(1);
      assert.equal(result1, true);
      let result2 = await verifyUser(7);
      assert.equal(result2, false);
    });
  });
});

describe('auth tests', () => {
  it('should properly grab the user_id off a token', () => {
    tokenId = getIdFromToken(testToken);
    assert.equal(tokenId, 7);
  });
});
