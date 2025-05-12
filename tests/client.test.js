const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let token;
let clientId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost/testdb');

  const res = await request(app)
    .post('/api/user/register')
    .send({ email: 'client111@test.com', password: 'client1234' });

  await request(app)
    .put('/api/user/validation')
    .send({ email: 'client111@test.com', code: res.body.verificationCode });

  const login = await request(app)
    .post('/api/user/login')
    .send({ email: 'client111@test.com', password: 'client1234' });

  token = login.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Clients', () => {
  it('should create a new client', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Demo Company 2',
        email: 'demo@company.com',
        phone: '699312233',
        address: 'Test Street 123',
        contactPerson: 'John Doe'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Demo Company 2');

    clientId = res.body._id;
  });

  it('should get all clients of the user', async () => {
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`);
  
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
  });

  it('should get a client by its ID', async () => {
    const res = await request(app)
      .get(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`);
  
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', clientId);
    expect(res.body).toHaveProperty('name', 'Demo Company 2');
  });
  
  it('should update an existing client', async () => {
    const res = await request(app)
      .put(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Demo Company 2',
        email: 'demo@company.com',
        phone: '644556677',
        address: 'Test Street 123',
        contactPerson: 'John Doe'
      });
  
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('phone', '644556677');
  });

  it('should restore an archived client', async () => {
    await request(app)
      .patch(`/api/client/archive/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/client/restore/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Client restored');
    expect(res.body.client).toHaveProperty('archived', false);
  });

  it('should permanently delete a client', async () => {
    const res = await request(app)
      .delete(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Client permanently deleted');
  });
});

describe('Common client errors', () => {
  let token;
  const clientData = {
    name: 'Test Client',
    email: 'client@example.com',
    phone: '600123456'
  };

  beforeAll(async () => {
    // Register and log in a user to get the token
    const res = await request(app).post('/api/user/register').send({
      email: 'clienterror@example.com',
      password: 'test1234'
    });
    await request(app).put('/api/user/validation').send({
      email: 'clienterror@example.com',
      code: res.body.verificationCode
    });
    const login = await request(app).post('/api/user/login').send({
      email: 'clienterror@example.com',
      password: 'test1234'
    });
    token = login.body.token;

    // Create a client for duplicate test
    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientData);
  });

  it('should not create a client without a name', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'incomplete@client.com' });
  
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0]).toHaveProperty('msg', 'The clients name is required');
  });

  it('should not create a duplicate client', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Client already created by this user');
  });

  it('should not get a client with a non-existent ID', async () => {
    const res = await request(app)
      .get('/api/client/999999999999999999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('should not allow client creation without a token', async () => {
    const res = await request(app)
      .post('/api/client')
      .send(clientData);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Access denied. Token not found.');
  });
});
