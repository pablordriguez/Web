const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const path = require('path');

let token, clientId, projectId, deliveryNoteId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost/testdb');

  const res = await request(app)
    .post('/api/user/register')
    .send({ email: 'deliverynote@test.com', password: 'test1234' });

  await request(app)
    .put('/api/user/validation')
    .send({ email: 'deliverynote@test.com', code: res.body.verificationCode });

  const login = await request(app)
    .post('/api/user/login')
    .send({ email: 'deliverynote@test.com', password: 'test1234' });

  token = login.body.token;

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Client deliverynote',
      email: 'client@deliverynote.com',
      phone: '611223344',
      address: 'Client Street 456',
      contactPerson: 'Laura Client'
    });

  clientId = clientRes.body._id;

  const projectRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Project deliverynote',
      description: 'Project for delivery note tests',
      client: clientId
    });

  projectId = projectRes.body._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Delivery Notes', () => {
  it('should create a simple delivery note', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        type: 'simple',
        data: [{ name: 'Service X', quantity: 3 }]
      });

    if (res.statusCode !== 201) {
      console.error('❌ Error creating delivery note:', res.body);
    }

    expect(res.statusCode).toBe(201);
    deliveryNoteId = res.body._id;
  });

  it('should retrieve all the user\'s delivery notes', async () => {
    const res = await request(app)
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should retrieve a delivery note by ID', async () => {
    const res = await request(app)
      .get(`/api/deliverynote/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', deliveryNoteId);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('client');
  });

  it('should delete an unsigned delivery note', async () => {
    const res = await request(app)
      .delete(`/api/deliverynote/${deliveryNoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Delivery note deleted successfully');
  });

  it('should sign a new delivery note', async () => {
    const note = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        type: 'simple',
        data: [{ name: 'Task to sign', quantity: 1 }]
      });

    const resSign = await request(app)
      .post(`/api/deliverynote/sign/${note.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', '__tests__/signature.png');

    if (resSign.statusCode !== 200) {
      console.error('❌ Error signing delivery note:', resSign.body);
    }

    expect(resSign.statusCode).toBe(200);
    expect(resSign.body).toHaveProperty('message', 'Delivery note signed successfully');
    expect(resSign.body.note).toHaveProperty('signed', true);
  }, 10000);

  it('should not delete a signed delivery note', async () => {
    const signedNote = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        type: 'simple',
        data: [{ name: 'Signed delivery note', quantity: 1 }]
      });

    await request(app)
      .post(`/api/deliverynote/sign/${signedNote.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', '__tests__/signature.png');

    const res = await request(app)
      .delete(`/api/deliverynote/${signedNote.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Cannot delete a signed delivery note');
  }, 10000);

  it('should download the signed delivery note PDF', async () => {
    const noteRes = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        type: 'simple',
        data: [{ name: 'Service Y', quantity: 1 }]
      });

    const noteId = noteRes.body._id;

    const signRes = await request(app)
      .post(`/api/deliverynote/sign/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', '__tests__/signature.png');

    expect(signRes.statusCode).toBe(200);
    expect(signRes.body.note).toHaveProperty('pdfUrl');

    const pdfRes = await request(app)
      .get(`/api/deliverynote/pdf/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(pdfRes.statusCode).toBe(302);
    expect(pdfRes.headers.location).toContain('https://gateway.pinata.cloud/ipfs/');
  });
});

describe('Common Delivery Note Errors', () => {
  it('should not create a delivery note without required data', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // sending empty data

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should not sign a delivery note without an image', async () => {
    const note = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        type: 'simple',
        data: [{ name: 'Signature error', quantity: 1 }]
      });

    const res = await request(app)
      .post(`/api/deliverynote/sign/${note.body._id}`)
      .set('Authorization', `Bearer ${token}`); // no .attach

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'No signature attached');
  });

  it('should not retrieve a delivery note with a non-existing ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/deliverynote/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Not found');
  });

  it('should not sign an already signed delivery note', async () => {
    const note = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        client: clientId,
        type: 'simple',
        data: [{ name: 'Already signed', quantity: 1 }]
      });

    await request(app)
      .post(`/api/deliverynote/sign/${note.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', '__tests__/signature.png');

    const res = await request(app)
      .post(`/api/deliverynote/sign/${note.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', '__tests__/signature.png');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'The delivery note is already signed');
  });

});
