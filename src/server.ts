import express, { Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// dotenv config
dotenv.config({ path: path.join(process.cwd(), ".env") });

const app = express();
const port = process.env.PORT || 5000;

// database
const pool = new Pool({
     connectionString: process.env.PG_CONNECTION_STRING
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

// ===== users =====
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
app.get("/users", async(req: Request, res: Response) => {
     try{
          const result = await pool.query(`SELECT * FROM users`);

          if(result?.rows.length > 0){
               res.status(200).json({
                    success: true,
                    message: "All users retrived successfully",
                    data: result?.rows
               })
          }else{
               res.status(404).json({
                    success: false,
                    message: "No users available",
                    data: result?.rows
               })
          }
     }catch(err: any){
          console.error(err);
          console.error(err?.message);

          res.status(500).json({
               success: false,
               message: err?.message,
               data: null
          })
     }
})

app.get("/users/:id", async(req: Request, res: Response) => {
     const { id } = req?.params;

     try{
          const result = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);

          if(result?.rows.length > 0){
               res.status(201).json({
                    success: true, 
                    message: "User find successfully",
                    data: result?.rows[0]
               });
          }else{
               res.status(404).json({
                    success: false,
                    message: "User not available",
                    data: result?.rows
               });
          }
     }catch(err: any){
          console.error(err);
          console.error(err?.message);

          res.status(500).json({
               success: false,
               message: err?.message,
               data: null
          });
     }
})

// DELETE method
app.delete("/users/:id", async(req: Request, res: Response) => {
     const { id } = req?.params;

     try{
          const result = await pool.query(`DELETE FROM users WHERE id=$1 RETURNING *`, [id]);

          if(result?.rowCount === 0){
               res.status(404).json({
                    success: false,
                    message: "User not found. Try again.",
                    data: result?.rows
               });
          }else{
               res.status(200).json({
                    success: true,
                    message: "User deleted successfully",
                    data: result?.rows
               });
          }
     }catch(err: any) {
          console.error(err);
          console.error(err?.message);

          res.status(500).json({
               success: false,
               message: err?.message,
               data: null
          });
     }
})

// UPDATE method
app.put("/users/:id", async(req: Request, res: Response) => {
     const { id } = req?.params;
     const { name, email } = await req?.body;

     try{
          const result = await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`, [name, email, id]);

          if(result?.rowCount === 0){
               res.status(404).json({
                    success: false,
                    message: "User not found",
                    data: result?.rows
               });
          }else{
               res.status(200).json({
                    success: true,
                    message: "User updated successfully",
                    data: result?.rows[0]
               });
          }
     }catch(err: any) {
          console.error(err);
          console.error(err?.message);

          res.status(500).json({
               success: false,
               message: err?.message,
               data: null
          });
     }
})


// ===== todos =====
// POST method
app.post("/todos", async(req: Request, res: Response) => {
     const { user_id, title } = await req?.body;

     if(!user_id || !title){
          return res.status(400).json({
               success: false,
               message: "user_id & title is required",
               data: null
          });
     };

     try{
          const result = await pool.query(`INSERT INTO todos(user_id, title) VALUES($1, $2) RETURNING *`, [user_id, title]);

          res.status(201).json({
               success: true,
               message: "Todo inserted successfully",
               data: result?.rows[0]
          });
     }catch(err: any) {
          console.error(err);
          console.error(err?.message);

          res.status(500).json({
               success: false,
               message: err?.message,
               data: null
          });
     }
})

app.listen(port, () => {
     console.log(`Express Server listening on port ${port}`);
});