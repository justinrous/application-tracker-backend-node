import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

try {
    await mongoose.connect(process.env.ConnectionString || 'mongodb://localhost:27017/mydatabase');
    console.log('Connected to MongoDB');
}
catch (error) {
    console.error('Error connecting to MongoDB:', error);
}

// User Table Queries
// Define Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

async function getUserPassword(username: string): Promise<string | null> {
    return User.findOne({ username }).then(user => user ? user.password : null);
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
    name: { type: String, required: true, unique: true }
});
const Category = mongoose.model('Category', categorySchema);

async function addCategory(name: string): Promise<void> {
    const newCategory = new Category({ name });
    newCategory.save()
        .then(() => console.log('Category added successfully'))
        .catch(err => {
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

async function getCategory(name: string): Promise<string | null> {
    try {
        return await Category.findOne({ name: name });
    }
    catch (error) {
        console.error('Error retrieving category:', error);
        throw error;
    }
}

async function getCategories(): Promise<string[]> {
    return Category.find().then(categories => categories.map(cat => cat.name));
}


/****************************************************************
 *  Applications Table Queries
****************************************************************/
const applicationSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    categoryName: { type: String, required: true },
    applicationDate: { type: String, required: true },
    status: { type: String, required: true },
})

const Application = mongoose.model('Application', applicationSchema);

async function addApplication(jobTitle: string, companyName: string, categoryName: string, applicationDate: string, status: string): Promise<void> {
    const newApplication = new Application({ jobTitle, companyName, categoryName, applicationDate, status, categoryName });
    newApplication.save()
        .then(() => console.log('Application added successfully'))
        .catch(err => {
            console.error('Error adding application:', err);
            throw err;
        });
}

async function deleteApplication(id: string): Promise<void> {
}

async function getApplications(): Promise<any[]> {
    return Application.find().then(applications => applications);
}

export { registerUser, getUserPassword, addCategory, removeCategory, getCategory, getCategories, addApplication, deleteApplication, getApplications };

