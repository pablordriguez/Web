// tests/project.test.js
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

let token;
let clientId;
let projectId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost/testdb');

  // Register user
  const res = await request(app).post('/api/user/register').send({
    email: 'project@example.com',
    password: 'test1234'
  });

  await request(app).put('/api/user/validation').send({
    email: 'project@example.com',
    code: res.body.verificationCode
  });

  // Login
  let login = await request(app).post('/api/user/login').send({
    email: 'project@example.com',
    password: 'test1234'
  });

  token = login.body.token;

  // Save company data
  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      company: {
        companyName: 'Test Company',
        companyCif: 'B87654321',
        companyAddress: 'Test Street 123',
        companyStreet: 'Test Street',
        companyNumber: '123',
        companyPostal: '28080',
        companyCity: 'Madrid',
        companyProvince: 'Madrid',
        isAutonomous: false
      }
    });

  // Re-login to update token with company
  login = await request(app).post('/api/user/login').send({
    email: 'project@example.com',
    password: 'test1234'
  });

  token = login.body.token;

  // Create client
  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Project Client',
      cif: 'B12345678'
    });

  clientId = clientRes.body._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Projects', () => {
  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Project',
        client: clientId,
        description: 'Test project description',
        startDate: '2025-01-01'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('name', 'Test Project');
    projectId = res.body._id;
  });

  it('should get all projects of the user', async () => {
    const res = await request(app)
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get a project by its ID', async () => {
    const res = await request(app)
      .get(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', projectId);
  });

  it('should archive (soft delete) a project', async () => {
    const res = await request(app)
      .patch(`/api/project/archive/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Project archived');
    expect(res.body.project).toHaveProperty('archived', true);
  });

  it('should restore an archived project', async () => {
    const res = await request(app)
      .patch(`/api/project/restore/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('should permanently delete a project', async () => {
    const res = await request(app)
      .delete(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Common Project Errors', () => {
  it('should not create a project without a name', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ client: clientId });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0]).toHaveProperty('msg', 'Project name is required');
  });

  it('should not create a duplicate project', async () => {
    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Duplicate Project',
        client: clientId,
        description: 'Duplicate project',
        startDate: '2025-01-01'
      });

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Duplicate Project',
        client: clientId
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'A project with this name already exists.');
  });

  it('should not allow access without a token', async () => {
    const res = await request(app).get('/api/project');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Access denied. Token not found.');
  });

  it('should not allow access with an invalid token', async () => {
    const res = await request(app)
      .get('/api/project')
      .set('Authorization', 'Bearer invalid_token');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  it('should not archive a non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/project/archive/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Project not found or unauthorized');
  });

  it('should not restore a non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/project/restore/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Project not found or unauthorized');
  });

  it('should not delete a non-existent project', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/project/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Project not found');
  });
  
});
