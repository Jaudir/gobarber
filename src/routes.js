import { Router } from 'express';

const routes = new Router();

// ROUTES

routes.get('/', (req, res) => {
  return res.json({ menssage: 'Hellloooooo' });
});

export default routes;
