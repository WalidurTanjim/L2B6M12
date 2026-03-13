import express, { Request, Response } from "express";
import { Pool } from "pg";

const app = express();
const port = process.env.PORT || 5000;

// database
const pool = new Pool({
     connectionString: `postgresql://neondb_owner:npg_W9IjHOhoD0Zy@ep-wild-lab-ad0uux2h-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
});

const initDB = async() => {
     try{
          await pool.query("BEGIN");

          await pool.query(`
                    CREATE TABLE IF NOT EXISTS users(
                         id SERIAL PRIMARY KEY,
                         name VARCHAR(100) NOT NULL,
                         email VARCHAR(150) UNIQUE NOT NULL,
                         age INT,
                         phone VARCHAR(15),
                         address TEXT,
                         created_at TIMESTAMP DEFAULT NOW(),
                         updated_at TIMESTAMP DEFAULT NOW()
                    )
               `);

          await pool.query(`
                    CREATE TABLE IF NOT EXISTS todos(
                         id SERIAL PRIMARY KEY,
                         user_id INT REFERENCES users(id) ON DELETE CASCADE,
                         title VARCHAR(200) NOT NULL,
                         description TEXT,
                         due_date DATE,
                         created_at TIMESTAMP DEFAULT NOW(),
                         updated_at TIMESTAMP DEFAULT NOW()
                    )
               `);

          await pool.query("COMMIT");
     }catch(err: any){
          await pool.query("ROLLBACK");

          console.error(err?.message);
          console.error("Database not initialize");
     }
}

initDB();

// parser
app.use(express.json());
// app.use(express.urlencoded());     // form-data

// POST methods
app.post("/users", async(req: Request, res: Response) => {
     const { name, email } = await req?.body;

     try{
          const result = await pool.query(`INSERT INTO users(name, email) VALUES($1, $2) RETURNING *`, [name, email]);

          if(result?.rows.length > 0){
               res.status(201).json({
                    success: true,
                    message: "Data inserted successfully",
                    data: result?.rows[0]
               });
          }
     }catch(err: any){
          console.error(err?.message);

          res.status(500).json({
               success: false, 
               message: "Failed to insert. Try again.",
               data: null
          });
     }
})

// GET methods
app.get("/", (req: Request, res: Response) => {
     res.send("Welcome to Next Level Development.");
})

app.listen(port, () => {
     console.log(`Express Server listening on port ${port}`);
});