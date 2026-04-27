import DBConnection from "../DB/connection/DB.connection.js";
import userRoutes from "../routes/user.routes.js"


const bootstrap = (app, express) => {

    app.get('/', (req, res) => res.json({ message: 'baseURL' }))
    app.use('/users' , userRoutes)
//START ROUTES







//END ROUTES

    app.use((req, res) => { // page not found // lazm tb2a a5r 7aga 
        res.status(404).json({
            message: 'Error 404 Page Not Found'
        });
    });

    DBConnection()
}

export default bootstrap