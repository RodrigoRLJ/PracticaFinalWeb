import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, closeDB, clearDB } from './helpers/db.js';

let token;
let clientId;

const userData = {
    name:     'Test',
    lastName: 'User',
    nif:      '12345678A',
    email:    'test@example.com',
    password: 'Password123!',
};

const projectData = () => ({
    name:        'Proyecto Test',
    projectCode: 'PRJ-001',
    clientId,
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

beforeAll(async () => {
    await connectDB();
}, 30000);

afterAll(async () => {
    await closeDB();
}, 30000);

beforeEach(async () => {
    await clearDB();
    token    = await setupUser();
    clientId = await createClient(token);
});

describe('POST /api/project', () => {
    it('crea un proyecto correctamente', async () => {
        const res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send(projectData());
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('project');
        expect(res.body.project.name).toBe('Proyecto Test');
        expect(res.body.project.projectCode).toBe('PRJ-001');
    });

    it('rechaza sin nombre', async () => {
        const res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ projectCode: 'PRJ-001', clientId });
        expect(res.status).toBe(400);
    });

    it('rechaza sin clientId', async () => {
        const res = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test', projectCode: 'PRJ-001' });
        expect(res.status).toBe(400);
    });

    it('rechaza sin token', async () => {
        const res = await request(app).post('/api/project').send(projectData());
        expect(res.status).toBe(401);
    });
});

describe('GET /api/project', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send(projectData());
    });

    it('devuelve lista de proyectos', async () => {
        const res = await request(app)
            .get('/api/project')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('projects');
        expect(Array.isArray(res.body.projects)).toBe(true);
        expect(res.body.projects.length).toBe(1);
    });

    it('filtra por clientId', async () => {
        const res = await request(app)
            .get(`/api/project?clientId=${clientId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.projects.length).toBe(1);
    });

    it('filtra por status', async () => {
        const res = await request(app)
            .get('/api/project?status=pending')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.projects.length).toBe(1);
    });

    it('filtra por nombre (regex)', async () => {
        const res = await request(app)
            .get('/api/project?name=proyecto')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.projects.length).toBe(1);
    });

    it('no devuelve proyectos eliminados', async () => {
        const list = await request(app).get('/api/project').set('Authorization', `Bearer ${token}`);
        const id = list.body.projects[0]._id;
        await request(app).delete(`/api/project/${id}`).set('Authorization', `Bearer ${token}`);
        const res = await request(app).get('/api/project').set('Authorization', `Bearer ${token}`);
        expect(res.body.projects.length).toBe(0);
    });
});

describe('GET /api/project/:id', () => {
    it('devuelve un proyecto por ID con clientId populado', async () => {
        const created = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send(projectData());
        const id = created.body.project._id;

        const res = await request(app)
            .get(`/api/project/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.project._id).toBe(id);
        expect(res.body.project.clientId).toHaveProperty('name');
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .get('/api/project/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

describe('PUT /api/project/:id', () => {
    it('actualiza un proyecto', async () => {
        const created = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send(projectData());
        const id = created.body.project._id;

        const res = await request(app)
            .put(`/api/project/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Nombre Actualizado', status: 'active' });
        expect(res.status).toBe(200);
        expect(res.body.project.name).toBe('Nombre Actualizado');
        expect(res.body.project.status).toBe('active');
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .put('/api/project/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'X' });
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/project/:id', () => {
    it('elimina un proyecto (soft delete)', async () => {
        const created = await request(app)
            .post('/api/project')
            .set('Authorization', `Bearer ${token}`)
            .send(projectData());
        const id = created.body.project._id;

        const res = await request(app)
            .delete(`/api/project/${id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('devuelve 404 para ID inexistente', async () => {
        const res = await request(app)
            .delete('/api/project/000000000000000000000001')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});
