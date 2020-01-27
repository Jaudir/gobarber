import { Router } from "express";

const routes = new Router();

// ROUTES

routes.get("/", (req, res) => {
  console.log("Sucesso");
  return res.json({ menssage: "Hellloooooo" });
});

export default routes;
