import express from 'express';
import dotenv from 'dotenv';
// import { registerUser, getUserPassword } from './models/models.ts';
import * as model from './models/models.ts';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT: number | string = process.env.PORT || 3000;


// Initialize Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors());

async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyJwt(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {

    const jwtSecret = process.env.JWTSECRET;
    if (!jwtSecret) {
        console.error('JWT secret not configured');
        return res.status(500).send('JWT secret not configured');
    }
    try {
        const decoded = jsonwebtoken.verify(req.cookies['token'], jwtSecret);
        console.log('JWT verified:', decoded);
        next();
    }
    catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).send('Invalid token');
    }
}



app.post('/api/users/register', async (req, res) => {
    try {
        // Validate user password
        // Check username uniqueness
        // Hash password before saving
        const hashedPassword: string = await hashPassword(req.body.password);
        await model.registerUser(req.body.username, hashedPassword);
        res.status(201).send('User registered successfully');
    }
    catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/api/users/login', async (req, res) => {
    // Retreive password by username
    const userDBHashedPassword: string | null = await model.getUserPassword(req.body.username);
    console.log('Retrieved hashed password from DB:', userDBHashedPassword);

    if (!userDBHashedPassword) {
        console.log('Invalid username or password');
        res.status(401).send('Invalid username or password');
        return;
    }
    // Compare passwords using bcrypt
    else if (await bcrypt.compare(req.body.password, userDBHashedPassword)) {
        console.log('Login successful');
        const jwtSecret = process.env.JWTSECRET;
        if (!jwtSecret) {
            console.error('JWT secret not configured');
            res.status(500).send('JWT secret not configured');
            return;
        }
        const token = jsonwebtoken.sign({ username: req.body.username }, jwtSecret, { expiresIn: '2h' });
        res.cookie('token', token, {
            httpOnly: true, // helps prevent XSS
            secure: process.env.NODE_ENV === 'production', // only send cookie over HTTPS in production )
            sameSite: 'strict', // CSRF protection
            maxAge: 2 * 60 * 60 * 1000 // 2 hours in ms
        });
        res.status(200).send('Login successful');
    }
    else {
        console.log('Invalid username or password');
        res.status(401).send('Invalid username or password');
    }
});

app.post('/api/applications', verifyJwt, async (req, res) => {

    /* Example request body:
    /

    type Category = {
    name: string;
    id: string;
}

type Application = {
    jobTitle: string;
    companyName: string;
    applicationDate: string;
    status: string;
    categoryName: string;
}; */

    try {
        // Check if Category Exists
        const { jobTitle, companyName, applicationDate, status, categoryName } = req.body;
        const category = await model.getCategory(categoryName);
        // If Category does not exist, Create New Category
        if (!category) {
            await model.addCategory(categoryName);
        }
        // Add application with the new Category
        await model.addApplication(jobTitle, companyName, categoryName, applicationDate, status);

        // Add new application
        res.status(201).send('Application added successfully');
    }
    catch (error) {
        console.log('Error adding application:', error);
        res.status(500).send('Error adding application');
        return;
    }
});

app.get('/api/dashboard', verifyJwt, async (req, res) => {
    try {
        const applications = await model.getApplications();
        res.status(200).json(applications);
    }
    catch (error) {
        res.status(500).send('Error retrieving applications');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});