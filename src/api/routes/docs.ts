import express from "express";
import { Content } from "@core/artifact";
import { getSpec } from "@api/specs";

const router = express.Router();

router.get("/", async (req, res) => {
	const view = await new Content("doc", {
		spec: `${req.baseUrl}/spec`,
	}).render();
	res.status(200).send(view);
});

router.get("/spec", async (req, res) => {
	res.json(getSpec());
});

export = router;
