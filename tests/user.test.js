import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, closeDB, clearDB } from './helpers/db.js';

let token;

const userData = {
    name:     'Test',
    lastName: 'User',
    nif:      '12345678A',
    email:    'test@example.com',
    password: 'Password123!',
};

const registerAndVerify = async () => {
    const reg = await request(app).post('/api/user/register').send(userData);
    const tk = reg.body.token;
    const user = await User.findOne({ email: userData.email });
    await request(app)
        .put('/api/user/validation')
        .set('Authorization', `Bearer ${tk}`)
        .send({ code: user.verificationCode });
    return tk;
};

beforeAll(async () => {
    await connectDB();
}, 30000);

afterAll(async () => {
    await closeDB();
}, 30000);

beforeEach(async () => {
    await clearDB();
    token = null;
});

describe('POST /api/user/register', () => {
    it('registra un usuario correctamente', async () => {
        const res = await request(app).post('/api/user/register').send(userData);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(userData.email);
    });

    it('rechaza email duplicado', async () => {
        await request(app).post('/api/user/register').send(userData);
        const res = await request(app).post('/api/user/register').send(userData);
        expect(res.status).toBe(409);
    });

    it('rechaza sin campos requeridos', async () => {
        const res = await request(app).post('/api/user/register').send({ email: 'a@b.com', password: 'Abc123456' });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/user/login', () => {
    beforeEach(async () => {
        token = await registerAndVerify();
    });

    it('login correcto devuelve accessToken', async () => {
        const res = await request(app).post('/api/user/login').send({
            email:    userData.email,
            password: userData.password,
        });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('rechaza contraseña incorrecta', async () => {
        const res = await request(app).post('/api/user/login').send({
            email:    userData.email,
            password: 'wrongpassword',
        });
        expect(res.status).toBe(401);
    });

    it('rechaza login sin verificar email', async () => {
        await clearDB();
        await request(app).post('/api/user/register').send(userData);
        const res = await request(app).post('/api/user/login').send({
            email:    userData.email,
            password: userData.password,
        });
        expect(res.status).toBe(403);
    });
});

describe('GET /api/user (getMe)', () => {
    beforeEach(async () => {
        const reg = await request(app).post('/api/user/register').send(userData);
        token = reg.body.token;
    });

    it('devuelve datos del usuario autenticado', async () => {
        const res = await request(app)
            .get('/api/user')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(userData.email);
    });

    it('rechaza sin token', async () => {
        const res = await request(app).get('/api/user');
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/user/validation (validateEmail)', () => {
    beforeEach(async () => {
        const reg = await request(app).post('/api/user/register').send(userData);
        token = reg.body.token;
    });

    it('valida email con código correcto', async () => {
        const user = await User.findOne({ email: userData.email });
        const res = await request(app)
            .put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: user.verificationCode });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('rechaza código incorrecto', async () => {
        const res = await request(app)
            .put('/api/user/validation')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: '000000' });
        expect([400, 401]).toContain(res.status);
    });
});

describe('PATCH /api/user/company', () => {
    beforeEach(async () => {
        token = await registerAndVerify();
    });

    it('asocia empresa al usuario', async () => {
        const res = await request(app)
            .patch('/api/user/company')
            .set('Authorization', `Bearer ${token}`)
            .send({ isFreelance: false, name: 'Mi Empresa SL', cif: 'B12345678' });
        expect(res.status).toBe(200);
        expect(res.body.user).toHaveProperty('company');
    });

    it('asocia como autónomo', async () => {
        const res = await request(app)
            .patch('/api/user/company')
            .set('Authorization', `Bearer ${token}`)
            .send({ isFreelance: true });
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/user', () => {
    beforeEach(async () => {
        const reg = await request(app).post('/api/user/register').send(userData);
        token = reg.body.token;
    });

    it('elimina el usuario autenticado', async () => {
        const res = await request(app)
            .delete('/api/user')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
});
