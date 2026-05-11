// Todo handler - manages all todo operations
const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// List all todos
router.get('/', async (req, res) => {
  try {
    const { completed } = req.query;
    let q = 'SELECT * FROM todos ORDER BY created_at DESC';
    const p = [];
    if (completed !== undefined) {
      q = 'SELECT * FROM todos WHERE completed = $1 ORDER BY created_at DESC';
      p.push(completed === 'true');
    }
    const result = await db.query(q, p);
    res.status(200).json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single todo
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create todo
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') return res.status(400).json({ error: 'title required' });
    const result = await db.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update todo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    if (title === undefined && completed === undefined) {
      return res.status(400).json({ error: 'nothing to update' });
    }
    const existing = await db.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const t = title     !== undefined ? title.trim()  : existing.rows[0].title;
    const c = completed !== undefined ? completed      : existing.rows[0].completed;
    const result = await db.query(
      'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
      [t, c, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
