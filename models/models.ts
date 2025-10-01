import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { Types } from 'mongoose';

// Connect to MongoDB
try {
    await mongoose.connect(process.env.ConnectionString || 'mongodb://localhost:27017/mydatabase');
    console.log('Connected to MongoDB');
}
catch (error) {
    console.error('Error connecting to MongoDB:', error);
}

/*************************************************
 ************ Types ******************************
 *************************************************/
export interface IUser {
    username: string;
    password: string;
    _id?: string;
}

export interface Application {
    _id?: string;
    frontendId?: string; // ID used by frontend (e.g., React) for rendering lists
    jobTitle: string;
    companyName: string;
    applicationDate: string;
    status: string;
    categoryName: string;
    userId?: Types.ObjectId;
}

export interface Category {
    _id?: Types.ObjectId,
    name: string;
    frontendId?: string | null; // ID used by frontend (e.g., React) for rendering lists
}



/************************************************************
************* Categories Table Queries **********************
************************************************************/
const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

async function getUser(username: string): Promise<IUser | null> {
    return User.findOne({ username });
};

async function registerUser(username: string, password: string): Promise<void> {
    const newUser = new User({ username, password });
    newUser.save()
        .then(() => console.log('User registered successfully'))
        .catch(err => {
            console.error('Error registering user:', err);
            throw err;
        });
}

/************************************************************
************* Categories Table Queries **********************
************************************************************/
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    frontendId: { type: String } // ID used by frontend (e.g., React) for rendering lists
});
const Category = mongoose.model('Category', categorySchema);

async function addCategory(name: string, frontendId: string): Promise<void> {
    const newCategory = new Category({ name, frontendId });
    newCategory.save()
        .then(() => console.log('Category added successfully'))
        .catch(err => {
            if (err.code === 11000) {
                console.log('Category already exists');
                return;
            }
            console.error('Error adding category:', err);
            throw err;
        });
}

async function removeCategory(name: string): Promise<void> {
    Category.deleteOne({ name })
        .then((result) => {
            if (result.deletedCount === 0) {
                console.log('No category found to delete');
                throw new Error('Category not found');
            } else {
                console.log('Category removed successfully');
            }
        })
        .catch(err => {
            console.error('Error removing category:', err);
            throw err;
        });
}

async function getCategories(): Promise<Category[]> {
    try {
        const categories = await Category.find();
        return categories;
    } catch (err) {
        console.error('Error retrieving categories:', err);
        throw err;
    }
}

async function getCategoryByName(name: string): Promise<Category | null> {
    try {
        const category = await Category.findOne({ name: name }).lean();
        return category as Category | null;
    }
    catch (error) {
        console.error('Error retrieving category:', error);
        throw error;
    }
}


/****************************************************************
 *  Applications Table Queries
****************************************************************/
const applicationSchema = new mongoose.Schema({
    frontendId: { type: String }, // ID used by frontend (e.g., React) for rendering lists
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    categoryName: { type: String, required: true },
    applicationDate: { type: String, required: true },
    status: { type: String, required: true },
    userId: { type: Types.ObjectId, required: true }
})

const Application = mongoose.model('Application', applicationSchema);

async function addApplication(frontendId: string, jobTitle: string, companyName: string, categoryName: string, applicationDate: string, status: string, userId: Types.ObjectId): Promise<void> {
    const newApplication = new Application({ frontendId, jobTitle, companyName, categoryName, applicationDate, status, userId });
    newApplication.save()
        .then(() => console.log('Application added successfully'))
        .catch(err => {
            console.error('Error adding application:', err);
            throw err;
        });
}

async function deleteApplication(id: string): Promise<void> {
}

async function getApplicationsByUser(userId: Types.ObjectId): Promise<any[]> {
    return Application.find({ userId: userId }).lean()
        .catch(err => {
            console.error('Error retrieving applications:', err);
            throw err;
        })
}

export { registerUser, getUser, addCategory, removeCategory, getCategories, getCategoryByName, addApplication, deleteApplication, getApplicationsByUser };

