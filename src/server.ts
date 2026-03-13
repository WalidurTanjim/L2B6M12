import express, { Request, Response } from "express";

const app = express();
const port = process.env.PORT || 5000;

// parser
app.use(express.json());
// app.use(express.urlencoded());     // form-data

// GET methods
app.get("/", (req: Request, res: Response) => {
     res.send("Welcome to Next Level Development.");
})

app.listen(port, () => {
     console.log(`Express Server listening on port ${port}`);
});1