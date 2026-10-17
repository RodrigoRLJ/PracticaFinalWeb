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

const clientData = {
    name: 'Cliente Test SA',
    cif:  'A11111111',
};

const setupUser = async () => {
    const reg = await request(app).post('/api/user/register').send(userData);
    const tk = reg.body.token;
    const user = await User.findOne({ email: userData.email });
    await request(app)
        .put('/api/user/validation')
        .set('Authorization', `Bearer ${tk}`)
        .send({ code: user.verificationCode });
    await request(app)
        .patch('/api/user/company')
        .set('Authorization', `Bearer ${tk}`)
        .send({ isFreelance: true });
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
    token = await setupUser();
});

describe('POST /api/client', () => {
    it('crea un cliente correctamente', async () => {
        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('client');
        expect(res.body.client.name).toBe(clientData.name);
    });

    it('rechaza sin nombre', async () => {
        const res = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send({ cif: 'A11111111' });
        expect(res.status).toBe(400);
    });

    it('rechaza sin token', async () => {
        const res = await request(app).post('/api/client').send(clientData);
        expect(res.status).toBe(401);
    });
});

describe('GET /api/client', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
    });

    it('devuelve lista de clientes', async () => {
        const res = await request(app)
            .get('/api/client')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('clients');
        expect(Array.isArray(res.body.clients)).toBe(true);
        expect(res.body.clients.length).toBe(1);
    });

    it('no devuelve clientes eliminados', async () => {
        const list = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
        const id = list.body.clients[0]._id;
        await request(app).delete(`/api/client/${id}`).set('Authorization', `Bearer ${token}`);
        const res = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
        expect(res.body.clients.length).toBe(0);
    });
});

describe('GET /api/client/:id', () => {
    it('devuelve un cliente por ID', async () => {
        const created = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
        const id = created.body.client._id;

        const res = await request(app)
            .get(`/api/client/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.client._id).toBe(id);
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .get('/api/client/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

describe('PUT /api/client/:id', () => {
    it('actualiza un cliente', async () => {
        const created = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
        const id = created.body.client._id;

        const res = await request(app)
            .put(`/api/client/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Nombre Actualizado' });
        expect(res.status).toBe(200);
        expect(res.body.client.name).toBe('Nombre Actualizado');
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .put('/api/client/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'X' });
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/client/:id', () => {
    it('elimina un cliente (soft delete)', async () => {
        const created = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
        const id = created.body.client._id;

        const res = await request(app)
            .delete(`/api/client/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .delete('/api/client/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/client/:id/archive y /restore', () => {
    let clientId;

    beforeEach(async () => {
        const created = await request(app)
            .post('/api/client')
            .set('Authorization', `Bearer ${token}`)
            .send(clientData);
        clientId = created.body.client._id;
    });

    it('archiva un cliente (active=false)', async () => {
        const res = await request(app)
            .patch(`/api/client/${clientId}/archive`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.client.active).toBe(false);
    });

    it('restaura un cliente archivado (active=true)', async () => {
        await request(app)
            .patch(`/api/client/${clientId}/archive`)
            .set('Authorization', `Bearer ${token}`);
        const res = await request(app)
            .patch(`/api/client/${clientId}/restore`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.client.active).toBe(true);
    });
});
