jest.mock('../src/database/connection', () => ({
  query: jest.fn(),
}));

const request = require('supertest');
const db = require('../src/database/connection');
const app = require('../src/index');

const sampleTodo = {
  id: 1,
  title: 'Buy milk',
  completed: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  db.query.mockReset();
});

describe('GET /todos', () => {
  test('q なしは全件を返す', async () => {
    db.query.mockResolvedValueOnce({ rows: [sampleTodo] });

    const res = await request(app).get('/todos');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleTodo]);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM todos ORDER BY created_at DESC',
      []
    );
  });

  test('q でタイトル部分一致（ILIKE）する', async () => {
    db.query.mockResolvedValueOnce({ rows: [sampleTodo] });

    const res = await request(app).get('/todos').query({ q: 'buy' });

    expect(res.status).toBe(200);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE title ILIKE $1 ORDER BY created_at DESC',
      ['%buy%']
    );
  });

  test('大文字の q も同様に ILIKE で検索する', async () => {
    db.query.mockResolvedValueOnce({ rows: [sampleTodo] });

    await request(app).get('/todos').query({ q: 'BUY' });

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE title ILIKE $1 ORDER BY created_at DESC',
      ['%BUY%']
    );
  });

  test('completed と q を併用できる', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/todos').query({ completed: 'false', q: 'milk' });

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE completed = $1 AND title ILIKE $2 ORDER BY created_at DESC',
      [false, '%milk%']
    );
  });

  test('completed のみでも従来どおり動く', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await request(app).get('/todos').query({ completed: 'true' });

    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM todos WHERE completed = $1 ORDER BY created_at DESC',
      [true]
    );
  });

  test('DB エラー時は 500 を返す', async () => {
    db.query.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/todos');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});

describe('GET /todos/:id', () => {
  test('存在する id を返す', async () => {
    db.query.mockResolvedValueOnce({ rows: [sampleTodo] });

    const res = await request(app).get('/todos/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleTodo);
  });

  test('存在しない id は 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/todos/999');

    expect(res.status).toBe(404);
  });
});

describe('POST /todos', () => {
  test('title 付きで作成する', async () => {
    db.query.mockResolvedValueOnce({ rows: [sampleTodo] });

    const res = await request(app)
      .post('/todos')
      .send({ title: 'Buy milk' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleTodo);
  });

  test('title なしは 400', async () => {
    const res = await request(app).post('/todos').send({ title: '  ' });

    expect(res.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('PATCH /todos/:id', () => {
  test('completed を更新する', async () => {
    const updated = { ...sampleTodo, completed: true };
    db.query
      .mockResolvedValueOnce({ rows: [sampleTodo] })
      .mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/todos/1')
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('更新項目なしは 400', async () => {
    const res = await request(app).patch('/todos/1').send({});

    expect(res.status).toBe(400);
  });

  test('存在しない id は 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/todos/999')
      .send({ title: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /todos/:id', () => {
  test('削除成功は 204', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app).delete('/todos/1');

    expect(res.status).toBe(204);
  });

  test('存在しない id は 404', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app).delete('/todos/999');

    expect(res.status).toBe(404);
  });
});
