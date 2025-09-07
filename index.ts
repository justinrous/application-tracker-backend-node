import express from 'express';
import 'dotenv/config';
import { registerUser, getUserPassword } from './models/models.ts';
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

app.post('/api/users/login', async (req, res) => {
    // Retreive password by username
    const userDBHashedPassword: string | null = await getUserPassword(req.body.username);
    console.log('Retrieved hashed password from DB:', userDBHashedPassword);

    if (!userDBHashedPassword) {
        console.log('Invalid username or password');
        res.status(401).send('Invalid username or password');
        return;
    }
    // Compare passwords using bcrypt
    else if (await bcrypt.compare(req.body.password, userDBHashedPassword)) {
        console.log('Login successful');
        res.status(200).send('Login successful');
    }
    else {
        console.log('Invalid username or password');
        res.status(401).send('Invalid username or password');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});