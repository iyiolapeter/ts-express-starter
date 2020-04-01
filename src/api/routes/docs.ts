import { View } from "@api/view";
import { getSpec } from "@api/specs";
import { createRouter } from "@weaverkit/express";

const spec = getSpec();
const router = createRouter();

router.get("/", async (req, res) => {
	const view = new View({
		name: "doc",
		data: {
			spec: `${req.baseUrl}/spec`,
		},
	});
	res.status(view.httpCode).send(await view.render());
});

router.get("/spec", async (req, res) => {
	res.json(spec);
});

export = router;
