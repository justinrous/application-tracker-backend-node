import express from 'express';
import dotenv from 'dotenv';
// import { registerUser, getUserPassword } from './models/models.ts';
import * as model from './models/models.ts';
import type { IUser, Application, Category } from './models/models.ts';
import cors from 'cors';
import bcrypt, { compare } from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { Types } from 'mongoose';

dotenv.config();

const app = express();
const PORT: number | string = process.env.PORT || 3000;


// Initialize Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTENDURL_DEV,
    credentials: true
}));

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


/**********************************************************
 * ****************** API Endpoints ************************
 * ******************************************************/
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
    try {
        // Retreive password by username
        const user: IUser | null = await model.getUser(req.body.username);
        console.log('Retrieved hashed password from DB:', user.username);

        if (!user) {
            console.log('Invalid username or password');
            res.status(401).send('Invalid username or password');
            return;
        }
        // Compare passwords using bcrypt
        else if (await bcrypt.compare(req.body.password, user.password)) {
            console.log('Login successful');
            const jwtSecret = process.env.JWTSECRET;
            if (!jwtSecret) {
                console.error('JWT secret not configured');
                res.status(500).send('JWT secret not configured');
                return;
            }
            const token = jsonwebtoken.sign({ username: req.body.username, id: user._id?.toString() }, jwtSecret, { expiresIn: '2h' });
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
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error logging in');
    }
});

app.post('/api/users/logout', verifyJwt, (req, res) => {
    try {
        if (!req.cookies['token']) {
            return res.status(400).send('No token found');
        }
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
        res.status(200).send('Logout successful');
    }
    catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Error logging out');
    }
});

app.post('/api/applications', verifyJwt, async (req, res) => {

    try {
        // Get user ID from verified JWT
        const jwtSecret = process.env.JWTSECRET;
        if (!jwtSecret) {
            console.error('JWT secret not configured');
            res.status(500).send('JWT secret not configured');
            return;
        }
        const decoded = jsonwebtoken.verify(req.cookies['token'], jwtSecret) as { username: string, id: string };
        const userId = new Types.ObjectId(decoded.id);
        console.log('Decoded JWT:', decoded);
        const { application, category } = req.body;

        // Check if Category Exists
        const { jobTitle, companyName, applicationDate, status, categoryName, frontendId } = application;
        let existingCategory = await model.getCategoryByName(categoryName);
        if (!existingCategory) {
            await model.addCategory(category.name, category.frontendId);
        }

        // Add application with the new Category
        await model.addApplication(frontendId, jobTitle, companyName, categoryName, applicationDate, status, userId);

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
        const jwtSecret = process.env.JWTSECRET;
        if (!jwtSecret) {
            console.error('JWT secret not configured');
            res.status(500).send('JWT secret not configured');
            return;
        }
        const decoded = jsonwebtoken.verify(req.cookies['token'], jwtSecret) as { username: string, id: string };
        const userId: Types.ObjectId = new Types.ObjectId(decoded.id);

        // Retrieve applications and categories from DB
        const applications: any[] = await model.getApplicationsByUser(userId);
        const categories: Category[] = await model.getCategories();

        // Structure data for frontend
        const data: Application[] = applications.map(app => ({
            frontendId: app.frontendId,
            jobTitle: app.jobTitle,
            companyName: app.companyName,
            categoryName: app.categoryName,
            applicationDate: app.applicationDate,
            status: app.status,
        }));

        const categoriesData: Category[] = categories.map(cat => ({
            name: cat.name,
            frontendId: cat.frontendId || null
        }));

        const result = { applicationData: data, categoriesData: categoriesData };
        console.log('Result:', result);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).send('Error retrieving applications');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});