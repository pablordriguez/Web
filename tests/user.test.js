const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let verificationCode;
let token;
const email = 'test@example.com';
const password = 'test1234';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost/testdb');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Users', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email, password });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('verificationCode');

    verificationCode = res.body.verificationCode;
  });

  it('should verify the verification code', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .send({ email, code: verificationCode });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User successfully verified');
  });

  it('should login successfully', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('email', email);

    token = res.body.token;
  });

  it('should complete the onboarding with personal data', async () => {
    const res = await request(app)
      .put('/api/user/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Adrián',
        lastName: 'Pérez',
        nif: '12345678A'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Data successfully updated');
  });

  it('should save company data', async () => {
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        company: {
          companyName: 'Test Company',
          companyCif: 'B12345678',
          companyAddress: 'Test Street 123',
          companyStreet: 'Test Street',
          companyNumber: '123',
          companyPostal: '28080',
          companyCity: 'Madrid',
          companyProvince: 'Madrid',
          isAutonomous: false
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Company data successfully updated');
  });

  it('should get the authenticated user\'s profile', async () => {
    const res = await request(app)
      .get('/api/user/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', email);
    expect(res.body).toHaveProperty('firstName', 'Adrián');
    expect(res.body).toHaveProperty('lastName', 'Pérez');
  });

  it('should delete (deactivate) the authenticated user', async () => {
    const res = await request(app)
      .delete('/api/user/delete')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'User deactivated');
  });
});

describe('Password Recovery (Independent User)', () => {
  const recoveryEmail = 'recover@example.com';
  const recoveryPassword = 'temporary1234';
  const newRecoveryPassword = 'new9876';
  let recoveryCode;

  it('should register and verify the recovery user', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: recoveryEmail, password: recoveryPassword });

    expect(res.statusCode).toBe(201);

    const verify = await request(app)
      .put('/api/user/validation')
      .send({ email: recoveryEmail, code: res.body.verificationCode });

    expect(verify.statusCode).toBe(200);
  });

  it('should initiate password recovery', async () => {
    const res = await request(app)
      .post('/api/user/recover')
      .send({ email: recoveryEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Recovery code sent');
    recoveryCode = res.body.code;
  });

  it('should allow changing the password with the received code', async () => {
    const res = await request(app)
      .post('/api/user/reset-password')
      .send({
        email: recoveryEmail,
        code: recoveryCode,
        newPassword: newRecoveryPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Password successfully updated');
  });

  it('should login with the new password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        email: recoveryEmail,
        password: newRecoveryPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

describe('Guest User Invitation', () => {
  const inviterEmail = 'inviter@example.com';
  const inviterPassword = 'inviter123';
  const guestEmail = 'guest@example.com';
  let inviterToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: inviterEmail, password: inviterPassword });

    await request(app)
      .put('/api/user/validation')
      .send({ email: inviterEmail, code: res.body.verificationCode });

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: inviterEmail, password: inviterPassword });

    inviterToken = loginRes.body.token;
  });

  it('should invite a guest user correctly', async () => {
    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${inviterToken}`)
      .send({ email: guestEmail });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('message', 'User invited successfully');
    expect(res.body.guest).toHaveProperty('email', guestEmail);
    expect(res.body.guest).toHaveProperty('role', 'guest');
    expect(res.body.guest).toHaveProperty('status', 'pending');
  });
});

describe('Common User Errors', () => {
  it('should not register a user without an email', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ password: 'something1234' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Email and password are required');
  });

  it('should not register a user without a password', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'noPass@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Email and password are required');
  });

  it('should not validate with an incorrect code', async () => {
    const res = await request(app)
      .put('/api/user/validation')
      .send({ email: 'test@example.com', code: '000000' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Invalid verification code');
  });

  it('should not login with an incorrect password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@example.com', password: 'incorrect' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Incorrect password');
  });
});

describe('Failed Authentication', () => {
  it('should not access /me without a token', async () => {
    const res = await request(app).get('/api/user/me');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Access denied. Token not found.');
  });

  it('should not access /me with an invalid token', async () => {
    const res = await request(app)
      .get('/api/user/me')
      .set('Authorization', 'Bearer invalid_token');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });
});
