import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, brand, sale_price, rental_price, type, image, stock, description, featured } = req.body;
    const { rows } = await query(
      `INSERT INTO products (name, category, brand, sale_price, rental_price, type, image, stock, description, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, category, brand, sale_price || null, rental_price || null, type, image || null, stock || 0, description || null, featured || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, brand, sale_price, rental_price, type, image, stock, description, featured } = req.body;
    const { rows } = await query(
      `UPDATE products SET name=$1, category=$2, brand=$3, sale_price=$4, rental_price=$5, type=$6, image=$7, stock=$8, description=$9, featured=$10
       WHERE id=$11 RETURNING *`,
      [name, category, brand, sale_price || null, rental_price || null, type, image || null, stock || 0, description || null, featured || false, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Product not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
