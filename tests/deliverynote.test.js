import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, closeDB, clearDB } from './helpers/db.js';

let token;
let clientId;
let projectId;

const userData = {
    name:     'Test',
    lastName: 'User',
    nif:      '12345678A',
    email:    'test@example.com',
    password: 'Password123!',
};

const noteData = () => ({
    deliveryNoteNumber: 'ALB-001',
    project:            projectId,
    clientId,
    format:             'hours',
    hours:              8,
});

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

const createClient = async (tk) => {
    const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${tk}`)
        .send({ name: 'Cliente Test', cif: 'A11111111' });
    return res.body.client._id;
};

const createProject = async (tk, cId) => {
    const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${tk}`)
        .send({ name: 'Proyecto Test', projectCode: 'PRJ-001', clientId: cId });
    return res.body.project._id;
};

beforeAll(async () => {
    await connectDB();
}, 30000);

afterAll(async () => {
    await closeDB();
}, 30000);

beforeEach(async () => {
    await clearDB();
    token     = await setupUser();
    clientId  = await createClient(token);
    projectId = await createProject(token, clientId);
});

describe('POST /api/deliverynote', () => {
    it('crea un albarán de horas correctamente', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('note');
        expect(res.body.note.deliveryNoteNumber).toBe('ALB-001');
        expect(res.body.note.pending).toBe(true);
    });

    it('crea un albarán de materiales correctamente', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ deliveryNoteNumber: 'ALB-002', project: projectId, clientId, format: 'materials', quantity: 5 });
        expect(res.status).toBe(201);
        expect(res.body.note.format).toBe('materials');
    });

    it('rechaza format hours sin hours', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ deliveryNoteNumber: 'ALB-003', project: projectId, clientId, format: 'hours' });
        expect(res.status).toBe(400);
    });

    it('rechaza format materials sin quantity', async () => {
        const res = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send({ deliveryNoteNumber: 'ALB-004', project: projectId, clientId, format: 'materials' });
        expect(res.status).toBe(400);
    });

    it('rechaza sin token', async () => {
        const res = await request(app).post('/api/deliverynote').send(noteData());
        expect(res.status).toBe(401);
    });
});

describe('GET /api/deliverynote', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
    });

    it('devuelve lista de albaranes', async () => {
        const res = await request(app)
            .get('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('notes');
        expect(res.body.notes.length).toBe(1);
    });

    it('filtra por project', async () => {
        const res = await request(app)
            .get(`/api/deliverynote?project=${projectId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.notes.length).toBe(1);
    });

    it('filtra por pending=true', async () => {
        const res = await request(app)
            .get('/api/deliverynote?pending=true')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.notes.length).toBe(1);
    });

    it('no devuelve albaranes eliminados', async () => {
        const list = await request(app).get('/api/deliverynote').set('Authorization', `Bearer ${token}`);
        const id = list.body.notes[0]._id;
        await request(app).delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);
        const res = await request(app).get('/api/deliverynote').set('Authorization', `Bearer ${token}`);
        expect(res.body.notes.length).toBe(0);
    });
});

describe('GET /api/deliverynote/:id', () => {
    it('devuelve un albarán por ID con populate', async () => {
        const created = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        const id = created.body.note._id;

        const res = await request(app)
            .get(`/api/deliverynote/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.note._id).toBe(id);
        expect(res.body.note.project).toHaveProperty('name');
        expect(res.body.note.clientId).toHaveProperty('name');
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .get('/api/deliverynote/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

describe('GET /api/deliverynote/:id/pdf', () => {
    it('devuelve un PDF del albarán', async () => {
        const created = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        const id = created.body.note._id;

        const res = await request(app)
            .get(`/api/deliverynote/${id}/pdf`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/pdf/);
    });
});

describe('PATCH /api/deliverynote/:id/sign', () => {
    it('firma un albarán pendiente', async () => {
        const created = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        const id = created.body.note._id;

        const res = await request(app)
            .patch(`/api/deliverynote/${id}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sign: 'firma-base64-simulada' });
        expect(res.status).toBe(200);
        expect(res.body.note.pending).toBe(false);
        expect(res.body.note.sign).toBe('firma-base64-simulada');
    });

    it('devuelve 404 al intentar firmar un albarán ya firmado', async () => {
        const created = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        const id = created.body.note._id;

        await request(app)
            .patch(`/api/deliverynote/${id}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sign: 'primera-firma' });

        const res = await request(app)
            .patch(`/api/deliverynote/${id}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sign: 'segunda-firma' });
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/deliverynote/:id', () => {
    it('elimina un albarán pendiente (soft delete)', async () => {
        const created = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        const id = created.body.note._id;

        const res = await request(app)
            .delete(`/api/deliverynote/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('bloquea eliminación de albarán firmado (409)', async () => {
        const created = await request(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(noteData());
        const id = created.body.note._id;

        await request(app)
            .patch(`/api/deliverynote/${id}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sign: 'firma-test' });

        const res = await request(app)
            .delete(`/api/deliverynote/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(409);
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .delete('/api/deliverynote/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});
