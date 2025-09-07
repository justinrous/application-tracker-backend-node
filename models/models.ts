import mongoose from 'mongoose';

try {
    await mongoose.connect('mongodb://127.0.0.1:27017/AppTrackerDB');
    console.log('Connected to MongoDB');
}
catch (error) {
    console.error('Error connecting to MongoDB:', error);
}

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


export { registerUser, getUserPassword };

