import express from 'express';
import 'dotenv/config';
import { registerUser } from './models/models.ts';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
const PORT: number | string = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

app.post('/api/users/register', async (req, res) => {
    try {
        // Validate user password
        // Check username uniqueness
        // Hash password before saving
        const hashedPassword: string = await hashPassword(req.body.password);
        await registerUser(req.body.username, hashedPassword);
        res.status(201).send('User registered successfully');
    }
    catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/api/users/login', (req, res) => {
    // Implement login logic here
    res.status(200).send('Login endpoint');
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});